from django.db import models


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("sushi", "Суши"),
        ("sets", "Сеты"),
        ("sauces", "Соусы"),
        ("drinks", "Напитки"),
    ]

    # "slug" is the cart key used in the frontend (e.g. "salmon-delight")
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    # ingredients stored as a JSON list: ["Salmon", "Avocado", ...]
    ingredients = models.JSONField(default=list)
    # relative URL path served by Next.js, e.g. "/sushi/salmon-delight.svg"
    image = models.CharField(max_length=500)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    available = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "name"]
        verbose_name = "Продукт"
        verbose_name_plural = "Продукты"

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_CHOICES = [
        ("new", "Новый"),
        ("processing", "В обработке"),
        ("delivered", "Доставлен"),
    ]
    ORDER_TYPE_CHOICES = [
        ("pickup", "Самовывоз"),
        ("delivery", "Доставка"),
    ]

    order_type = models.CharField(max_length=10, choices=ORDER_TYPE_CHOICES)
    customer_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50)
    # address is empty string for pickup orders
    address = models.TextField(blank=True)

    # Full cart snapshot: [{"name": ..., "quantity": ..., "price": ..., "lineTotal": ...}]
    items = models.JSONField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Payment details (relevant for delivery orders)
    payment_method = models.CharField(max_length=10, blank=True)  # "CASH" | "CARD" | ""
    change_amount = models.CharField(max_length=50, blank=True)
    no_change = models.BooleanField(default=False)

    # Scheduling
    order_time = models.CharField(max_length=10, default="asap")  # "asap" | "specific"
    scheduled_time = models.CharField(max_length=100, blank=True)

    comment = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"

    def __str__(self):
        return f"#{self.pk} — {self.customer_name} ({self.created_at.strftime('%d.%m.%Y %H:%M')})"
