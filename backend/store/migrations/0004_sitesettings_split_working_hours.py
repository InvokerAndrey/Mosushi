from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0003_info_block_model'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sitesettings',
            name='working_hours',
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='opening_hour',
            field=models.IntegerField(default=12, verbose_name='Час открытия'),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='closing_hour',
            field=models.IntegerField(default=22, verbose_name='Час закрытия'),
        ),
    ]
