import pytest
from unittest.mock import AsyncMock, patch
from httpx import ASGITransport, AsyncClient
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.rate_limit import get_rate_limiter, get_analyze_rate_limiter
from app.config import get_settings


client = TestClient(app)


@pytest.fixture(autouse=True)
async def reset_rate_limiters():
    general = get_rate_limiter()
    analyze = get_analyze_rate_limiter()
    await general.reset()
    await analyze.reset()
    yield
    await general.reset()
    await analyze.reset()


# -----------------------------------------------------------------------------
# 1. Parameter Validation & Sanitization Tests (Acceptance Criteria: 400)
# -----------------------------------------------------------------------------
def test_invalid_username_path_param_returns_400():
    invalid_cases = [
        "-leading-hyphen",
        "trailing-hyphen-",
        "consecutive--hyphen",
        "has space in name",
        "bad!character#",
        "a" * 40,
    ]
    for username in invalid_cases:
        resp = client.get(f"/api/v1/github/users/{username}")
        assert resp.status_code == 400
        data = resp.json()
        assert "error" in data
        assert data["error"]["code"] == "INVALID_USERNAME"
        assert "message" in data["error"]
        assert len(data["error"]["message"]) > 0
        assert "detail" in data


def test_invalid_external_prs_query_limit_returns_400():
    # Limit out of range (< 1 or > 100)
    resp_zero = client.get("/api/v1/github/users/octocat/external-prs?limit=0")
    assert resp_zero.status_code == 400
    assert "limit" in resp_zero.json()["detail"].lower()

    resp_excess = client.get("/api/v1/github/users/octocat/external-prs?limit=150")
    assert resp_excess.status_code == 400
    assert "limit" in resp_excess.json()["detail"].lower()


def test_invalid_skills_query_param_returns_400():
    # Skill with illegal characters / script tags
    resp = client.get("/api/v1/matching/users/octocat/issues?skills=Python,invalid<script>")
    assert resp.status_code == 400
    data = resp.json()
    assert "error" in data
    assert "invalid skill" in data["error"]["message"].lower()


def test_invalid_friendliness_repo_param_returns_400():
    # Malformed repo parameter
    resp_empty = client.get("/api/v1/repositories/friendliness?repo=")
    assert resp_empty.status_code == 400

    resp_malformed = client.get("/api/v1/repositories/friendliness?repo=justaname-noslash")
    assert resp_malformed.status_code == 400
    assert "owner/repo" in resp_malformed.json()["detail"].lower()


