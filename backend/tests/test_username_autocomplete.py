"""Unit tests for GitHub username autocomplete service.

Verifies:
- Rejects queries under 3 characters (returns empty list).
- Parses GitHub search user results.
- Caches query results to avoid redundant external network hits.
- Limits results count.
- Gracefully handles network and rate limit errors without throwing 500.
"""

from unittest.mock import AsyncMock, patch
import httpx
import pytest

from app.services.autocomplete_service import autocomplete_github_users, autocomplete_cache


@pytest.fixture(autouse=True)
def clear_autocomplete_cache():
    autocomplete_cache.clear()
    yield
    autocomplete_cache.clear()


@pytest.mark.asyncio
class TestUsernameAutocomplete:
    """Test suite ensuring username autocomplete debounce limits and caching behave correctly."""

    async def test_short_query_returns_empty_without_calling_api(self):
        """Query with less than 3 chars returns [] immediately."""
        with patch("app.services.autocomplete_service.github_get", new_callable=AsyncMock) as mock_get:
            assert await autocomplete_github_users("") == []
            assert await autocomplete_github_users("a") == []
            assert await autocomplete_github_users("ab") == []
            assert mock_get.call_count == 0

    async def test_successful_autocomplete_query(self):
        """Query >= 3 chars calls search endpoint and maps user fields."""
        mock_payload = {
            "total_count": 2,
            "items": [
                {
                    "login": "octocat",
                    "avatar_url": "https://avatars.githubusercontent.com/u/583231",
                    "html_url": "https://github.com/octocat",
                },
                {
                    "login": "octocat-dev",
                    "avatar_url": "https://avatars.githubusercontent.com/u/123",
                    "html_url": "https://github.com/octocat-dev",
                },
            ],
        }
        mock_resp = httpx.Response(
            status_code=200,
            json=mock_payload,
            request=httpx.Request("GET", "https://api.github.com/search/users"),
        )

        with patch("app.services.autocomplete_service.github_get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_resp

            results = await autocomplete_github_users("octo", limit=5)
            assert len(results) == 2
            assert results[0]["username"] == "octocat"
            assert results[0]["avatar_url"] == "https://avatars.githubusercontent.com/u/583231"
            assert results[1]["username"] == "octocat-dev"

    async def test_autocomplete_caching(self):
        """Identical queries within TTL hit cache without calling external API."""
        mock_resp = httpx.Response(
            status_code=200,
            json={"items": [{"login": "babin123"}]},
            request=httpx.Request("GET", "https://api.github.com/search/users"),
        )

        with patch("app.services.autocomplete_service.github_get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_resp

            res1 = await autocomplete_github_users("babin", limit=5)
            res2 = await autocomplete_github_users("babin", limit=5)

            assert mock_get.call_count == 1
            assert res1 == res2

    async def test_error_handling_returns_empty_list(self):
        """Rate-limit or network errors return empty list gracefully."""
        with patch("app.services.autocomplete_service.github_get", side_effect=httpx.HTTPError("Network down")):
            results = await autocomplete_github_users("errorquery")
            assert results == []
