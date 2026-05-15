"""
Time-related utility functions for working hours and delivery/pickup validation.
"""

from datetime import datetime


def format_working_hours(opening_hour: int, closing_hour: int) -> str:
    """Format working hours display string, e.g. '12:00-22:00'."""
    return f"{opening_hour}:00-{closing_hour}:00"


def get_asap_cutoff(closing_hour: int) -> tuple[int, int]:
    """
    Return (hour, minute) for the ASAP order cutoff.
    Orders are accepted until 30 minutes before closing.

    Example: closing_hour=22 → (21, 30)
    """
    return closing_hour - 1, 30


def format_asap_cutoff(closing_hour: int) -> str:
    """Format the ASAP cutoff as a string, e.g. '21:30'."""
    hour, minute = get_asap_cutoff(closing_hour)
    return f"{hour}:{minute:02d}"


def is_asap_order_allowed(
    opening_hour: int, closing_hour: int, now: datetime | None = None
) -> bool:
    """
    Check if ASAP orders (delivery or pickup) are currently allowed.
    Accepted from opening_hour:00 until 30 minutes before closing_hour:00.

    Example: opening=12, closing=22 → allowed from 12:00 to 21:29
    """
    if now is None:
        now = datetime.now()

    current_minutes = now.hour * 60 + now.minute
    opening_minutes = opening_hour * 60
    cutoff_hour, cutoff_minute = get_asap_cutoff(closing_hour)
    cutoff_minutes = cutoff_hour * 60 + cutoff_minute

    return opening_minutes <= current_minutes < cutoff_minutes


def get_asap_delivery_error(opening_hour: int, closing_hour: int) -> str:
    """Generate the ASAP delivery out-of-hours error message."""
    cutoff = format_asap_cutoff(closing_hour)
    return f"Заказы на доставку принимаются с {opening_hour}:00 до {cutoff}"


def get_asap_pickup_error(opening_hour: int, closing_hour: int) -> str:
    """Generate the ASAP pickup out-of-hours error message."""
    cutoff = format_asap_cutoff(closing_hour)
    return f"Заказы на самовывоз принимаются с {opening_hour}:00 до {cutoff}"

