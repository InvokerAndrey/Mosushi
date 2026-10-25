from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from django.template.loader import render_to_string
from django.test import SimpleTestCase

from store.email_service import _build_context


class OrderEmailTemplateTests(SimpleTestCase):
    def test_cutlery_sets_are_in_html_and_text_order_contents(self):
        order = SimpleNamespace(
            pk=42,
            order_type="pickup",
            customer_name="Test customer",
            phone="+375290000000",
            address="",
            payment_method="",
            no_change=False,
            change_amount="",
            order_time="asap",
            scheduled_time="",
            items=[
                {
                    "name": "Test product",
                    "quantity": 1,
                    "price": 10.0,
                    "lineTotal": 10.0,
                }
            ],
            cutlery_sets=3,
            total_price=Decimal("10.00"),
            comment="",
            created_at=datetime(2026, 10, 25, 12, 0, tzinfo=ZoneInfo("Europe/Minsk")),
        )
        context = _build_context(order)

        html_body = render_to_string("store/email/order_email.html", context)
        text_body = render_to_string("store/email/order_email.txt", context)

        self.assertIn("Комплекты палочек", html_body)
        self.assertIn('<td class="col-qty">3</td>', html_body)
        self.assertIn("Комплекты палочек", text_body)
        self.assertIn("3 × 0 BYN = 0 BYN", text_body)
