from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0008_add_order_to_product"),
    ]

    operations = [
        migrations.CreateModel(
            name="Subcategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subcategories",
                        to="store.category",
                        verbose_name="Категория",
                    ),
                ),
                ("name", models.CharField(max_length=100, verbose_name="Название")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="Порядок сортировки")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Дата обновления")),
            ],
            options={
                "verbose_name": "Подкатегория",
                "verbose_name_plural": "Подкатегории",
                "ordering": ["sort_order", "id"],
            },
        ),
        migrations.AddField(
            model_name="product",
            name="subcategory",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="products",
                to="store.subcategory",
                verbose_name="Подкатегория",
            ),
        ),
    ]
