import time
import asyncio
from collections import defaultdict
from typing import Callable, NamedTuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import get_settings
from app.utils.logging import get_logger

logger = get_logger("app.middleware.rate_limit")


class RateLimitRecord:
    """Tracks timestamps of incoming requests within a sliding window for a given IP."""

    def __init__(self) -> None:
        self.timestamps: list[float] = []

    def clean_old_entries(self, cutoff_time: float) -> None:
        self.timestamps = [ts for ts in self.timestamps if ts > cutoff_time]

    def add_request(self, timestamp: float) -> None:
        self.timestamps.append(timestamp)

    def count(self) -> int:
        return len(self.timestamps)

    def earliest(self) -> float | None:
        return self.timestamps[0] if self.timestamps else None


class RateLimiter:
    """In-memory sliding window rate limiter per client IP address."""

    def __init__(self, requests_per_minute: int = 60, burst_limit: int = 30) -> None:
        self.requests_per_minute = requests_per_minute
        self.burst_limit = burst_limit
        self.window_seconds = 60.0
        self.records: dict[str, RateLimitRecord] = defaultdict(RateLimitRecord)
        self._lock = asyncio.Lock()

    async def is_allowed(self, client_ip: str) -> tuple[bool, int, float]:
        """Check if request from client_ip is permitted.

        Returns:
            (allowed: bool, remaining_requests: int, retry_after_seconds: float)
        """
        async with self._lock:
            now = time.time()
            record = self.records[client_ip]
            cutoff = now - self.window_seconds
            record.clean_old_entries(cutoff)

            current_count = record.count()

            # Check if exceeded
            if current_count >= self.requests_per_minute:
                earliest = record.earliest() or now
                retry_after = max(1.0, round(self.window_seconds - (now - earliest), 1))
                return False, 0, retry_after

            # Check burst (requests in the last 5 seconds)
            burst_cutoff = now - 5.0
            recent_burst = sum(1 for ts in record.timestamps if ts > burst_cutoff)
            if recent_burst >= self.burst_limit:
                retry_after = 5.0
                return False, 0, retry_after

            # Allow request and record timestamp
            record.add_request(now)
            remaining = max(0, self.requests_per_minute - (current_count + 1))
            return True, remaining, 0.0

    async def reset(self) -> None:
        """Clear all rate limit records (primarily for testing)."""
        async with self._lock:
            self.records.clear()


# Global in-memory rate limiter instance
_global_rate_limiter: RateLimiter | None = None


def get_rate_limiter() -> RateLimiter:
    global _global_rate_limiter
    if _global_rate_limiter is None:
        settings = get_settings()
        rpm = getattr(settings, "api_rate_limit_per_minute", 60)
        burst = getattr(settings, "api_rate_limit_burst", 25)
        _global_rate_limiter = RateLimiter(requests_per_minute=rpm, burst_limit=burst)
    return _global_rate_limiter


def get_client_ip(request: Request) -> str:
    """Extract client IP address respecting X-Forwarded-For if present."""
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


class IPRateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI/Starlette middleware enforcing per-IP request throttling on public endpoints."""

    def __init__(self, app, exempt_paths: list[str] | None = None) -> None:
        super().__init__(app)
        self.exempt_paths = exempt_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/health",
            "/api/v1/health",
            "/api/health/diagnostics",
            "/api/v1/health/diagnostics",
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        settings = get_settings()
        if not getattr(settings, "api_rate_limit_enabled", True):
            return await call_next(request)

        path = request.url.path
        # Skip exempt endpoints (health checks, OpenAPI docs)
        for exempt in self.exempt_paths:
            if path == exempt or path.startswith(exempt + "/"):
                return await call_next(request)

        client_ip = get_client_ip(request)
        limiter = get_rate_limiter()
        allowed, remaining, retry_after = await limiter.is_allowed(client_ip)

        if not allowed:
            logger.warning(
                f"Rate limit exceeded for IP: {client_ip} on path {path}",
                extra={
                    "structured_data": {
                        "event": "ip_rate_limited",
                        "client_ip": client_ip,
                        "path": path,
                        "retry_after": retry_after,
                    }
                },
            )
            return JSONResponse(
                status_code=429,
                content={
                    "code": "IP_RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests. Please slow down and try again in a minute.",
                    "details": {
                        "client_ip": client_ip,
                        "retry_after_seconds": int(retry_after),
                    },
                },
                headers={
                    "Retry-After": str(int(retry_after)),
                    "X-RateLimit-Limit": str(limiter.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + retry_after)),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limiter.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
