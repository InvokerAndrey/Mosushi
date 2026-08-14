from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0012_orderratelimitbucket"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="order_success_message",
            field=models.TextField(
                default="Заказ успешно оформлен! Мы скоро свяжемся с вами.",
                verbose_name="Сообщение после успешного оформления заказа",
            ),
        ),
    ]
