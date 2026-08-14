"""
Business logic for order creation.
Views are thin — all processing, validation, and side effects happen here.
"""

import logging
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

from django.db import close_old_connections, transaction
from django.utils import timezone

from .email_service import send_order_email
from .models import MAX_ORDER_TOTAL, Order, Product, SiteSettings
from .telegram import send_order_to_telegram
from .utils import get_asap_delivery_error, get_asap_pickup_error, is_asap_order_allowed

logger = logging.getLogger(__name__)

_notification_executor = ThreadPoolExecutor(
    max_workers=2,
    thread_name_prefix="order-notification",
)

DELIVERY_FEE_FALLBACK = Decimal("6.00")
FREE_DELIVERY_THRESHOLD_FALLBACK = Decimal("40.00")
MAX_CART_LINE_ITEMS = 100
MAX_ITEM_QUANTITY = 100
MAX_PRODUCT_ID = (1 << 63) - 1
OPENING_HOUR_FALLBACK = 12
CLOSING_HOUR_FALLBACK = 22
SCHEDULE_SLOT_MINUTES = 15
MAX_SCHEDULE_DAYS_AHEAD = 30
PICKUP_LEAD_MINUTES = 30
DELIVERY_LEAD_MINUTES = 60
SCHEDULED_TIME_PATTERN = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T"
    r"[0-9]{2}:[0-9]{2}(?::[0-9]{2}(?:\.[0-9]{1,6})?)?"
    r"(?:Z|[+-][0-9]{2}:[0-9]{2})$"
)


class OrderValidationError(Exception):
    """Raised when incoming order data fails validation."""
    pass


def _send_order_notifications(order_id: int) -> None:
    """Send external notifications outside the order request lifecycle."""
    close_old_connections()
    try:
        order = Order.objects.get(pk=order_id)

        if not send_order_to_telegram(order):
            logger.warning("Order #%d saved, but Telegram notification failed.", order.pk)

        if not send_order_email(order):
            logger.warning("Order #%d saved, but email notification failed.", order.pk)
    except Exception:
        logger.exception("Order #%d: unexpected notification error.", order_id)
    finally:
        close_old_connections()


def _enqueue_order_notifications(order_id: int) -> None:
    try:
        _notification_executor.submit(_send_order_notifications, order_id)
    except RuntimeError:
        logger.exception("Order #%d: could not enqueue notifications.", order_id)


def _validate_order_timing(
    payload: dict,
    *,
    order_label: str,
    opening_hour: int,
    closing_hour: int,
    lead_minutes: int,
    schedule_start_minutes: int,
) -> tuple[str, str]:
    """Validate and normalize an ASAP or scheduled order time."""
    order_time = payload.get("orderTime", "asap")
    if order_time not in ("asap", "specific"):
        raise OrderValidationError("Выберите допустимый вариант времени заказа.")

    if order_time == "asap":
        local_now = timezone.localtime(timezone.now())
        if not is_asap_order_allowed(opening_hour, closing_hour, local_now):
            error_factory = (
                get_asap_pickup_error
                if order_label == "самовывоза"
                else get_asap_delivery_error
            )
            raise OrderValidationError(error_factory(opening_hour, closing_hour))
        return "asap", ""

    raw_scheduled_time = payload.get("scheduledTime")
    if (
        not isinstance(raw_scheduled_time, str)
        or not raw_scheduled_time
        or len(raw_scheduled_time) > 64
    ):
        raise OrderValidationError(f"Выберите время {order_label}.")

    if not SCHEDULED_TIME_PATTERN.fullmatch(raw_scheduled_time):
        raise OrderValidationError(
            f"Время {order_label} имеет неверный формат."
        )

    try:
        scheduled = datetime.fromisoformat(raw_scheduled_time.replace("Z", "+00:00"))
    except ValueError as exc:
        raise OrderValidationError(
            f"Время {order_label} имеет неверный формат."
        ) from exc

    if timezone.is_naive(scheduled):
        raise OrderValidationError(
            f"Время {order_label} должно содержать часовой пояс."
        )

    local_scheduled = timezone.localtime(scheduled)
    if (
        local_scheduled.second != 0
        or local_scheduled.microsecond != 0
        or local_scheduled.minute % SCHEDULE_SLOT_MINUTES != 0
    ):
        raise OrderValidationError(
            f"Время {order_label} должно быть выбрано с шагом "
            f"{SCHEDULE_SLOT_MINUTES} минут."
        )

    local_now = timezone.localtime(timezone.now())
    earliest_time = local_now + timedelta(minutes=lead_minutes)
    if local_scheduled < earliest_time:
        raise OrderValidationError(
            f"Выбранное время {order_label} уже прошло или находится слишком близко."
        )

    latest_date = local_now.date() + timedelta(days=MAX_SCHEDULE_DAYS_AHEAD)
    if local_scheduled.date() > latest_date:
        raise OrderValidationError(
            f"Время {order_label} можно выбрать не более чем на "
            f"{MAX_SCHEDULE_DAYS_AHEAD} дней вперёд."
        )

    scheduled_minutes = local_scheduled.hour * 60 + local_scheduled.minute
    closing_minutes = closing_hour * 60
    if not schedule_start_minutes <= scheduled_minutes <= closing_minutes:
        start_hour, start_minute = divmod(schedule_start_minutes, 60)
        raise OrderValidationError(
            f"Время {order_label} должно быть с "
            f"{start_hour:02d}:{start_minute:02d} до {closing_hour:02d}:00."
        )

    return "specific", local_scheduled.isoformat(timespec="minutes")


