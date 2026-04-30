"""
Management command: seed_products

Populates the database with the initial menu items that were previously
hardcoded in the Next.js frontend (data/sushiMenu.ts).

Usage:
    python manage.py seed_products
    python manage.py seed_products --clear   # wipe existing products first
"""

from django.core.management.base import BaseCommand
from store.models import Product

PRODUCTS = [
    # ── SUSHI ──────────────────────────────────────────────────────────────
    {
        "slug": "salmon-delight",
        "name": "Salmon Delight Roll",
        "price": "12.90",
        "ingredients": ["Salmon", "Avocado", "Cucumber", "Sesame"],
        "image": "/sushi/salmon-delight.svg",
        "category": "sushi",
    },
    {
        "slug": "tuna-crunch",
        "name": "Tuna Crunch Roll",
        "price": "13.50",
        "ingredients": ["Tuna", "Tempura Flakes", "Spicy Mayo", "Nori"],
        "image": "/sushi/tuna-crunch.svg",
        "category": "sushi",
    },
    {
        "slug": "shrimp-tempura",
        "name": "Shrimp Tempura Roll",
        "price": "14.20",
        "ingredients": ["Shrimp Tempura", "Carrot", "Cucumber", "Eel Sauce"],
        "image": "/sushi/shrimp-tempura.svg",
        "category": "sushi",
    },
    {
        "slug": "veggie-garden",
        "name": "Veggie Garden Roll",
        "price": "10.80",
        "ingredients": ["Avocado", "Cucumber", "Carrot", "Cream Cheese"],
        "image": "/sushi/veggie-garden.svg",
        "category": "sushi",
    },
    {
        "slug": "dragon-roll",
        "name": "Dragon Roll",
        "price": "15.40",
        "ingredients": ["Eel", "Avocado", "Cucumber", "Unagi Sauce"],
        "image": "/sushi/dragon-roll.svg",
        "category": "sushi",
    },
    {
        "slug": "spicy-salmon",
        "name": "Spicy Salmon Roll",
        "price": "13.80",
        "ingredients": ["Salmon", "Sriracha", "Spring Onion", "Nori"],
        "image": "/sushi/spicy-salmon.svg",
        "category": "sushi",
    },
    # ── SETS ───────────────────────────────────────────────────────────────
    {
        "slug": "classic-set",
        "name": "Classic Set",
        "price": "28.50",
        "ingredients": ["16 pcs", "Salmon Nigiri", "Tuna Roll", "California Roll"],
        "image": "/sushi/salmon-delight.svg",
        "category": "sets",
    },
    {
        "slug": "family-set",
        "name": "Family Set",
        "price": "42.00",
        "ingredients": ["32 pcs", "Dragon Roll", "Philadelphia", "Tempura Mix"],
        "image": "/sushi/dragon-roll.svg",
        "category": "sets",
    },
    {
        "slug": "love-set",
        "name": "Love Set",
        "price": "35.00",
        "ingredients": ["24 pcs", "Heart-shaped", "Salmon", "Avocado"],
        "image": "/sushi/veggie-garden.svg",
        "category": "sets",
    },
    # ── SAUCES ─────────────────────────────────────────────────────────────
    {
        "slug": "soy-sauce",
        "name": "Soy Sauce",
        "price": "1.50",
        "ingredients": ["Classic Japanese soy sauce", "50ml"],
        "image": "/sushi/tuna-crunch.svg",
        "category": "sauces",
    },
    {
        "slug": "spicy-mayo-sauce",
        "name": "Spicy Mayo",
        "price": "2.00",
        "ingredients": ["Creamy spicy mayonnaise", "50ml"],
        "image": "/sushi/spicy-salmon.svg",
        "category": "sauces",
    },
    {
        "slug": "unagi-sauce",
        "name": "Unagi Sauce",
        "price": "2.50",
        "ingredients": ["Sweet eel glaze", "50ml"],
        "image": "/sushi/shrimp-tempura.svg",
        "category": "sauces",
    },
    # ── DRINKS ─────────────────────────────────────────────────────────────
    {
        "slug": "green-tea",
        "name": "Green Tea",
        "price": "3.50",
        "ingredients": ["Hot Japanese green tea", "300ml"],
        "image": "/sushi/veggie-garden.svg",
        "category": "drinks",
    },
    {
        "slug": "coca-cola",
        "name": "Coca-Cola",
        "price": "3.00",
        "ingredients": ["Classic Coke", "330ml can"],
        "image": "/sushi/salmon-delight.svg",
        "category": "drinks",
    },
    {
        "slug": "sparkling-water",
        "name": "Sparkling Water",
        "price": "2.50",
        "ingredients": ["Mineral sparkling water", "500ml"],
        "image": "/sushi/tuna-crunch.svg",
        "category": "drinks",
    },
]


class Command(BaseCommand):
    help = "Seed the database with the initial menu products."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing products before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = Product.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing product(s)."))

        created = 0
        skipped = 0

        for data in PRODUCTS:
            _, was_created = Product.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "price": data["price"],
                    "ingredients": data["ingredients"],
                    "image": data["image"],
                    "category": data["category"],
                    "available": True,
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created}, already existed (skipped): {skipped}."
            )
        )
