from django.core.management.base import BaseCommand

from store.models import Category

DEFAULT_CATEGORIES = ["Суши", "Сеты", "Соусы", "Напитки"]


class Command(BaseCommand):
    help = "Create default product categories. Safe to run multiple times."

    def handle(self, *args, **options):
        created_count = 0
        for name in DEFAULT_CATEGORIES:
            _, created = Category.objects.get_or_create(name=name)
            if created:
                created_count += 1
                self.stdout.write(f'  Created: "{name}"')

        if created_count:
            self.stdout.write(self.style.SUCCESS(f"Done. {created_count} categories created."))
        else:
            self.stdout.write("All default categories already exist.")
