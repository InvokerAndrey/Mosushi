"""
Reusable Telegram notification helper.
Sends an HTML-formatted message to the configured bot/chat.
"""

import logging
import requests
from django.conf import settings

from .constants import DELIVERY_FEE, FREE_DELIVERY_THRESHOLD

logger = logging.getLogger(__name__)


def _esc(text: str) -> str:
    """Escape special HTML characters for Telegram HTML parse mode."""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _format_scheduled_time(raw: str) -> str:
    """Convert 'YYYY-MM-DDTHH:MM' → 'DD.MM.YYYY HH:MM'."""
    try:
        date_part, time_part = raw.split("T")
        year, month, day = date_part.split("-")
        return f"{day}.{month}.{year} {time_part}"
    except Exception:
        return raw


def build_order_message(order) -> str:
    """
    Build an HTML Telegram message from an Order model instance.
    Returns the formatted string ready to be sent.
    """
    lines = [f"🧾 <b>Новый заказ #{order.pk}</b>", ""]

    if order.order_type == "pickup":
        lines += [
            f"👤 <b>Имя:</b> {_esc(order.customer_name)}",
            f"📞 <b>Телефон:</b> {_esc(order.phone)}",
            "",
            "🏪 <b>Тип:</b> Самовывоз",
            "",
        ]
        time_label = (
            f"На {_format_scheduled_time(order.scheduled_time)}"
            if order.order_time == "specific" and order.scheduled_time
            else "Через 30 минут"
        )
        lines.append(f"⏰ <b>Время:</b> {time_label}")
    else:
        lines += [
            f"👤 <b>Имя:</b> {_esc(order.customer_name)}",
            f"📞 <b>Телефон:</b> {_esc(order.phone)}",
            "",
            "🚚 <b>Тип:</b> Доставка",
            f"📍 <b>Адрес:</b> {_esc(order.address)}",
            "",
        ]
        payment_label = "Наличные" if order.payment_method == "CASH" else "Карта"
        lines.append(f"💳 <b>Оплата:</b> {payment_label}")

        if order.payment_method == "CASH":
            if order.no_change:
                lines.append("💰 <b>Сдача:</b> Без сдачи")
            elif order.change_amount:
                lines.append(f"💰 <b>Сдача с:</b> {_esc(order.change_amount)} BYN")

        lines.append("")
        time_label = (
            f"На {_format_scheduled_time(order.scheduled_time)}"
            if order.order_time == "specific" and order.scheduled_time
            else "В течение часа"
        )
        lines.append(f"⏰ <b>Время:</b> {time_label}")

    # Line items
    lines += ["", "🍣 <b>Заказ:</b>"]
    for item in order.items:
        lines.append(
            f"• {_esc(item['name'])} x{item['quantity']} — {float(item['lineTotal']):.2f} BYN"
        )

    lines.append("")
    if order.order_type == "delivery":
        subtotal = sum(float(i["lineTotal"]) for i in order.items)
        fee = 0.0 if subtotal >= float(FREE_DELIVERY_THRESHOLD) else float(DELIVERY_FEE)
        fee_label = "Бесплатно" if not fee else f"{fee:.2f} BYN"
        lines.append(f"🚚 <b>Доставка:</b> {fee_label}")

    lines.append(f"💵 <b>Итого:</b> {float(order.total_price):.2f} BYN")

    if order.comment:
        lines += ["", "💬 <b>Комментарий:</b>", _esc(order.comment)]

    return "\n".join(lines)


def send_order_to_telegram(order) -> bool:
    """
    Send an order notification to the Telegram bot.
    Returns True on success, False on failure (logs the error).
    """
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.TELEGRAM_CHAT_ID

    if not token or not chat_id:
        logger.error("Telegram credentials are not configured in .env")
        return False

    message = build_order_message(order)
    url = f"https://api.telegram.org/bot{token}/sendMessage"

    try:
        response = requests.post(
            url,
            json={"chat_id": chat_id, "text": message, "parse_mode": "HTML"},
            timeout=10,
        )
        response.raise_for_status()
        return True
    except requests.RequestException as exc:
        logger.error("Failed to send Telegram notification: %s", exc)
        return False
