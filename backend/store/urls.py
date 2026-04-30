from django.urls import path
from . import views

urlpatterns = [
    path("products/", views.products_list, name="products-list"),
    path("order/", views.create_order_view, name="create-order"),
]
