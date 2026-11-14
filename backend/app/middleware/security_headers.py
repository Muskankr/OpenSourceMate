from collections.abc import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.config import Settings, get_settings

# The API only returns JSON, so it never needs to load anything or be framed.
API_CSP = "default-src 'none'; frame-ancestors 'none'"
# Swagger UI and ReDoc load scripts and styles from a CDN and run inline scripts,
# so the docs pages only get the framing restriction.
DOCS_CSP = "frame-ancestors 'none'"
DOCS_PATHS = ("/docs", "/redoc")


def build_security_headers(settings: Settings) -> dict[str, str]:
    """Return the headers added to every response, based on the settings."""
    headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": settings.security_referrer_policy,
        "Cross-Origin-Opener-Policy": "same-origin",
    }
    if settings.security_hsts_seconds:
        hsts = f"max-age={settings.security_hsts_seconds}"
        if settings.security_hsts_include_subdomains:
            hsts += "; includeSubDomains"
        if settings.security_hsts_preload:
            hsts += "; preload"
        headers["Strict-Transport-Security"] = hsts
    return headers


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security headers (nosniff, framing, referrer policy, CSP and HSTS) to every response."""

    def __init__(self, app: ASGIApp, settings: Settings | None = None) -> None:
        super().__init__(app)
        self.headers = build_security_headers(settings or get_settings())

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        for name, value in self.headers.items():
            response.headers.setdefault(name, value)
        is_docs = request.url.path.startswith(DOCS_PATHS)
        response.headers.setdefault("Content-Security-Policy", DOCS_CSP if is_docs else API_CSP)
        return response
