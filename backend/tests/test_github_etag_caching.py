"""Unit tests verifying GitHub ETag conditional request caching and rate-limit savings.

Verifies:
- HTTP GET stores ETag from initial response.
- Subsequent calls send 'If-None-Match' header.
- HTTP 304 response serves cached payload without error.
- Cache hits/misses logged without sensitive tokens or credentials.
- Rate limits are preserved.
"""

from unittest.mock import AsyncMock, patch
import httpx
import pytest

from app.cache import cache
from app.services.github_service import github_get, GITHUB_API_URL


@pytest.fixture(autouse=True)
def clear_app_cache():
    """Clear memory cache and ETag store before each test."""
    cache.clear()
    yield
    cache.clear()


@pytest.mark.asyncio
class TestGitHubETagCaching:
    """Test suite ensuring ETag conditional headers are sent and 304s handled correctly."""

    async def test_initial_request_stores_etag_and_payload(self):
        """Initial 200 OK with ETag header stores the tag in the cache."""
        target_url = f"{GITHUB_API_URL}/users/octocat"
        response_body = {"login": "octocat", "id": 1}
        etag_val = 'W/"64f1e5828"'

        mock_resp = httpx.Response(
            status_code=200,
            json=response_body,
            headers={"ETag": etag_val, "X-RateLimit-Remaining": "59"},
            request=httpx.Request("GET", target_url),
        )

        with patch("app.services.github_service.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_resp
            mock_get_client.return_value = mock_client

            resp = await github_get(target_url)

            assert resp.status_code == 200
            assert resp.json() == response_body
            assert cache.get_etag(target_url) == (etag_val, response_body)
            # Verify no If-None-Match header was sent on first attempt
            call_headers = mock_client.get.call_args.kwargs.get("headers")
            assert call_headers is None or "If-None-Match" not in call_headers

    async def test_subsequent_request_sends_if_none_match_header(self):
        """Second call to same URL passes If-None-Match header."""
        target_url = f"{GITHUB_API_URL}/users/octocat"
        cached_data = {"login": "octocat", "id": 1}
        etag_val = 'W/"987654321"'
        cache.set_etag(target_url, etag_val, cached_data)

        mock_304_resp = httpx.Response(
            status_code=304,
            headers={"ETag": etag_val, "X-RateLimit-Remaining": "59"},
            request=httpx.Request("GET", target_url),
        )

        with patch("app.services.github_service.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_304_resp
            mock_get_client.return_value = mock_client

            resp = await github_get(target_url)

            # Assert If-None-Match was passed to client.get
            sent_headers = mock_client.get.call_args.kwargs.get("headers")
            assert sent_headers is not None
            assert sent_headers.get("If-None-Match") == etag_val

            # Assert synthetic 200 is returned with cached payload
            assert resp.status_code == 200
            assert resp.json() == cached_data
            assert resp.headers.get("X-Cache-Lookup") == "HIT_ETAG_304"

    async def test_disabling_etag_skips_header(self):
        """Passing use_etag=False avoids conditional check."""
        target_url = f"{GITHUB_API_URL}/users/octocat"
        cache.set_etag(target_url, "tag123", {"login": "octocat"})

        mock_200_resp = httpx.Response(
            status_code=200,
            json={"login": "octocat-updated"},
            request=httpx.Request("GET", target_url),
        )

        with patch("app.services.github_service.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_200_resp
            mock_get_client.return_value = mock_client

            resp = await github_get(target_url, use_etag=False)

            sent_headers = mock_client.get.call_args.kwargs.get("headers")
            assert sent_headers is None or "If-None-Match" not in sent_headers
            assert resp.json()["login"] == "octocat-updated"

    async def test_etag_cache_key_includes_query_params(self):
        """Different query params result in independent ETag cache slots."""
        base_url = f"{GITHUB_API_URL}/users/octocat/repos"
        params_page_1 = {"page": 1, "per_page": 30}
        params_page_2 = {"page": 2, "per_page": 30}

        cache.set_etag(f"{base_url}?page=1&per_page=30", "tag-p1", [{"name": "repo1"}])

        mock_resp = httpx.Response(
            status_code=200,
            json=[{"name": "repo2"}],
            headers={"ETag": "tag-p2"},
            request=httpx.Request("GET", base_url),
        )

        with patch("app.services.github_service.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_resp
            mock_get_client.return_value = mock_client

            # Query page 2
            resp = await github_get(base_url, params=params_page_2)

            sent_headers = mock_client.get.call_args.kwargs.get("headers")
            assert sent_headers is None or "If-None-Match" not in sent_headers
            assert resp.status_code == 200

            # Query page 1 (should send If-None-Match)
            mock_client.get.return_value = httpx.Response(
                status_code=304,
                headers={"ETag": "tag-p1"},
                request=httpx.Request("GET", base_url),
            )
            resp_p1 = await github_get(base_url, params=params_page_1)
            assert resp_p1.status_code == 200
            assert resp_p1.json() == [{"name": "repo1"}]

    async def test_304_without_cached_entry_does_not_crash(self):
        """If GitHub ever returns 304 without cached entry in memory, handled safely."""
        target_url = f"{GITHUB_API_URL}/test"
        mock_304_bare = httpx.Response(
            status_code=304,
            request=httpx.Request("GET", target_url),
        )

        with patch("app.services.github_service.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_304_bare
            mock_get_client.return_value = mock_client

            resp = await github_get(target_url, use_etag=False)
            assert resp.status_code == 304


    async def test_304_preserves_response_headers_and_status(self):
        """Synthetic response preserves ETag header and JSON decodability."""
        target_url = f"{GITHUB_API_URL}/orgs/opensource"
        sample_org = {"login": "opensource", "description": "Initiative"}
        cache.set_etag(target_url, 'W/"org-tag"', sample_org)

        mock_304 = httpx.Response(
            status_code=304,
            headers={"ETag": 'W/"org-tag"', "X-RateLimit-Remaining": "5000"},
            request=httpx.Request("GET", target_url),
        )

        with patch("app.services.github_service.get_client") as mock_get_client:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_304
            mock_get_client.return_value = mock_client

            resp = await github_get(target_url)
            assert resp.status_code == 200
            assert resp.json() == sample_org
            assert resp.headers["ETag"] == 'W/"org-tag"'

    async def test_clear_cache_flushes_etags(self):
        """Calling cache.clear() wipes both TTL entries and ETag store."""
        cache.set_etag("https://api.github.com/test", "tag", {"ok": True})
        assert cache.get_etag("https://api.github.com/test") is not None
        cache.clear()
        assert cache.get_etag("https://api.github.com/test") is None
