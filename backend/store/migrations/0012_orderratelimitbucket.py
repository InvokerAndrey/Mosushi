from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0011_order_total_price_valid_range"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrderRateLimitBucket",
            fields=[
                (
                    "key",
                    models.CharField(
                        editable=False,
                        max_length=64,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "request_count",
                    models.PositiveIntegerField(default=1),
                ),
                (
                    "expires_at",
                    models.DateTimeField(db_index=True),
                ),
            ],
            options={
                "verbose_name": "Счётчик ограничения заказов",
                "verbose_name_plural": "Счётчики ограничения заказов",
            },
        ),
    ]
