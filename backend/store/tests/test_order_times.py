import json
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch
from zoneinfo import ZoneInfo

from django.test import TestCase

from store.models import Category, Order, Product
from store.services import OrderValidationError, create_order
from store.utils import format_scheduled_time


MINSK = ZoneInfo("Europe/Minsk")
FIXED_NOW = datetime(2026, 7, 28, 14, 0, tzinfo=MINSK)


class OrderTimeValidationTests(TestCase):
    def setUp(self):
        category = Category.objects.create(name="Test")
        self.product = Product.objects.create(
            category=category,
            name="Test product",
            price=Decimal("10.00"),
            image="products/test.png",
        )

    def pickup_body(self, order_time="specific", scheduled_time="2026-07-29T13:00+03:00"):
        return {
            "orderType": "pickup",
            "cartItems": {str(self.product.pk): 1},
            "totalPrice": 10,
            "pickup": {
                "name": "Test customer",
                "phoneNumber": "+375290000000",
                "orderTime": order_time,
                "scheduledTime": scheduled_time,
            },
        }

    def delivery_body(self, scheduled_time):
        return {
            "orderType": "delivery",
            "cartItems": {str(self.product.pk): 1},
            "totalPrice": 16,
            "delivery": {
                "name": "Test customer",
                "phoneNumber": "+375290000000",
                "address": "Минск",
                "paymentMethod": "CARD",
                "orderTime": "specific",
                "scheduledTime": scheduled_time,
            },
        }

    @patch("store.services.timezone.now", return_value=FIXED_NOW)
    def test_rejects_arbitrary_order_time(self, _now):
        with self.assertRaisesRegex(OrderValidationError, "вариант времени"):
            create_order(self.pickup_body(order_time="whenever"))

        self.assertFalse(Order.objects.exists())

    @patch("store.services.timezone.now", return_value=FIXED_NOW)
    def test_endpoint_rejects_arbitrary_order_time(self, _now):
        response = self.client.post(
            "/order/",
            data=json.dumps(self.pickup_body(order_time="whenever")),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"],
            "Выберите допустимый вариант времени заказа.",
        )
        self.assertFalse(Order.objects.exists())

    @patch("store.services.timezone.now", return_value=FIXED_NOW)
    def test_rejects_human_readable_and_naive_timestamps(self, _now):
        invalid_values = (
            "Завтра, 13:00",
            "2026-07-29T13:00",
            "20260729T1300+03:00",
        )

        for scheduled_time in invalid_values:
            with self.subTest(scheduled_time=scheduled_time):
                with self.assertRaises(OrderValidationError):
                    create_order(self.pickup_body(scheduled_time=scheduled_time))

        self.assertFalse(Order.objects.exists())

    @patch("store.services.timezone.now", return_value=FIXED_NOW)
    def test_rejects_past_and_too_close_times(self, _now):
        invalid_values = (
            "2026-07-28T13:45+03:00",
            "2026-07-28T14:15+03:00",
        )

        for scheduled_time in invalid_values:
            with self.subTest(scheduled_time=scheduled_time):
                with self.assertRaisesRegex(OrderValidationError, "прошло или находится слишком близко"):
                    create_order(self.pickup_body(scheduled_time=scheduled_time))

        self.assertFalse(Order.objects.exists())

    @patch(
        "store.services.timezone.now",
        return_value=FIXED_NOW.replace(second=1),
    )
    def test_lead_time_uses_current_seconds_without_rounding_down(self, _now):
        with self.assertRaisesRegex(OrderValidationError, "слишком близко"):
            create_order(
                self.pickup_body(scheduled_time="2026-07-28T14:30+03:00")
            )

        self.assertFalse(Order.objects.exists())

    @patch("store.services.timezone.now", return_value=FIXED_NOW)
    def test_rejects_non_quarter_hour_and_out_of_hours(self, _now):
        invalid_values = (
            "2026-07-29T14:10+03:00",
            "2026-07-29T22:15+03:00",
        )

        for scheduled_time in invalid_values:
            with self.subTest(scheduled_time=scheduled_time):
                with self.assertRaises(OrderValidationError):
                    create_order(self.pickup_body(scheduled_time=scheduled_time))

        self.assertFalse(Order.objects.exists())

    @patch("store.services.timezone.now", return_value=FIXED_NOW)
    def test_rejects_time_more_than_thirty_days_ahead(self, _now):
        too_far = (FIXED_NOW + timedelta(days=31)).replace(
            hour=13, minute=0
        ).isoformat(timespec="minutes")

        with self.assertRaisesRegex(OrderValidationError, "30 дней"):
            create_order(self.pickup_body(scheduled_time=too_far))

        self.assertFalse(Order.objects.exists())

    @patch("store.services.send_order_email", return_value=True)
    @patch("store.services.send_order_to_telegram", return_value=True)
    @patch("store.services.timezone.now", return_value=FIXED_NOW)
    def test_accepts_future_time_and_normalizes_it_to_minsk(
        self, _now, _telegram, _email
    ):
        order = create_order(
            self.pickup_body(scheduled_time="2026-07-29T10:00+00:00")
        )

        self.assertEqual(order.order_time, "specific")
        self.assertEqual(order.scheduled_time, "2026-07-29T13:00+03:00")
        self.assertEqual(format_scheduled_time(order.scheduled_time), "29.07.2026 13:00")

    @patch("store.services.timezone.now", return_value=FIXED_NOW)
    def test_delivery_cannot_be_scheduled_before_opening_plus_one_hour(self, _now):
        with self.assertRaisesRegex(OrderValidationError, "13:00"):
            create_order(self.delivery_body("2026-07-29T12:45+03:00"))

        self.assertFalse(Order.objects.exists())

    @patch("store.services.timezone.now", return_value=FIXED_NOW.replace(hour=23))
    def test_asap_is_rejected_outside_fallback_working_hours(self, _now):
        with self.assertRaisesRegex(OrderValidationError, "принимаются с 12:00"):
            create_order(self.pickup_body(order_time="asap", scheduled_time=""))

        self.assertFalse(Order.objects.exists())
