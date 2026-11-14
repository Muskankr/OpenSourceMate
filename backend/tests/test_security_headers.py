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


def make_app(settings: Settings) -> FastAPI:
    test_app = FastAPI()

    @test_app.get("/ping")
    async def ping():
        return {"ok": True}

    test_app.add_middleware(SecurityHeadersMiddleware, settings=settings)
    return test_app


async def get(target: FastAPI, path: str):
    async with AsyncClient(transport=ASGITransport(app=target), base_url="http://test") as client:
        return await client.get(path)


@pytest.mark.asyncio
async def test_api_responses_include_security_headers():
    response = await get(app, "/api/health")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["Cross-Origin-Opener-Policy"] == "same-origin"
    assert response.headers["Content-Security-Policy"] == API_CSP


@pytest.mark.asyncio
async def test_error_responses_include_security_headers():
    response = await get(app, "/api/does-not-exist")
    assert response.status_code == 404
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["Content-Security-Policy"] == API_CSP


@pytest.mark.asyncio
async def test_docs_pages_get_relaxed_csp_so_swagger_ui_loads():
    response = await get(app, "/docs")
    assert response.status_code == 200
    assert response.headers["Content-Security-Policy"] == DOCS_CSP
    assert response.headers["X-Frame-Options"] == "DENY"


@pytest.mark.asyncio
async def test_hsts_is_off_outside_production():
    response = await get(make_app(Settings(_env_file=None, environment="development")), "/ping")
    assert "Strict-Transport-Security" not in response.headers


@pytest.mark.asyncio
async def test_hsts_defaults_to_one_year_in_production():
    settings = Settings(
        _env_file=None,
        environment="production",
        secret_key="a-secure-production-secret-key",
    )
    response = await get(make_app(settings), "/ping")
    assert response.headers["Strict-Transport-Security"] == "max-age=31536000"


def test_hsts_options_are_driven_by_settings():
    settings = Settings(
        _env_file=None,
        environment="development",
        security_hsts_seconds=600,
        security_hsts_include_subdomains=True,
        security_hsts_preload=True,
        security_referrer_policy="same-origin",
    )
    headers = build_security_headers(settings)
    assert headers["Strict-Transport-Security"] == "max-age=600; includeSubDomains; preload"
    assert headers["Referrer-Policy"] == "same-origin"


def test_negative_hsts_seconds_is_rejected():
    with pytest.raises(ValueError, match="SECURITY_HSTS_SECONDS"):
        Settings(_env_file=None, environment="development", security_hsts_seconds=-1)