def create_order(body: dict) -> Order:
    """
    Validate, persist, and notify for a new order.

    Cart keys are string product IDs (e.g. {"1": 2, "3": 1}).
    Prices always come from the database — never from the client.

    Args:
        body: Parsed JSON payload from the POST /order request.

    Returns:
        The saved Order instance.

    Raises:
        OrderValidationError: If any required field is missing or invalid.
    """
    order_type = body.get("orderType")
    cart_items = body.get("cartItems")
    client_total = body.get("totalPrice")
    pickup = body.get("pickup") or {}
    delivery = body.get("delivery") or {}

    # --- Top-level validation ---
    if order_type not in ("pickup", "delivery"):
        raise OrderValidationError("Неверный тип заказа.")

    if not isinstance(cart_items, dict) or not cart_items:
        raise OrderValidationError("Корзина пуста или не передана.")

    if isinstance(client_total, bool) or not isinstance(client_total, (int, float)):
        raise OrderValidationError("Итоговая сумма должна быть числом.")

    try:
        client_total_decimal = Decimal(str(client_total))
    except InvalidOperation as exc:
        raise OrderValidationError("Итоговая сумма имеет неверный формат.") from exc

    if not client_total_decimal.is_finite():
        raise OrderValidationError("Итоговая сумма имеет недопустимое значение.")

    # --- Fetch SiteSettings once for this request ---
    settings = SiteSettings.objects.first()
    delivery_fee_value = settings.delivery_fee if settings else DELIVERY_FEE_FALLBACK
    free_delivery_threshold = settings.free_delivery_threshold if settings else FREE_DELIVERY_THRESHOLD_FALLBACK
    opening_hour = settings.opening_hour if settings else OPENING_HOUR_FALLBACK
    closing_hour = settings.closing_hour if settings else CLOSING_HOUR_FALLBACK

    # --- Build line items — prices always come from the DB, never the client ---
    if len(cart_items) > MAX_CART_LINE_ITEMS:
        raise OrderValidationError(
            f"В корзине не может быть больше {MAX_CART_LINE_ITEMS} разных товаров."
        )

    entries = []
    seen_product_ids = set()
    for raw_product_id, quantity in cart_items.items():
        product_id_text = str(raw_product_id)
        if not product_id_text.isascii() or not product_id_text.isdecimal():
            raise OrderValidationError("Корзина содержит товар с неверным идентификатором.")

        product_id = int(product_id_text)
        if product_id <= 0 or product_id > MAX_PRODUCT_ID:
            raise OrderValidationError("Корзина содержит товар с неверным идентификатором.")

        if product_id in seen_product_ids:
            raise OrderValidationError("Корзина содержит повторяющийся идентификатор товара.")

        if (
            isinstance(quantity, bool)
            or not isinstance(quantity, int)
            or quantity < 1
            or quantity > MAX_ITEM_QUANTITY
        ):
            raise OrderValidationError(
                f"Количество товара должно быть от 1 до {MAX_ITEM_QUANTITY}."
            )

        entries.append((product_id, quantity))
        seen_product_ids.add(product_id)

    product_ids = [pid for pid, _ in entries]
    db_products = {p.id: p for p in Product.objects.filter(id__in=product_ids, available=True)}

    line_items = []
    subtotal = Decimal("0.00")
    for product_id, qty in entries:
        product = db_products.get(product_id)
        if not product:
            continue
        line_total = product.price * qty
        subtotal += line_total
        line_items.append({
            "name": product.name,
            "quantity": qty,
            "price": float(product.price),
            "lineTotal": float(line_total),
        })

    if not line_items:
        raise OrderValidationError("В корзине нет доступных товаров.")

    # --- Server-side total calculation ---
    delivery_fee = (
        Decimal("0.00")
        if order_type == "pickup" or subtotal >= free_delivery_threshold
        else delivery_fee_value
    )
    grand_total = subtotal + delivery_fee

    if not grand_total.is_finite() or grand_total < Decimal("0.00") or grand_total > MAX_ORDER_TOTAL:
        raise OrderValidationError("Итоговая сумма заказа выходит за допустимый диапазон.")

    # Verify the client-submitted total (allow ±1 cent for float drift)
    if abs(grand_total - client_total_decimal) > Decimal("0.01"):
        raise OrderValidationError(
            "Итоговая сумма изменилась. Обновите страницу и повторите заказ."
        )

    # --- Order-type-specific validation and object construction ---
    if order_type == "pickup":
        if not pickup.get("name", "").strip():
            raise OrderValidationError("Укажите имя для самовывоза.")
        if not pickup.get("phoneNumber", "").strip():
            raise OrderValidationError("Укажите номер телефона для самовывоза.")

        order_time, scheduled_time = _validate_order_timing(
            pickup,
            order_label="самовывоза",
            opening_hour=opening_hour,
            closing_hour=closing_hour,
            lead_minutes=PICKUP_LEAD_MINUTES,
            schedule_start_minutes=opening_hour * 60 + PICKUP_LEAD_MINUTES,
        )

        order = Order(
            order_type="pickup",
            customer_name=pickup["name"].strip(),
            phone=pickup["phoneNumber"].strip(),
            address="",
            items=line_items,
            total_price=grand_total,
            order_time=order_time,
            scheduled_time=scheduled_time,
            comment=(pickup.get("comment") or "").strip(),
        )
    else:
        if not delivery.get("name", "").strip():
            raise OrderValidationError("Укажите имя для доставки.")
        if not delivery.get("phoneNumber", "").strip():
            raise OrderValidationError("Укажите номер телефона для доставки.")
        if not delivery.get("address", "").strip():
            raise OrderValidationError("Укажите адрес доставки.")
        payment_method = delivery.get("paymentMethod")
        if payment_method not in ("CASH", "CARD"):
            raise OrderValidationError("Выберите доступный способ оплаты.")
        if payment_method == "CASH" and settings and not settings.payment_cash_enabled:
            raise OrderValidationError("Оплата наличными сейчас недоступна.")
        if payment_method == "CARD" and settings and not settings.payment_card_enabled:
            raise OrderValidationError("Оплата картой сейчас недоступна.")

        order_time, scheduled_time = _validate_order_timing(
            delivery,
            order_label="доставки",
            opening_hour=opening_hour,
            closing_hour=closing_hour,
            lead_minutes=DELIVERY_LEAD_MINUTES,
            schedule_start_minutes=(opening_hour + 1) * 60,
        )

        order = Order(
            order_type="delivery",
            customer_name=delivery["name"].strip(),
            phone=delivery["phoneNumber"].strip(),
            address=delivery["address"].strip(),
            items=line_items,
            total_price=grand_total,
            payment_method=payment_method,
            change_amount=(delivery.get("changeAmount") or "").strip(),
            no_change=bool(delivery.get("noChange", False)),
            order_time=order_time,
            scheduled_time=scheduled_time,
            comment=(delivery.get("comment") or "").strip(),
        )

    # --- Persist ---
    order.save()
    logger.info("Order #%d created: %s %s", order.pk, order.order_type, order.customer_name)

    # External services must not delay the HTTP response. If create_order is
    # called inside an atomic block, enqueue only after the order is committed.
    transaction.on_commit(
        lambda order_id=order.pk: _enqueue_order_notifications(order_id)
    )

    return order
