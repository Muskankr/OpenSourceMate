"""
Unit tests for external merged PR history service and endpoint (Issue #192).
"""

from unittest.mock import AsyncMock, patch
import pytest
import httpx
from app.services.github_service import (
    GitHubRateLimitError,
    fetch_merged_external_pull_requests,
)


@pytest.mark.asyncio
async def test_fetch_merged_external_pull_requests_success():
    mock_search_data = {
        "total_count": 3,
        "items": [
            {
                "id": 1,
                "title": "Fix typing bug",
                "html_url": "https://github.com/orgA/repoA/pull/1",
                "repository_url": "https://api.github.com/repos/orgA/repoA",
                "created_at": "2026-10-01T10:00:00Z",
                "closed_at": "2026-10-02T10:00:00Z",
            },
            {
                "id": 2,
                "title": "Add documentation",
                "html_url": "https://github.com/orgA/repoA/pull/2",
                "repository_url": "https://api.github.com/repos/orgA/repoA",
                "created_at": "2026-10-03T10:00:00Z",
                "closed_at": "2026-10-04T10:00:00Z",
            },
            {
                "id": 3,
                "title": "Enhance CI workflow",
                "html_url": "https://github.com/orgB/repoB/pull/3",
                "repository_url": "https://api.github.com/repos/orgB/repoB",
                "created_at": "2026-10-05T10:00:00Z",
                "closed_at": "2026-10-06T10:00:00Z",
            },
        ],
    }

    mock_resp = httpx.Response(
        status_code=200,
        json=mock_search_data,
        request=httpx.Request("GET", "https://api.github.com/search/issues"),
    )

    with patch("app.services.github_service.get_client") as mock_get_client:
        client_mock = AsyncMock()
        client_mock.get.return_value = mock_resp
        mock_get_client.return_value = client_mock

        result = await fetch_merged_external_pull_requests("octocat", bypass_cache=True)

        assert result["username"] == "octocat"
        assert result["total_merged_prs"] == 3
        assert result["repositories_count"] == 2
        assert len(result["top_repositories"]) == 2
        assert result["top_repositories"][0]["repository"] == "orgA/repoA"
        assert result["top_repositories"][0]["count"] == 2
        assert result["top_repositories"][1]["repository"] == "orgB/repoB"
        assert result["top_repositories"][1]["count"] == 1


@pytest.mark.asyncio
async def test_fetch_merged_external_prs_zero_contributions():
    mock_resp = httpx.Response(
        status_code=200,
        json={"total_count": 0, "items": []},
        request=httpx.Request("GET", "https://api.github.com/search/issues"),
    )

    with patch("app.services.github_service.get_client") as mock_get_client:
        client_mock = AsyncMock()
        client_mock.get.return_value = mock_resp
        mock_get_client.return_value = client_mock

        result = await fetch_merged_external_pull_requests("newcomer", bypass_cache=True)
        assert result["total_merged_prs"] == 0
        assert result["repositories_count"] == 0
        assert result["top_repositories"] == []


@pytest.mark.asyncio
async def test_fetch_merged_external_prs_rate_limited():
    mock_resp = httpx.Response(
        status_code=403,
        headers={"x-ratelimit-reset": "1730900000"},
        request=httpx.Request("GET", "https://api.github.com/search/issues"),
    )

    with patch("app.services.github_service.get_client") as mock_get_client:
        client_mock = AsyncMock()
        client_mock.get.return_value = mock_resp
        mock_get_client.return_value = client_mock

        with pytest.raises(GitHubRateLimitError):
            await fetch_merged_external_pull_requests("busyuser", bypass_cache=True)
