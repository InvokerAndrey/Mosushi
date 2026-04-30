import json
import logging
from decimal import Decimal, InvalidOperation

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .constants import DELIVERY_FEE, FREE_DELIVERY_THRESHOLD
from .models import Order, Product
from .telegram import send_order_to_telegram

logger = logging.getLogger(__name__)


@require_GET
def products_list(request):
    products = Product.objects.filter(available=True).values(
        "slug", "name", "price", "ingredients", "image", "category"
    )
    data = [
        {
            "id": p["slug"],
            "name": p["name"],
            "price": float(p["price"]),
            "ingredients": p["ingredients"],
            "image": p["image"],
            "category": p["category"],
        }
        for p in products
    ]
    return JsonResponse(data, safe=False)


@csrf_exempt
@require_POST
def create_order(request):
    if "application/json" not in request.content_type:
        return _error("Content-Type must be application/json.", 415)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return _error("Invalid JSON body.", 400)

    order_type = body.get("orderType")
    cart_items = body.get("cartItems")
    client_total = body.get("totalPrice")
    pickup = body.get("pickup") or {}
    delivery = body.get("delivery") or {}

    if order_type not in ("pickup", "delivery"):
        return _error("Invalid order type.", 400)

    if not isinstance(cart_items, dict) or not cart_items:
        return _error("Cart is empty or missing.", 400)

    if not isinstance(client_total, (int, float)):
        return _error("Invalid total price.", 400)

    # Build line items from DB — never trust client-side prices
    slugs = [s for s, qty in cart_items.items() if isinstance(qty, int) and qty > 0]
    db_products = {p.slug: p for p in Product.objects.filter(slug__in=slugs, available=True)}

    line_items = []
    for slug in slugs:
        product = db_products.get(slug)
        if not product:
            continue
        qty = cart_items[slug]
        line_items.append({
            "name": product.name,
            "quantity": qty,
            "price": float(product.price),
            "lineTotal": float(product.price * qty),
        })

    if not line_items:
        return _error("Cart is empty.", 400)

    subtotal = sum(Decimal(str(item["lineTotal"])) for item in line_items)
    delivery_fee = (
        Decimal("0.00")
        if order_type == "pickup" or subtotal >= FREE_DELIVERY_THRESHOLD
        else DELIVERY_FEE
    )
    grand_total = subtotal + delivery_fee

    try:
        if abs(grand_total - Decimal(str(client_total))) > Decimal("0.01"):
            return _error("Total price mismatch.", 400)
    except InvalidOperation:
        return _error("Invalid total price.", 400)

    if order_type == "pickup":
        if not pickup.get("name", "").strip() or not pickup.get("phoneNumber", "").strip():
            return _error("Pickup name and phone are required.", 400)
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
        if (
            not delivery.get("name", "").strip()
            or not delivery.get("phoneNumber", "").strip()
            or not delivery.get("address", "").strip()
        ):
            return _error("Delivery name, phone and address are required.", 400)
        if delivery.get("paymentMethod") not in ("CASH", "CARD"):
            return _error("Invalid payment method.", 400)
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

    order.save()

    if not send_order_to_telegram(order):
        logger.warning("Order #%d saved but Telegram notification failed.", order.pk)

    return JsonResponse({"message": "Order received successfully.", "orderId": order.pk}, status=201)


def _error(message: str, status: int) -> JsonResponse:
    return JsonResponse({"message": message}, status=status)
