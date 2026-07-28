import json
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from store.models import MAX_ORDER_TOTAL, Category, Order, Product
from store.services import (
    MAX_CART_LINE_ITEMS,
    MAX_ITEM_QUANTITY,
    OrderValidationError,
    create_order,
)


class OrderLimitTests(TestCase):
    def setUp(self):
        category = Category.objects.create(name="Test")
        self.product = Product.objects.create(
            category=category,
            name="Test product",
            price=Decimal("10.00"),
            image="products/test.png",
        )

    def pickup_body(self, cart_items, total_price):
        scheduled = timezone.localtime(timezone.now()) + timedelta(days=1)
        scheduled = scheduled.replace(hour=13, minute=0, second=0, microsecond=0)
        return {
            "orderType": "pickup",
            "cartItems": cart_items,
            "totalPrice": total_price,
            "pickup": {
                "name": "Test customer",
                "phoneNumber": "+375290000000",
                "orderTime": "specific",
                "scheduledTime": scheduled.isoformat(timespec="minutes"),
            },
        }

    @patch("store.services.send_order_email", return_value=True)
    @patch("store.services.send_order_to_telegram", return_value=True)
    def test_valid_order_at_quantity_limit_remains_readable(self, _telegram, _email):
        expected_total = self.product.price * MAX_ITEM_QUANTITY

        order = create_order(
            self.pickup_body(
                {str(self.product.pk): MAX_ITEM_QUANTITY},
                float(expected_total),
            )
        )

        saved_order = Order.objects.get(pk=order.pk)
        self.assertEqual(saved_order.total_price, expected_total)
        self.assertEqual(saved_order.items[0]["quantity"], MAX_ITEM_QUANTITY)

    def test_rejects_quantity_above_limit_before_saving(self):
        with self.assertRaisesRegex(OrderValidationError, "Количество товара должно быть"):
            create_order(
                self.pickup_body(
                    {str(self.product.pk): MAX_ITEM_QUANTITY + 1},
                    0,
                )
            )

        self.assertFalse(Order.objects.exists())

    def test_rejects_original_extreme_quantity_scenario(self):
        with self.assertRaisesRegex(OrderValidationError, "Количество товара должно быть"):
            create_order(
                self.pickup_body(
                    {str(self.product.pk): 10**100},
                    1e101,
                )
            )

        self.assertFalse(Order.objects.exists())

    def test_order_endpoint_returns_400_for_extreme_quantity(self):
        response = self.client.post(
            "/order/",
            data=json.dumps(
                self.pickup_body(
                    {str(self.product.pk): 10**100},
                    1e101,
                )
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"],
            f"Количество товара должно быть от 1 до {MAX_ITEM_QUANTITY}.",
        )
        self.assertFalse(Order.objects.exists())

    def test_rejects_too_many_distinct_cart_entries(self):
        oversized_cart = {
            str(product_id): 1
            for product_id in range(1, MAX_CART_LINE_ITEMS + 2)
        }

        with self.assertRaisesRegex(OrderValidationError, "разных товаров"):
            create_order(self.pickup_body(oversized_cart, 0))

        self.assertFalse(Order.objects.exists())

    def test_rejects_total_overflow_split_across_products(self):
        expensive_product = Product.objects.create(
            category=self.product.category,
            name="Expensive product",
            price=Decimal("999999.99"),
            image="products/expensive.png",
        )
        another_expensive_product = Product.objects.create(
            category=self.product.category,
            name="Another expensive product",
            price=Decimal("999999.99"),
            image="products/another-expensive.png",
        )

        with self.assertRaisesRegex(OrderValidationError, "выходит за допустимый диапазон"):
            create_order(
                self.pickup_body(
                    {
                        str(expensive_product.pk): MAX_ITEM_QUANTITY,
                        str(another_expensive_product.pk): MAX_ITEM_QUANTITY,
                    },
                    199999998.0,
                )
            )

        self.assertFalse(Order.objects.exists())

    def test_database_constraint_rejects_total_above_field_capacity(self):
        with self.assertRaises(IntegrityError):
            Order.objects.create(
                order_type="pickup",
                customer_name="Test customer",
                phone="+375290000000",
                items=[],
                total_price=MAX_ORDER_TOTAL + Decimal("0.01"),
            )
