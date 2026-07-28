from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from store.telegram import build_order_message, send_order_to_telegram


def malicious_delivery_order():
    return SimpleNamespace(
        pk="</b><i>7</i>",
        order_type="delivery",
        customer_name="Alice & Bob <script>alert(1)</script>",
        phone="+37529</b><u>0000000</u>",
        address='Минск </b><a href="https://evil.example">ссылка</a>',
        payment_method="CASH",
        no_change=False,
        change_amount="100 </b><code>BYN</code>",
        order_time="specific",
        scheduled_time="</b><tg-spoiler>завтра</tg-spoiler>",
        items=[
            {
                "name": "Ролл </b><blockquote>опасный</blockquote>",
                "quantity": "</b><i>999</i>",
                "lineTotal": 10,
            }
        ],
        total_price=Decimal("16.00"),
        comment="Комментарий </b><pre>инъекция</pre> & ещё",
    )


class TelegramHtmlSafetyTests(SimpleTestCase):
    def test_all_dynamic_values_are_html_escaped(self):
        message = build_order_message(malicious_delivery_order())

        for injected_tag in (
            "<script>",
            "<a ",
            "<i>",
            "<u>",
            "<code>",
            "<tg-spoiler>",
            "<blockquote>",
            "<pre>",
        ):
            with self.subTest(injected_tag=injected_tag):
                self.assertNotIn(injected_tag, message)

        self.assertIn("&lt;script&gt;alert(1)&lt;/script&gt;", message)
        self.assertIn("#&lt;/b&gt;&lt;i&gt;7&lt;/i&gt;", message)
        self.assertIn("&lt;tg-spoiler&gt;завтра&lt;/tg-spoiler&gt;", message)
        self.assertIn("&lt;blockquote&gt;опасный&lt;/blockquote&gt;", message)
        self.assertIn("&lt;i&gt;999&lt;/i&gt;", message)
        self.assertIn("&amp; ещё", message)

        # Trusted markup used by the notification template remains intact.
        self.assertIn("<b>Имя:</b>", message)
        self.assertIn("<b>Комментарий:</b>", message)

    @override_settings(
        TELEGRAM_BOT_TOKEN="test-token",
        TELEGRAM_CHAT_ID="test-chat",
    )
    @patch("store.telegram.requests.post")
    def test_telegram_api_receives_only_escaped_dynamic_html(self, post):
        post.return_value.raise_for_status.return_value = None

        result = send_order_to_telegram(malicious_delivery_order())

        self.assertTrue(result)
        post.assert_called_once()
        call = post.call_args
        self.assertEqual(
            call.args[0],
            "https://api.telegram.org/bottest-token/sendMessage",
        )
        self.assertEqual(call.kwargs["timeout"], 10)
        self.assertEqual(call.kwargs["json"]["chat_id"], "test-chat")
        self.assertEqual(call.kwargs["json"]["parse_mode"], "HTML")
        self.assertEqual(
            call.kwargs["json"]["text"],
            build_order_message(malicious_delivery_order()),
        )
        self.assertNotIn("<script>", call.kwargs["json"]["text"])
