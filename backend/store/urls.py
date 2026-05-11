from django.urls import path
from . import views

urlpatterns = [
    path("categories/", views.categories_list, name="categories-list"),
    path("products/", views.products_list, name="products-list"),
    path("site-settings/", views.site_settings, name="site-settings"),
    path("info-blocks/", views.info_blocks_list, name="info-blocks-list"),
    path("order/", views.create_order_view, name="create-order"),
]
