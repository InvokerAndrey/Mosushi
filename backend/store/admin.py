from django.contrib import admin
from django.utils.html import format_html

from .models import Category, InfoBlock, Order, Product, SiteSettings


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "available")
    list_editable = ("available",)
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "weight", "available", "is_new", "image_preview")
    list_filter = ("category", "available", "is_new")
    search_fields = ("name",)
    list_editable = ("available", "is_new")

    @admin.display(description="Фото")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:50px;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """
    Singleton admin — only one SiteSettings record is allowed.
    Adding is blocked when a record already exists.
    Deletion is blocked to prevent accidental removal.
    """

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(InfoBlock)
class InfoBlockAdmin(admin.ModelAdmin):
    list_display = ("order", "title", "icon", "type", "is_active")
    list_display_links = ("title",)
    list_editable = ("order", "is_active")
    list_filter = ("type", "is_active")
    search_fields = ("title",)
    ordering = ("order",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer_name", "phone", "order_type", "total_price", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("customer_name", "phone")
    list_editable = ("status",)
    readonly_fields = (
        "order_type", "customer_name", "phone", "address", "items",
        "total_price", "payment_method", "change_amount", "no_change",
        "order_time", "scheduled_time", "comment", "created_at",
    )
    ordering = ("-created_at",)
