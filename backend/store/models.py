from django.core.exceptions import ValidationError
from django.db import models


class Category(models.Model):
    name = models.CharField("Название", max_length=100)
    available = models.BooleanField("В наличии", default=True)
    order = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        ordering = ["order", "id"]

    def __str__(self):
        return self.name


class Subcategory(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        verbose_name="Категория",
        related_name="subcategories",
    )
    name = models.CharField("Название", max_length=100)
    sort_order = models.PositiveIntegerField("Порядок сортировки", default=0)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True)

    class Meta:
        verbose_name = "Подкатегория"
        verbose_name_plural = "Подкатегории"
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.category.name} → {self.name}"


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Категория",
        related_name="products",
    )
    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Подкатегория",
        related_name="products",
    )
    name = models.CharField("Название", max_length=200)
    price = models.DecimalField("Цена", max_digits=8, decimal_places=2)
    description = models.TextField("Описание / ингредиенты", blank=True)
    weight = models.CharField("Вес / объем", max_length=50, blank=True)
    image = models.ImageField("Изображение", upload_to="products/")
    available = models.BooleanField("В наличии", default=True)
    is_new = models.BooleanField("Новинка", default=False)
    order = models.PositiveIntegerField("Порядок", default=0)
    created_at = models.DateTimeField("Дата добавления", auto_now_add=True)

    class Meta:
        # "Новинка" products always come first; within each group, sorted by "Порядок", then name as fallback
        ordering = ["-is_new", "order", "name"]
        verbose_name = "Продукт"
        verbose_name_plural = "Продукты"

    def __str__(self):
        return self.name


class SiteSettings(models.Model):
    """
    Singleton model for editable site-wide settings.
    Only one instance can exist — managed via Django Admin.
    """
    phone = models.CharField("Телефон", max_length=50)
    instagram = models.URLField("Instagram", blank=True)
    opening_hour = models.IntegerField("Час открытия", default=12)
    closing_hour = models.IntegerField("Час закрытия", default=22)
    address = models.CharField("Адрес", max_length=200, blank=True)
    delivery_fee = models.DecimalField("Стоимость доставки (BYN)", max_digits=6, decimal_places=2, default=6)
    free_delivery_threshold = models.DecimalField("Бесплатная доставка от (BYN)", max_digits=6, decimal_places=2, default=40)
    contact_email = models.EmailField("Email для уведомлений о заказах", blank=True, default="sushimoby@mail.ru")

    # Payment method toggles — disable to hide from checkout and block via API
    payment_cash_enabled = models.BooleanField("Оплата наличными", default=True)
    payment_card_enabled = models.BooleanField("Оплата картой курьеру", default=True)

    class Meta:
        verbose_name = "Настройки сайта"
        verbose_name_plural = "Настройки сайта"

    def __str__(self):
        return "Настройки сайта"

    def clean(self):
        if not self.pk and SiteSettings.objects.exists():
            raise ValidationError("Можно создать только одну запись настроек сайта.")


class InfoBlock(models.Model):
    ICON_CHOICES = [
        ("local_shipping", "Доставка"),
        ("schedule", "Время"),
        ("storefront", "Самовывоз"),
        ("payments", "Оплата"),
        ("percent", "Скидка"),
        ("local_fire_department", "Горячее предложение"),
    ]
    TYPE_CHOICES = [
        ("info", "Информация"),
        ("promo", "Акция"),
    ]

    title = models.CharField("Заголовок", max_length=200)
    text = models.CharField("Дополнительный текст", max_length=300, blank=True)
    icon = models.CharField("Иконка", max_length=100, choices=ICON_CHOICES)
    type = models.CharField("Тип", max_length=10, choices=TYPE_CHOICES, default="info")
    is_active = models.BooleanField("Активен", default=True)
    order = models.PositiveIntegerField("Порядок", default=0)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True)

    class Meta:
        ordering = ["order"]
        verbose_name = "Инфо-блок"
        verbose_name_plural = "Инфо-блоки"

    def __str__(self):
        return self.title


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

    order_type = models.CharField("Тип заказа", max_length=10, choices=ORDER_TYPE_CHOICES)
    customer_name = models.CharField("Имя клиента", max_length=200)
    phone = models.CharField("Телефон", max_length=50)
    # Empty string for pickup orders
    address = models.TextField("Адрес доставки", blank=True)

    # Full cart snapshot: [{"name": ..., "quantity": ..., "price": ..., "lineTotal": ...}]
    items = models.JSONField("Состав заказа")
    total_price = models.DecimalField("Сумма", max_digits=10, decimal_places=2)

    payment_method = models.CharField("Способ оплаты", max_length=10, blank=True)
    change_amount = models.CharField("Сдача с", max_length=50, blank=True)
    no_change = models.BooleanField("Без сдачи", default=False)

    order_time = models.CharField("Время заказа", max_length=10, default="asap")
    scheduled_time = models.CharField("Запланированное время", max_length=100, blank=True)

    comment = models.TextField("Комментарий", blank=True)
    status = models.CharField("Статус", max_length=20, choices=STATUS_CHOICES, default="new")
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"

    def __str__(self):
        return f"#{self.pk} — {self.customer_name} ({self.created_at.strftime('%d.%m.%Y %H:%M')})"
