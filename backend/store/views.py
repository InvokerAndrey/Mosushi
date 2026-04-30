import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import Product
from .services import OrderValidationError, create_order


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
