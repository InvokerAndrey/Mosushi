from django.contrib import admin
from .models import Product, Order


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "available")
    list_filter = ("category", "available")
    search_fields = ("name",)
    # Allow toggling availability directly from the list view
    list_editable = ("available",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer_name", "phone", "order_type", "total_price", "status", "created_at")
    list_filter = ("status", "order_type")
    search_fields = ("customer_name", "phone", "address")
    readonly_fields = ("items", "total_price", "created_at")
    # Allow updating order status from the list view
    list_editable = ("status",)
    ordering = ("-created_at",)
