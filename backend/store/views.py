import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import Category, Product, SiteSettings
from .services import OrderValidationError, create_order


@require_GET
def categories_list(request):
    categories = list(Category.objects.values("id", "name"))
    return JsonResponse(categories, safe=False)


@require_GET
def products_list(request):
    qs = Product.objects.filter(available=True).select_related("category")
    data = [
        {
            "id": p.id,
            "name": p.name,
            "price": float(p.price),
            "description": p.description,
            "weight": p.weight,
            "image": p.image.url if p.image else "",
            "category_id": p.category_id,
            "is_new": p.is_new,
        }
        for p in qs
    ]
    return JsonResponse(data, safe=False)


@require_GET
def site_settings(request):
    obj = SiteSettings.objects.first()
    if not obj:
        return JsonResponse({"phone": "", "instagram": "", "working_hours": "", "address": ""})
    return JsonResponse({
        "phone": obj.phone,
        "instagram": obj.instagram,
        "working_hours": obj.working_hours,
        "address": obj.address,
    })


@csrf_exempt
@require_POST
def create_order_view(request):
    if "application/json" not in request.content_type:
        return _error("Content-Type must be application/json.", 415)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return _error("Invalid JSON body.", 400)

    try:
        order = create_order(body)
    except OrderValidationError as exc:
        return _error(str(exc), 400)

    return JsonResponse({"message": "Order received successfully.", "orderId": order.pk}, status=201)


def _error(message: str, status: int) -> JsonResponse:
    return JsonResponse({"message": message}, status=status)
