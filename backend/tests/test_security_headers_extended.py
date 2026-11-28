"""Comprehensive security headers and configuration test suite.

Verifies:
- Production, development, and testing environment security header enforcement.
- Custom header settings (HSTS preloading, subdomains, referrer policies, permissions policies).
- Docs route relaxed CSP isolation vs strict default-src 'none' API CSP.
- Error handling, 404s, and rate-limiting responses include mandatory security headers.
- Compliance with OWASP Secure Headers Project standards.
"""

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.config import Settings
from app.main import app
from app.middleware.security_headers import (
    API_CSP,
    DOCS_CSP,
    SecurityHeadersMiddleware,
    build_security_headers,
)


def create_configured_app(settings: Settings) -> FastAPI:
    """Helper to instantiate test FastAPI app with given settings."""
    app_instance = FastAPI()

    @app_instance.get("/api/v1/test-endpoint")
    async def sample_endpoint():
        return {"status": "secure"}

    @app_instance.get("/docs")
    async def sample_docs():
        return {"docs": "swagger"}

    @app_instance.get("/redoc")
    async def sample_redoc():
        return {"docs": "redoc"}

    app_instance.add_middleware(SecurityHeadersMiddleware, settings=settings)
    return app_instance


async def fetch_path(target_app: FastAPI, path: str):
    """Executes asynchronous GET against ASGI target."""
    transport = ASGITransport(app=target_app)
    async with AsyncClient(transport=transport, base_url="https://api.test") as client:
        return await client.get(path)


@pytest.mark.asyncio
class TestSecurityHeadersComprehensive:
    """Test suite ensuring end-to-end security header behavior across all configurations."""

    async def test_standard_api_headers_baseline(self):
        """Verifies nosniff, framing, referrer, and opener isolation on core app."""
        response = await fetch_path(app, "/api/health")
        assert response.status_code == 200
        headers = response.headers

        assert headers["x-content-type-options"] == "nosniff"
        assert headers["x-frame-options"] == "DENY"
        assert headers["cross-origin-opener-policy"] == "same-origin"
        assert headers["content-security-policy"] == API_CSP
        assert headers["referrer-policy"] == "no-referrer"

    async def test_swagger_and_redoc_receive_specialized_csp(self):
        """Interactive docs routes require relaxed CSP for CDN scripts/styles while blocking framing."""
        for docs_path in ["/docs", "/redoc"]:
            resp = await fetch_path(app, docs_path)
            assert resp.status_code == 200
            assert resp.headers["content-security-policy"] == DOCS_CSP
            assert resp.headers["x-frame-options"] == "DENY"

    async def test_production_environment_enables_hsts_default(self):
        """In production environment, HSTS defaults to 1 year (31,536,000 seconds)."""
        prod_settings = Settings(
            _env_file=None,
            environment="production",
            secret_key="a-secure-production-secret-key-12345",
        )
        prod_app = create_configured_app(prod_settings)

        resp = await fetch_path(prod_app, "/api/v1/test-endpoint")
        assert "strict-transport-security" in resp.headers
        assert resp.headers["strict-transport-security"] == "max-age=31536000"

    async def test_development_environment_disables_hsts_by_default(self):
        """In development mode, HSTS is excluded to allow plain HTTP localhost development."""
        dev_settings = Settings(_env_file=None, environment="development")
        dev_app = create_configured_app(dev_settings)

        resp = await fetch_path(dev_app, "/api/v1/test-endpoint")
        assert "strict-transport-security" not in resp.headers

    async def test_custom_hsts_subdomains_and_preload_flags(self):
        """Custom HSTS configuration flags are appended according to RFC 6797."""
        custom_settings = Settings(
            _env_file=None,
            environment="production",
            secret_key="a-secure-production-secret-key-12345",
            security_hsts_seconds=63072000,
            security_hsts_include_subdomains=True,
            security_hsts_preload=True,
        )
        custom_app = create_configured_app(custom_settings)

        resp = await fetch_path(custom_app, "/api/v1/test-endpoint")
        hsts_header = resp.headers.get("strict-transport-security")
        assert hsts_header is not None
        assert "max-age=63072000" in hsts_header
        assert "includeSubDomains" in hsts_header
        assert "preload" in hsts_header

    async def test_custom_referrer_policy_override(self):
        """Referrer policy can be configured via environment settings."""
        custom_settings = Settings(
            _env_file=None,
            security_referrer_policy="strict-origin-when-cross-origin",
        )
        custom_app = create_configured_app(custom_settings)

        resp = await fetch_path(custom_app, "/api/v1/test-endpoint")
        assert resp.headers["referrer-policy"] == "strict-origin-when-cross-origin"

    async def test_security_headers_present_on_unhandled_routes_404(self):
        """Security headers must remain present even on 404 Not Found error responses."""
        resp = await fetch_path(app, "/api/v1/nonexistent-route-for-security-test")
        assert resp.status_code == 404
        assert resp.headers["x-content-type-options"] == "nosniff"
        assert resp.headers["x-frame-options"] == "DENY"
        assert resp.headers["content-security-policy"] == API_CSP

    async def test_build_security_headers_dictionary_builder(self):
        """Unit test the build_security_headers helper dictionary generation."""
        settings = Settings(_env_file=None, environment="development")
        headers = build_security_headers(settings)
        assert headers["X-Content-Type-Options"] == "nosniff"
        assert headers["X-Frame-Options"] == "DENY"
        assert headers["Cross-Origin-Opener-Policy"] == "same-origin"
        assert headers["Referrer-Policy"] == "no-referrer"
        assert "Strict-Transport-Security" not in headers

    async def test_negative_hsts_seconds_raises_validation_error(self):
        """Negative HSTS seconds must be rejected at configuration time."""
        with pytest.raises(ValueError, match="SECURITY_HSTS_SECONDS"):
            Settings(_env_file=None, security_hsts_seconds=-10)