def test_invalid_ai_body_payload_returns_400():
    # Empty issue dictionary
    resp = client.post("/api/v1/ai/analyze-issue", json={"issue": {}, "user_skills": []})
    assert resp.status_code == 400
    assert "cannot be empty" in resp.json()["detail"].lower()

    # Oversized skill strings in user_skills
    resp2 = client.post(
        "/api/v1/ai/analyze-issue",
        json={"issue": {"title": "Test Issue", "number": 1}, "user_skills": ["x" * 60]},
    )
    assert resp2.status_code == 400
    assert "exceeds maximum length" in resp2.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 2. Per-IP Rate Limiting on Analyze Endpoints Tests (Acceptance Criteria: 429)
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_analyze_endpoint_rate_limit_returns_429_with_retry_after():
    limiter = get_analyze_rate_limiter()
    limiter.requests_per_minute = 2
    limiter.burst_limit = 10

    mock_profile = {
        "login": "octocat",
        "name": "The Octocat",
        "bio": "GitHub mascot",
        "avatar_url": "https://avatars.githubusercontent.com/u/583231",
        "html_url": "https://github.com/octocat",
        "public_repos": 8,
        "followers": 1000,
        "following": 9,
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        with patch("app.api.routes.github.get_github_user", AsyncMock(return_value=mock_profile)):
            headers = {"x-test-rate-limit": "1", "x-forwarded-for": "203.0.113.195"}

            # First 2 requests succeed
            r1 = await ac.get("/api/v1/github/users/octocat", headers=headers)
            assert r1.status_code == 200

            r2 = await ac.get("/api/v1/github/users/octocat", headers=headers)
            assert r2.status_code == 200

            # 3rd request exceeds limit -> 429
            r3 = await ac.get("/api/v1/github/users/octocat", headers=headers)
            assert r3.status_code == 429

            # Check required Retry-After header
            assert "Retry-After" in r3.headers
            retry_after_val = int(r3.headers["Retry-After"])
            assert retry_after_val > 0

            # Check standard rate limit tracking headers
            assert "x-ratelimit-limit" in r3.headers
            assert r3.headers["x-ratelimit-remaining"] == "0"
            assert "x-ratelimit-reset" in r3.headers

            # Check unified JSON error format
            data = r3.json()
            assert "error" in data
            assert data["error"]["code"] == "IP_RATE_LIMIT_EXCEEDED"
            assert "Too many requests" in data["error"]["message"]
            assert data["error"]["details"]["retry_after_seconds"] > 0
            assert "detail" in data


@pytest.mark.asyncio
async def test_per_ip_isolation_on_analyze_endpoints():
    limiter = get_analyze_rate_limiter()
    limiter.requests_per_minute = 1
    limiter.burst_limit = 10

    mock_profile = {"login": "octocat", "avatar_url": "https://avatars.githubusercontent.com/u/583231", "html_url": "https://github.com/octocat"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        with patch("app.api.routes.github.get_github_user", AsyncMock(return_value=mock_profile)):
            # IP 1 uses its quota
            r1 = await ac.get("/api/v1/github/users/octocat", headers={"x-test-rate-limit": "1", "x-forwarded-for": "198.51.100.1"})
            assert r1.status_code == 200

            # IP 1 is now blocked
            r1_blocked = await ac.get("/api/v1/github/users/octocat", headers={"x-test-rate-limit": "1", "x-forwarded-for": "198.51.100.1"})
            assert r1_blocked.status_code == 429

            # Different IP 2 is still permitted
            r2 = await ac.get("/api/v1/github/users/octocat", headers={"x-test-rate-limit": "1", "x-forwarded-for": "198.51.100.2"})
            assert r2.status_code == 200


# -----------------------------------------------------------------------------
# 3. CORS Configuration Tests (Acceptance Criteria: CORS)
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_cors_allows_configured_frontend_origin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Request with allowed origin
        resp = await ac.get("/api/v1/health", headers={"Origin": "http://localhost:3000"})
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"


@pytest.mark.asyncio
async def test_cors_preflight_options_for_allowed_origin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.options(
            "/api/v1/github/users/octocat",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert "GET" in resp.headers.get("access-control-allow-methods", "")


@pytest.mark.asyncio
async def test_cors_rejects_unauthorized_origin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/health", headers={"Origin": "https://unauthorized-attacker.example.com"})
        assert resp.status_code == 200
        # Access-Control-Allow-Origin should NOT be present for untrusted origin
        assert resp.headers.get("access-control-allow-origin") is None


# -----------------------------------------------------------------------------
# 4. Standard Security Headers Tests
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_standard_security_headers_present_on_responses():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.headers["X-Content-Type-Options"] == "nosniff"
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert "Referrer-Policy" in resp.headers
        assert resp.headers["Cross-Origin-Opener-Policy"] == "same-origin"
        assert "Content-Security-Policy" in resp.headers


@pytest.mark.asyncio
async def test_security_headers_present_on_error_and_rate_limit():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 400 Bad Request
        resp_400 = await ac.get("/api/v1/github/users/-invalid-")
        assert resp_400.status_code == 400
        assert resp_400.headers["X-Content-Type-Options"] == "nosniff"
        assert resp_400.headers["X-Frame-Options"] == "DENY"

        # 404 Not Found
        resp_404 = await ac.get("/api/v1/non-existent-endpoint")
        assert resp_404.status_code == 404
        assert resp_404.headers["X-Content-Type-Options"] == "nosniff"
        assert resp_404.headers["X-Frame-Options"] == "DENY"
