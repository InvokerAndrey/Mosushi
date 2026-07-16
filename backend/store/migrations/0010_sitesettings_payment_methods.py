from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0009_add_subcategory"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="payment_cash_enabled",
            field=models.BooleanField(default=True, verbose_name="Оплата наличными"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="payment_card_enabled",
            field=models.BooleanField(default=True, verbose_name="Оплата картой курьеру"),
        ),
    ]
