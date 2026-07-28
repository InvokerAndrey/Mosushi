import json
from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone

from store.models import OrderRateLimitBucket


@override_settings(
    ORDER_RATE_LIMIT_MAX_REQUESTS=3,
    ORDER_RATE_LIMIT_WINDOW_SECONDS=60,
    ORDER_RATE_LIMIT_PROXY_COUNT=1,
)
class OrderRateLimitTests(TestCase):
    def post_order(self, *, remote_addr="203.0.113.10", forwarded_for=None):
        request_meta = {"REMOTE_ADDR": remote_addr}
        if forwarded_for is not None:
            request_meta["HTTP_X_FORWARDED_FOR"] = forwarded_for
        return self.client.post(
            "/order/",
            data=json.dumps({}),
            content_type="application/json",
            **request_meta,
        )

    @patch("store.views.create_order", return_value=SimpleNamespace(pk=123))
    def test_blocks_requests_after_configured_limit(self, create_order):
        for _ in range(3):
            self.assertEqual(self.post_order().status_code, 201)

        response = self.post_order()

        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json()["message"],
            "Слишком много попыток оформления заказа. Повторите позже.",
        )
        self.assertGreaterEqual(int(response["Retry-After"]), 1)
        self.assertLessEqual(int(response["Retry-After"]), 60)
        self.assertEqual(response["Cache-Control"], "no-store")
        self.assertEqual(create_order.call_count, 3)

    @override_settings(ORDER_RATE_LIMIT_MAX_REQUESTS=1)
    @patch("store.views.create_order", return_value=SimpleNamespace(pk=123))
    def test_different_client_ips_have_independent_limits(self, _create_order):
        first = self.post_order(remote_addr="203.0.113.10")
        second = self.post_order(remote_addr="203.0.113.11")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(OrderRateLimitBucket.objects.count(), 2)

    @override_settings(ORDER_RATE_LIMIT_MAX_REQUESTS=1)
    @patch("store.views.create_order", return_value=SimpleNamespace(pk=123))
    def test_client_cannot_bypass_limit_with_spoofed_forwarded_prefix(
        self, create_order
    ):
        first = self.post_order(
            remote_addr="172.18.0.2",
            forwarded_for="192.0.2.1, 198.51.100.20",
        )
        second = self.post_order(
            remote_addr="172.18.0.2",
            forwarded_for="192.0.2.200, 198.51.100.20",
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(create_order.call_count, 1)

    @override_settings(ORDER_RATE_LIMIT_MAX_REQUESTS=1)
    @patch("store.views.create_order", return_value=SimpleNamespace(pk=123))
    def test_untrusted_remote_cannot_supply_forwarded_client_ip(
        self, create_order
    ):
        first = self.post_order(
            remote_addr="203.0.113.10",
            forwarded_for="198.51.100.20",
        )
        second = self.post_order(
            remote_addr="203.0.113.10",
            forwarded_for="198.51.100.21",
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(create_order.call_count, 1)

    @override_settings(ORDER_RATE_LIMIT_MAX_REQUESTS=1)
    @patch("store.views.create_order", return_value=SimpleNamespace(pk=123))
    def test_requests_are_allowed_again_in_the_next_window(self, create_order):
        first_window = timezone.now().replace(microsecond=0)
        second_window = first_window + timedelta(seconds=61)

        with patch(
            "store.rate_limit.timezone.now",
            side_effect=(first_window, first_window, second_window),
        ):
            first = self.post_order()
            blocked = self.post_order()
            allowed_again = self.post_order()

        self.assertEqual(first.status_code, 201)
        self.assertEqual(blocked.status_code, 429)
        self.assertEqual(allowed_again.status_code, 201)
        self.assertEqual(create_order.call_count, 2)

    @override_settings(ORDER_RATE_LIMIT_MAX_REQUESTS=1)
    @patch("store.views.create_order", return_value=SimpleNamespace(pk=123))
    def test_malformed_forwarded_ip_falls_back_to_remote_address(
        self, create_order
    ):
        first = self.post_order(forwarded_for="not-an-ip")
        second = self.post_order(forwarded_for="still-not-an-ip")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(create_order.call_count, 1)
