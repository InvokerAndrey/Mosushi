"""Persistent rate limiting for the public order endpoint."""

import hashlib
import hmac
import ipaddress
import math
from datetime import UTC, datetime

from django.conf import settings
from django.db.models import F
from django.utils import timezone

from .models import OrderRateLimitBucket


def _is_trusted_proxy(address: str) -> bool:
    try:
        remote_ip = ipaddress.ip_address(address)
        return any(
            remote_ip in ipaddress.ip_network(cidr)
            for cidr in settings.ORDER_RATE_LIMIT_TRUSTED_PROXY_CIDRS
        )
    except ValueError:
        return False


def get_client_ip(request) -> str:
    """
    Return a normalized client IP.

    ORDER_RATE_LIMIT_PROXY_COUNT selects the trusted entry from the right side
    of X-Forwarded-For. Client-supplied entries added on the left cannot change
    the selected address.
    """
    remote_address = request.META.get("REMOTE_ADDR", "")
    proxy_count = max(settings.ORDER_RATE_LIMIT_PROXY_COUNT, 0)
    forwarded_for = [
        entry.strip()
        for entry in request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")
        if entry.strip()
    ]

    candidate = (
        forwarded_for[-proxy_count]
        if (
            proxy_count
            and len(forwarded_for) >= proxy_count
            and _is_trusted_proxy(remote_address)
        )
        else remote_address
    )

    try:
        return ipaddress.ip_address(candidate).compressed
    except ValueError:
        try:
            return ipaddress.ip_address(remote_address).compressed
        except ValueError:
            return "unknown"


def consume_order_request(request) -> tuple[bool, int]:
    """
    Consume one request from the client's fixed rate-limit window.

    Returns (allowed, retry_after_seconds). The counter update is conditional
    and atomic, so concurrent workers cannot increment beyond the configured
    limit.
    """
    limit = max(settings.ORDER_RATE_LIMIT_MAX_REQUESTS, 1)
    window_seconds = max(settings.ORDER_RATE_LIMIT_WINDOW_SECONDS, 1)
    now = timezone.now()
    window_number = int(now.timestamp()) // window_seconds
    expires_timestamp = (window_number + 1) * window_seconds
    expires_at = datetime.fromtimestamp(expires_timestamp, tz=UTC)
    client_ip = get_client_ip(request)

    raw_key = f"order:{window_number}:{client_ip}".encode()
    key = hmac.new(
        settings.SECRET_KEY.encode(),
        raw_key,
        hashlib.sha256,
    ).hexdigest()

    # Keep the table bounded without retaining client identifiers.
    OrderRateLimitBucket.objects.filter(expires_at__lte=now).delete()

    _, created = OrderRateLimitBucket.objects.get_or_create(
        key=key,
        defaults={
            "request_count": 1,
            "expires_at": expires_at,
        },
    )
    if created:
        return True, 0

    updated = OrderRateLimitBucket.objects.filter(
        key=key,
        request_count__lt=limit,
    ).update(request_count=F("request_count") + 1)
    if updated:
        return True, 0

    retry_after = max(1, math.ceil((expires_at - now).total_seconds()))
    return False, retry_after
