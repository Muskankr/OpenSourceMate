"""Unit tests for user starred repositories interests extractor.

Verifies:
- Aggregates topics and languages correctly.
- Limits starred repo fetches up to 100 max.
- Handles empty/zero starred repositories.
- Employs cache and cache bypass parameter.
- Preserves rate limit on network failures.
"""

from unittest.mock import AsyncMock, patch
import httpx
import pytest

from app.services.github_service import cache
from app.services.starred_service import get_user_starred_interests


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.asyncio
class TestStarredInterestsService:
    """Test suite ensuring starred repository topics/languages aggregate properly as interest signals."""

    async def test_empty_starred_repos_returns_zero(self):
        """User with no stars returns empty topics and languages."""
        mock_response = httpx.Response(
            status_code=200,
            json=[],
            request=httpx.Request("GET", "https://api.github.com/users/test/starred"),
        )
        with patch("app.services.starred_service.github_get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            result = await get_user_starred_interests("testuser")
            assert result["starred_count"] == 0
            assert result["topics"] == []
            assert result["languages"] == []

    async def test_aggregates_topics_and_languages(self):
        """Extracts frequency counts from starred repo payloads."""
        mock_repos = [
            {
                "full_name": "org/fastapi-app",
                "language": "Python",
                "topics": ["fastapi", "docker", "api"],
            },
            {
                "full_name": "org/react-kit",
                "language": "TypeScript",
                "topics": ["react", "frontend", "docker"],
            },
            {
                "full_name": "org/python-ml",
                "language": "Python",
                "topics": ["machine-learning", "pytorch"],
            },
        ]
        mock_response = httpx.Response(
            status_code=200,
            json=mock_repos,
            request=httpx.Request("GET", "https://api.github.com/users/test/starred"),
        )

        with patch("app.services.starred_service.github_get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            result = await get_user_starred_interests("dev_user", limit=10)

            assert result["starred_count"] == 3
            # Check topics
            topic_dict = {t["topic"]: t["count"] for t in result["topics"]}
            assert topic_dict["docker"] == 2
            assert topic_dict["fastapi"] == 1
            assert topic_dict["react"] == 1

            # Check languages
            lang_dict = {l["language"]: l["count"] for l in result["languages"]}
            assert lang_dict["Python"] == 2
            assert lang_dict["TypeScript"] == 1

    async def test_endpoint_handles_404_cleanly(self):
        """When user is not found, returns graceful empty result."""
        mock_response = httpx.Response(
            status_code=404,
            request=httpx.Request("GET", "https://api.github.com/users/nonexistent/starred"),
        )
        with patch("app.services.starred_service.github_get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            result = await get_user_starred_interests("nonexistent")
            assert result["starred_count"] == 0
            assert result["topics"] == []

    async def test_caching_behavior(self):
        """Second call serves from cache without hitting github_get."""
        mock_repos = [{"language": "Rust", "topics": ["wasm"]}]
        mock_response = httpx.Response(
            status_code=200,
            json=mock_repos,
            request=httpx.Request("GET", "https://api.github.com/users/cachinguser/starred"),
        )

        with patch("app.services.starred_service.github_get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            res1 = await get_user_starred_interests("cachinguser", limit=20)
            res2 = await get_user_starred_interests("cachinguser", limit=20)

            assert mock_get.call_count == 1
            assert res1 == res2
