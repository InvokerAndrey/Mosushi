"""
Email notification service for new orders.
Completely isolated from Telegram logic — never blocks or cancels an order on failure.
"""

import logging
from decimal import Decimal

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .models import Order, SiteSettings

logger = logging.getLogger(__name__)

FALLBACK_EMAIL_RECIPIENT = "sushimoby@mail.ru"


def _get_order_email_recipient() -> str:
    """Return the contact email from SiteSettings, falling back to the hardcoded default."""
    obj = SiteSettings.objects.first()
    if obj and obj.contact_email:
        return obj.contact_email
    return FALLBACK_EMAIL_RECIPIENT


def send_order_email(order: Order) -> bool:
    """
    Send a styled HTML order confirmation email to the restaurant.

    Returns True on success, False on any failure.
    Never raises — errors are logged and swallowed so the order is never blocked.
    """
    recipient = _get_order_email_recipient()

    try:
        subject = f"[ORDER] Заказ #{order.pk}"
        context = _build_context(order)

        html_body = render_to_string("store/email/order_email.html", context)
        text_body = render_to_string("store/email/order_email.txt", context)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.EMAIL_HOST_USER,
            to=[recipient],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)

        logger.info("Order #%d: email notification sent to %s.", order.pk, recipient)
        return True

    except Exception:
        logger.exception("Order #%d: failed to send email notification.", order.pk)
        return False


def _build_context(order: Order) -> dict:
    """Build the template context for the order email."""
    order_type_display = "Доставка" if order.order_type == "delivery" else "Самовывоз"

    payment_display = ""
    if order.order_type == "delivery":
        payment_map = {"CASH": "Наличные", "CARD": "Карта"}
        payment_display = payment_map.get(order.payment_method, order.payment_method)
        if order.payment_method == "CASH" and not order.no_change and order.change_amount:
            payment_display += f" (сдача с {order.change_amount} BYN)"
        elif order.payment_method == "CASH" and order.no_change:
            payment_display += " (без сдачи)"

    scheduled = order.scheduled_time if order.scheduled_time else "Как можно скорее"

    subtotal = sum(Decimal(str(item["lineTotal"])) for item in order.items)
    delivery_fee = order.total_price - subtotal

    return {
        "order": order,
        "order_type_display": order_type_display,
        "payment_display": payment_display,
        "scheduled_display": scheduled,
        "created_at_local": order.created_at.strftime("%d.%m.%Y %H:%M"),
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
    }
