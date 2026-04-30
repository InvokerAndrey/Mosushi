from django.contrib import admin
from .models import Order, Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "category", "available")
    list_filter = ("category", "available")
    search_fields = ("name",)
    list_editable = ("available",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer_name", "phone", "order_type", "total_price", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("customer_name", "phone")
    list_editable = ("status",)
    readonly_fields = ("order_type", "customer_name", "phone", "address", "items",
                       "total_price", "payment_method", "change_amount", "no_change",
                       "order_time", "scheduled_time", "comment", "created_at")
    ordering = ("-created_at",)
