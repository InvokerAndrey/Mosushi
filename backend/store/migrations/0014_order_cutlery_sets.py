import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0013_sitesettings_order_success_message"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="cutlery_sets",
            field=models.PositiveSmallIntegerField(
                default=0,
                verbose_name="Комплекты палочек",
                validators=[django.core.validators.MaxValueValidator(100)],
            ),
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.CheckConstraint(
                condition=models.Q(cutlery_sets__gte=0, cutlery_sets__lte=100),
                name="store_order_cutlery_sets_valid_range",
            ),
        ),
    ]
