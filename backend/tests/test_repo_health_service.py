"""Unit and route tests for repository health signals service (Issue #416).

Verifies:
- Public data metrics: days since last commit, share of recent PRs merged, median first response hours.
- Deterministic health status thresholds: Active, Slow, Inactive, Unknown.
- Repositories with too little data show 'Unknown', not 'Active'.
- Tests use shared sanitized API fixtures.
- Cache TTL and GitHub rate-limit error handling.
- FastAPI endpoint at /api/v1/repositories/health.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from httpx import Request, Response
from starlette.testclient import TestClient

from app.cache import cache
from app.main import app
from app.services.github_service import GitHubRateLimitError
from app.services.health_service import (
    HEALTH_CACHE_TTL_SECONDS,
    MIN_SAMPLE_THRESHOLD,
    compute_repository_health,
    evaluate_repository_health,
)
from tests.fixture_loader import load_fixture

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_shared_cache():
    cache.clear()
    yield
    cache.clear()


class TestRepositoryHealthRules:
    def test_active_repository_from_sanitized_fixture(self):
        fixture = load_fixture("health/health_active.json")
        now = datetime(2026, 11, 24, 12, 0, 0, tzinfo=UTC)

        result = compute_repository_health(
            repository=fixture["repository"],
            commits=fixture["commits"],
            pulls=fixture["pulls"],
            issues=fixture["issues"],
            now_dt=now,
        )

        assert result["status"] == "Active"
        assert result["days_since_last_commit"] is not None
        assert result["days_since_last_commit"] <= 30.0
        assert result["merged_pr_share"] == 0.75  # 3 of 4 merged
        assert result["median_response_hours"] is not None
        assert result["median_response_hours"] <= 48.0
        assert "Active:" in result["tooltip_text"]
        assert "actively shipping and reviewing" in result["tooltip_text"]

    def test_slow_repository_from_sanitized_fixture(self):
        fixture = load_fixture("health/health_slow.json")
        now = datetime(2026, 11, 24, 12, 0, 0, tzinfo=UTC)

        result = compute_repository_health(
            repository=fixture["repository"],
            commits=fixture["commits"],
            pulls=fixture["pulls"],
            issues=fixture["issues"],
            now_dt=now,
        )

        assert result["status"] == "Slow"
        assert result["days_since_last_commit"] is not None
        assert 30.0 < result["days_since_last_commit"] <= 90.0
        assert result["merged_pr_share"] == 0.25  # 1 of 4 merged
        assert "Slow:" in result["tooltip_text"]
        assert "reviews may take time" in result["tooltip_text"]

    def test_inactive_repository_from_sanitized_fixture(self):
        fixture = load_fixture("health/health_inactive.json")
        now = datetime(2026, 11, 24, 12, 0, 0, tzinfo=UTC)

        result = compute_repository_health(
            repository=fixture["repository"],
            commits=fixture["commits"],
            pulls=fixture["pulls"],
            issues=fixture["issues"],
            now_dt=now,
        )

        assert result["status"] == "Inactive"
        assert result["days_since_last_commit"] is not None
        assert result["days_since_last_commit"] > 90.0
        assert result["merged_pr_share"] == 0.0  # 0 of 3 merged
        assert "Inactive:" in result["tooltip_text"]
        assert "Minimal maintainer activity" in result["tooltip_text"]

    def test_unknown_repository_from_sanitized_fixture_insufficient_data(self):
        fixture = load_fixture("health/health_unknown.json")
        now = datetime(2026, 11, 24, 12, 0, 0, tzinfo=UTC)

        result = compute_repository_health(
            repository=fixture["repository"],
            commits=fixture["commits"],
            pulls=fixture["pulls"],
            issues=fixture["issues"],
            now_dt=now,
        )

        # Acceptance criteria: Repositories with too little data show 'Unknown', not 'Active'
        assert result["status"] == "Unknown"
        assert result["days_since_last_commit"] is None
        assert result["merged_pr_share"] is None
        assert result["sample_count"] == 0
        assert "Unknown:" in result["tooltip_text"]
        assert "Insufficient recent activity data" in result["tooltip_text"]

    def test_insufficient_sample_threshold_under_three_items(self):
        # Even with recent commits and merged PR, fewer than 3 samples must evaluate to Unknown
        now = datetime(2026, 11, 24, 12, 0, 0, tzinfo=UTC)
        recent_commit = [{
            "commit": {"committer": {"date": "2026-11-23T12:00:00Z"}},
        }]
        merged_pulls = [{"merged_at": "2026-11-23T12:00:00Z"}]
        # Only 2 issues (< 3 threshold)
        two_issues = [
            {"comments": 1, "created_at": "2026-11-23T10:00:00Z", "updated_at": "2026-11-23T12:00:00Z"},
            {"comments": 1, "created_at": "2026-11-22T10:00:00Z", "updated_at": "2026-11-22T12:00:00Z"},
        ]

        result = compute_repository_health(
            repository="test/sparse-repo",
            commits=recent_commit,
            pulls=merged_pulls,
            issues=two_issues,
            now_dt=now,
        )

        assert result["status"] == "Unknown"
        assert result["sample_count"] == 2
        assert result["status"] != "Active"


class TestRepositoryHealthAsyncService:
    @pytest.mark.asyncio
    async def test_evaluate_repository_health_caching_and_ttl(self):
        fixture = load_fixture("health/health_active.json")
        req = Request("GET", "https://api.github.com")

        mock_commits_resp = Response(200, json=fixture["commits"], request=req)
        mock_pulls_resp = Response(200, json=fixture["pulls"], request=req)
        mock_issues_resp = Response(200, json=fixture["issues"], request=req)

        call_count = 0

        async def mock_github_get(url: str, params=None):
            nonlocal call_count
            call_count += 1
            if "/commits" in url:
                return mock_commits_resp
            if "/pulls" in url:
                return mock_pulls_resp
            if "/issues" in url:
                return mock_issues_resp
            return Response(404, request=req)

        with patch("app.services.health_service.github_get", side_effect=mock_github_get):
            # First fetch - performs 3 network requests
            res1 = await evaluate_repository_health("sample-org/active-repo")
            assert res1["status"] == "Active"
            assert call_count == 3

            # Second fetch - served from TTL cache without extra network requests
            res2 = await evaluate_repository_health("sample-org/active-repo")
            assert res2["status"] == "Active"
            assert call_count == 3  # unchanged

            # Bypass cache forces fresh fetch
            res3 = await evaluate_repository_health("sample-org/active-repo", bypass_cache=True)
            assert res3["status"] == "Active"
            assert call_count == 6

    @pytest.mark.asyncio
    async def test_evaluate_repository_health_not_found_returns_unknown(self):
        req = Request("GET", "https://api.github.com")

        async def mock_github_get(url: str, params=None):
            return Response(404, request=req)

        with patch("app.services.health_service.github_get", side_effect=mock_github_get):
            res = await evaluate_repository_health("unknown/missing-repo")
            assert res["status"] == "Unknown"
            assert res["sample_count"] == 0

    @pytest.mark.asyncio
    async def test_evaluate_repository_health_rate_limit_handling(self):
        async def mock_github_get(url: str, params=None):
            raise GitHubRateLimitError(reset_at=datetime.now(UTC) + timedelta(minutes=15))

        with patch("app.services.health_service.github_get", side_effect=mock_github_get):
            with pytest.raises(GitHubRateLimitError):
                await evaluate_repository_health("rate-limited/repo")


class TestRepositoryHealthRoute:
    def test_get_repository_health_endpoint_success(self):
        fixture = load_fixture("health/health_active.json")
        req = Request("GET", "https://api.github.com")

        async def mock_github_get(url: str, params=None):
            if "/commits" in url:
                return Response(200, json=fixture["commits"], request=req)
            if "/pulls" in url:
                return Response(200, json=fixture["pulls"], request=req)
            if "/issues" in url:
                return Response(200, json=fixture["issues"], request=req)
            return Response(404, request=req)

        with patch("app.services.health_service.github_get", side_effect=mock_github_get):
            response = client.get("/api/v1/repositories/health?repo=sample-org/active-repo")
            assert response.status_code == 200
            data = response.json()
            assert data["repository"] == "sample-org/active-repo"
            assert data["status"] == "Active"
            assert "tooltip_text" in data
            assert "rule_explanation" in data

    def test_get_repository_health_invalid_repo_format(self):
        response = client.get("/api/v1/repositories/health?repo=invalid-format")
        assert response.status_code == 400
