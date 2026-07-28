"""
Business logic for order creation.
Views are thin — all processing, validation, and side effects happen here.
"""

import logging
from decimal import Decimal, InvalidOperation

from django.utils import timezone

from .email_service import send_order_email
from .models import MAX_ORDER_TOTAL, Order, Product, SiteSettings
from .telegram import send_order_to_telegram
from .utils import get_asap_delivery_error, get_asap_pickup_error, is_asap_order_allowed

logger = logging.getLogger(__name__)

DELIVERY_FEE_FALLBACK = Decimal("6.00")
FREE_DELIVERY_THRESHOLD_FALLBACK = Decimal("40.00")
MAX_CART_LINE_ITEMS = 100
MAX_ITEM_QUANTITY = 100
MAX_PRODUCT_ID = (1 << 63) - 1


class OrderValidationError(Exception):
    """Raised when incoming order data fails validation."""
    pass


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

        # ASAP pickup: reject if outside working hours
        if pickup.get("orderTime", "asap") == "asap" and settings:
            local_now = timezone.localtime(timezone.now())
            if not is_asap_order_allowed(settings.opening_hour, settings.closing_hour, local_now):
                raise OrderValidationError(
                    get_asap_pickup_error(settings.opening_hour, settings.closing_hour)
                )

        order = Order(
            order_type="pickup",
            customer_name=pickup["name"].strip(),
            phone=pickup["phoneNumber"].strip(),
            address="",
            items=line_items,
            total_price=grand_total,
            order_time=pickup.get("orderTime", "asap"),
            scheduled_time=pickup.get("scheduledTime") or "",
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

        # ASAP delivery: reject if outside working hours
        if delivery.get("orderTime", "asap") == "asap" and settings:
            local_now = timezone.localtime(timezone.now())
            if not is_asap_order_allowed(settings.opening_hour, settings.closing_hour, local_now):
                raise OrderValidationError(
                    get_asap_delivery_error(settings.opening_hour, settings.closing_hour)
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
            order_time=delivery.get("orderTime", "asap"),
            scheduled_time=delivery.get("scheduledTime") or "",
            comment=(delivery.get("comment") or "").strip(),
        )

    # --- Persist ---
    order.save()
    logger.info("Order #%d created: %s %s", order.pk, order.order_type, order.customer_name)

    # --- Telegram notification (never blocks or cancels the order on failure) ---
    if not send_order_to_telegram(order):
        logger.warning("Order #%d saved, but Telegram notification failed.", order.pk)

    # --- Email notification (never blocks or cancels the order on failure) ---
    if not send_order_email(order):
        logger.warning("Order #%d saved, but email notification failed.", order.pk)

    return order
