"""
Business logic for order creation.
Views are thin — all processing, validation, and side effects happen here.
"""

import logging
from decimal import Decimal, InvalidOperation

from django.utils import timezone

from .constants import DELIVERY_FEE, FREE_DELIVERY_THRESHOLD
from .email_service import send_order_email
from .models import Order, Product, SiteSettings
from .telegram import send_order_to_telegram
from .utils import get_asap_delivery_error, get_asap_pickup_error, is_asap_order_allowed

logger = logging.getLogger(__name__)


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
        raise OrderValidationError("Invalid order type.")

    if not isinstance(cart_items, dict) or not cart_items:
        raise OrderValidationError("Cart is empty or missing.")

    if not isinstance(client_total, (int, float)):
        raise OrderValidationError("totalPrice must be a number.")

    # --- Build line items — prices always come from the DB, never the client ---
    entries = [
        (int(pid), qty)
        for pid, qty in cart_items.items()
        if str(pid).isdigit() and isinstance(qty, int) and qty > 0
    ]

    if not entries:
        raise OrderValidationError("Cart contains no valid products.")

    product_ids = [pid for pid, _ in entries]
    db_products = {p.id: p for p in Product.objects.filter(id__in=product_ids, available=True)}

    line_items = []
    for product_id, qty in entries:
        product = db_products.get(product_id)
        if not product:
            continue
        line_items.append({
            "name": product.name,
            "quantity": qty,
            "price": float(product.price),
            "lineTotal": float(product.price * qty),
        })

    if not line_items:
        raise OrderValidationError("Cart contains no valid products.")

    # --- Server-side total calculation ---
    subtotal = sum(Decimal(str(item["lineTotal"])) for item in line_items)
    delivery_fee = (
        Decimal("0.00")
        if order_type == "pickup" or subtotal >= FREE_DELIVERY_THRESHOLD
        else DELIVERY_FEE
    )
    grand_total = subtotal + delivery_fee

    # Verify the client-submitted total (allow ±1 cent for float drift)
    try:
        if abs(grand_total - Decimal(str(client_total))) > Decimal("0.01"):
            raise OrderValidationError("Total price mismatch.")
    except InvalidOperation:
        raise OrderValidationError("totalPrice is not a valid number.")

    # --- Order-type-specific validation and object construction ---
    if order_type == "pickup":
        if not pickup.get("name", "").strip():
            raise OrderValidationError("Pickup: name is required.")
        if not pickup.get("phoneNumber", "").strip():
            raise OrderValidationError("Pickup: phone is required.")

        # ASAP pickup: reject if outside working hours
        if pickup.get("orderTime", "asap") == "asap":
            settings = SiteSettings.objects.first()
            if settings:
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
            raise OrderValidationError("Delivery: name is required.")
        if not delivery.get("phoneNumber", "").strip():
            raise OrderValidationError("Delivery: phone is required.")
        if not delivery.get("address", "").strip():
            raise OrderValidationError("Delivery: address is required.")
        if delivery.get("paymentMethod") not in ("CASH", "CARD"):
            raise OrderValidationError("Invalid payment method.")

        # ASAP delivery: reject if outside working hours
        if delivery.get("orderTime", "asap") == "asap":
            settings = SiteSettings.objects.first()
            if settings:
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
            payment_method=delivery["paymentMethod"],
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
