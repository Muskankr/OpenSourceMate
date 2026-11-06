import pytest
import time
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.middleware.rate_limit import RateLimiter, get_rate_limiter


@pytest.fixture(autouse=True)
async def reset_limiter():
    limiter = get_rate_limiter()
    await limiter.reset()
    yield
    await limiter.reset()


@pytest.mark.asyncio
async def test_rate_limiter_unit_allows_within_limit():
    limiter = RateLimiter(requests_per_minute=5, burst_limit=5)
    for _ in range(5):
        allowed, rem, _ = await limiter.is_allowed("192.168.1.1")
        assert allowed is True
    
    # 6th request is throttled
    allowed, rem, retry_after = await limiter.is_allowed("192.168.1.1")
    assert allowed is False
    assert rem == 0
    assert retry_after > 0


@pytest.mark.asyncio
async def test_rate_limiter_unit_different_ips_independent():
    limiter = RateLimiter(requests_per_minute=2, burst_limit=2)
    # Exhaust IP 1
    await limiter.is_allowed("10.0.0.1")
    await limiter.is_allowed("10.0.0.1")
    allowed1, _, _ = await limiter.is_allowed("10.0.0.1")
    assert allowed1 is False

    # IP 2 should still be allowed
    allowed2, rem2, _ = await limiter.is_allowed("10.0.0.2")
    assert allowed2 is True
    assert rem2 == 1


@pytest.mark.asyncio
async def test_rate_limiter_unit_burst_limit():
    limiter = RateLimiter(requests_per_minute=100, burst_limit=3)
    for _ in range(3):
        allowed, _, _ = await limiter.is_allowed("10.0.0.5")
        assert allowed is True
    
    # Exceed burst
    allowed, _, retry_after = await limiter.is_allowed("10.0.0.5")
    assert allowed is False
    assert retry_after == 5.0


@pytest.mark.asyncio
async def test_middleware_allows_and_adds_headers():
    limiter = get_rate_limiter()
    limiter.requests_per_minute = 10
    limiter.burst_limit = 10

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1")
        assert response.status_code == 200
        assert "x-ratelimit-limit" in response.headers
        assert "x-ratelimit-remaining" in response.headers


@pytest.mark.asyncio
async def test_middleware_blocks_when_rate_exceeded():
    limiter = get_rate_limiter()
    limiter.requests_per_minute = 2
    limiter.burst_limit = 10

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request 1 & 2 pass
        r1 = await client.get("/api/v1")
        assert r1.status_code == 200

        r2 = await client.get("/api/v1")
        assert r2.status_code == 200

        # Request 3 receives 429
        r3 = await client.get("/api/v1")
        assert r3.status_code == 429
        data = r3.json()
        assert data["code"] == "IP_RATE_LIMIT_EXCEEDED"
        assert "Retry-After" in r3.headers


@pytest.mark.asyncio
async def test_health_endpoints_exempt_from_rate_limiting():
    limiter = get_rate_limiter()
    limiter.requests_per_minute = 1
    limiter.burst_limit = 1

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for _ in range(5):
            res = await client.get("/api/v1/health")
            assert res.status_code == 200
