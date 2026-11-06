import asyncio
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.config import Settings
from app.services import github_service
from app.services.github_service import (
    GitHubRateLimitError,
    GitHubTimeoutError,
    GitHubUpstreamError,
    close_client,
    get_client,
    github_get,
)


@pytest.fixture(autouse=True)
async def reset_client():
    await close_client()
    yield
    await close_client()


@pytest.mark.asyncio
async def test_singleton_client_initialization_with_timeouts():
    """Verify get_client configures custom connect and read timeouts on the singleton."""
    with patch(
        "app.services.github_service.get_settings",
        return_value=Settings(
            github_connect_timeout=3.5,
            github_read_timeout=7.5,
            github_write_timeout=6.0,
            github_pool_timeout=4.0,
        ),
    ):
        client = get_client()
        assert client is not None
        assert client.timeout.connect == 3.5
        assert client.timeout.read == 7.5
        assert client.timeout.write == 6.0
        assert client.timeout.pool == 4.0
        # Re-calling returns the identical instance
        assert get_client() is client


@pytest.mark.asyncio
async def test_github_get_successful_response():
    """Verify normal successful GET returns httpx Response without retries."""
    mock_response = httpx.Response(200, json={"login": "octocat"}, request=httpx.Request("GET", "https://api.github.com/users/octocat"))
    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        res = await github_get("https://api.github.com/users/octocat")
        assert res.status_code == 200
        assert res.json() == {"login": "octocat"}
        assert mock_get.call_count == 1


@pytest.mark.asyncio
async def test_github_get_retries_transient_502_then_succeeds():
    """Verify 502 Bad Gateway triggers backoff and retry, returning success if next attempt succeeds."""
    err_502 = httpx.Response(502, text="Bad Gateway", request=httpx.Request("GET", "https://api.github.com/test"))
    success_200 = httpx.Response(200, json={"ok": True}, request=httpx.Request("GET", "https://api.github.com/test"))

    with patch(
        "app.services.github_service.get_settings",
        return_value=Settings(
            github_max_retries=3,
            github_retry_backoff_factor=0.01,
        ),
    ), patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = [err_502, success_200]
        res = await github_get("https://api.github.com/test")
        assert res.status_code == 200
        assert res.json() == {"ok": True}
        assert mock_get.call_count == 2


@pytest.mark.asyncio
async def test_github_get_exhausts_retries_on_persistent_500():
    """Verify persistent 500 triggers GitHubUpstreamError after max retries."""
    err_503 = httpx.Response(503, text="Service Unavailable", request=httpx.Request("GET", "https://api.github.com/test"))

    with patch(
        "app.services.github_service.get_settings",
        return_value=Settings(
            github_max_retries=2,
            github_retry_backoff_factor=0.01,
        ),
    ), patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = [err_503, err_503]
        with pytest.raises(GitHubUpstreamError) as exc_info:
            await github_get("https://api.github.com/test")
        assert exc_info.value.status_code == 503
        assert mock_get.call_count == 2


@pytest.mark.asyncio
async def test_github_get_retries_timeout_and_raises_timeout_error():
    """Verify httpx.TimeoutException retries and raises GitHubTimeoutError when exhausted."""
    with patch(
        "app.services.github_service.get_settings",
        return_value=Settings(
            github_read_timeout=4.0,
            github_max_retries=2,
            github_retry_backoff_factor=0.01,
        ),
    ), patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = [
            httpx.ReadTimeout("timed out", request=httpx.Request("GET", "https://api.github.com/timeout")),
            httpx.ReadTimeout("timed out", request=httpx.Request("GET", "https://api.github.com/timeout")),
        ]
        with pytest.raises(GitHubTimeoutError) as exc_info:
            await github_get("https://api.github.com/timeout")
        assert exc_info.value.timeout_seconds == 4.0
        assert mock_get.call_count == 2


@pytest.mark.asyncio
async def test_github_rate_limit_not_retried_as_5xx():
    """Rate limit (429 or 403 with 0 remaining) must raise immediately without 5xx retry loop."""
    err_429 = httpx.Response(
        429,
        headers={"Retry-After": "60"},
        request=httpx.Request("GET", "https://api.github.com/rate-limited"),
    )
    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = err_429
        with pytest.raises(GitHubRateLimitError):
            await github_get("https://api.github.com/rate-limited")
        assert mock_get.call_count == 1
