import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import Category, InfoBlock, Product, SiteSettings
from .rate_limit import consume_order_request
from .services import OrderValidationError, create_order


@require_GET
def categories_list(request):
    categories = Category.objects.filter(available=True).prefetch_related("subcategories")
    data = [
        {
            "id": cat.id,
            "name": cat.name,
            "subcategories": [
                {
                    "id": sub.id,
                    "name": sub.name,
                    "sort_order": sub.sort_order,
                }
                for sub in cat.subcategories.order_by("sort_order", "id")
            ],
        }
        for cat in categories
    ]
    return JsonResponse(data, safe=False)


@require_GET
def products_list(request):
    qs = Product.objects.filter(available=True).select_related("category", "subcategory")
    data = [
        {
            "id": p.id,
            "name": p.name,
            "price": float(p.price),
            "description": p.description,
            "weight": p.weight,
            "image": p.image.url if p.image else "",
            "category_id": p.category_id,
            "subcategory_id": p.subcategory_id,
            "is_new": p.is_new,
        }
        for p in qs
    ]
    return JsonResponse(data, safe=False)


@require_GET
def site_settings(request):
    obj = SiteSettings.objects.first()
    if not obj:
        return JsonResponse({
            "phone": "",
            "instagram": "",
            "opening_hour": 12,
            "closing_hour": 22,
            "address": "",
            "delivery_fee": 6.0,
            "free_delivery_threshold": 40.0,
            "contact_email": "sushimoby@mail.ru",
            "payment_cash_enabled": True,
            "payment_card_enabled": True,
        })
    return JsonResponse({
        "phone": obj.phone,
        "instagram": obj.instagram,
        "opening_hour": obj.opening_hour,
        "closing_hour": obj.closing_hour,
        "address": obj.address,
        "delivery_fee": float(obj.delivery_fee),
        "free_delivery_threshold": float(obj.free_delivery_threshold),
        "contact_email": obj.contact_email,
        "payment_cash_enabled": obj.payment_cash_enabled,
        "payment_card_enabled": obj.payment_card_enabled,
    })


@csrf_exempt
@require_POST
def create_order_view(request):
    allowed, retry_after = consume_order_request(request)
    if not allowed:
        response = _error(
            "Слишком много попыток оформления заказа. Повторите позже.",
            429,
        )
        response["Retry-After"] = str(retry_after)
        response["Cache-Control"] = "no-store"
        return response

    if "application/json" not in request.content_type:
        return _error("Неверный формат запроса. Ожидается application/json.", 415)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return _error("Не удалось прочитать данные заказа.", 400)

    try:
        order = create_order(body)
    except OrderValidationError as exc:
        return _error(str(exc), 400)

    return JsonResponse({"message": "Order received successfully.", "orderId": order.pk}, status=201)


@require_GET
def info_blocks_list(request):
    blocks = list(
        InfoBlock.objects.filter(is_active=True).order_by("order").values(
            "id", "title", "text", "icon", "type", "order"
        )
    )
    return JsonResponse(blocks, safe=False)


def _error(message: str, status: int) -> JsonResponse:
    return JsonResponse({"message": message}, status=status)
