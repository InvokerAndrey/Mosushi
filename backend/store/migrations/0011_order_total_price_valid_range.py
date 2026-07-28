from decimal import Decimal

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0010_sitesettings_payment_methods"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="total_price",
            field=models.DecimalField(
                decimal_places=2,
                max_digits=10,
                validators=[
                    django.core.validators.MinValueValidator(Decimal("0.00")),
                    django.core.validators.MaxValueValidator(Decimal("99999999.99")),
                ],
                verbose_name="Сумма",
            ),
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    total_price__gte=Decimal("0.00"),
                    total_price__lte=Decimal("99999999.99"),
                ),
                name="store_order_total_price_valid_range",
            ),
        ),
    ]
