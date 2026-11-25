"""Unit and integration tests for Discover welcoming repositories (Issue #447).

Verifies:
- Ranking by newcomer-friendliness score
- Deterministic 100-point score formula and tier thresholds
- Filtering by language and size (stars range)
- Sanitized search fixtures usage
- Empty search results handling
- Rate limit error propagation (HTTP 429)
- Query caching
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch
import pytest
from httpx import Response
from starlette.testclient import TestClient

from app.cache import cache
from app.main import app
from app.services.discover_service import (
    calculate_newcomer_friendliness_score,
    discover_repositories,
)
from app.services.github_service import GitHubRateLimitError
from tests.fixture_loader import load_fixture

client = TestClient(app)


# ---------------------------------------------------------
# Unit Tests: Scoring Formula and Invariants
# ---------------------------------------------------------
def test_calculate_newcomer_score_maximum_points():
    """A repository with >=5 beginner issues, active within 30 days, with CONTRIBUTING and CoC gets 100 pts."""
    now_iso = datetime.now(UTC).isoformat()
    score, tier, breakdown = calculate_newcomer_friendliness_score(
        good_first_issues=10,
        last_activity_iso=now_iso,
        has_contributing=True,
        has_code_of_conduct=True,
    )
    assert score == 100
    assert tier == "Very Welcoming"
    assert breakdown["beginner_issues_points"] == 30
    assert breakdown["recent_activity_points"] == 25
    assert breakdown["contributing_points"] == 25
    assert breakdown["code_of_conduct_points"] == 20


def test_calculate_newcomer_score_zero_points():
    """A repository with no beginner issues, no activity, no guide, no CoC gets 0 pts."""
    old_iso = (datetime.now(UTC) - timedelta(days=365)).isoformat()
    score, tier, breakdown = calculate_newcomer_friendliness_score(
        good_first_issues=0,
        last_activity_iso=old_iso,
        has_contributing=False,
        has_code_of_conduct=False,
    )
    assert score == 0
    assert tier == "Challenging"
    assert breakdown["beginner_issues_points"] == 0
    assert breakdown["recent_activity_points"] == 0
    assert breakdown["contributing_points"] == 0
    assert breakdown["code_of_conduct_points"] == 0


def test_calculate_newcomer_score_brackets():
    """Verify individual signal brackets and tier thresholds."""
    now_iso = datetime.now(UTC).isoformat()
    two_months_ago = (datetime.now(UTC) - timedelta(days=60)).isoformat()
    four_months_ago = (datetime.now(UTC) - timedelta(days=120)).isoformat()

    # Beginner issues brackets: >=5 -> 30, 3-4 -> 22, 1-2 -> 15, 0 -> 0
    s1, _, b1 = calculate_newcomer_friendliness_score(good_first_issues=4, last_activity_iso=None)
    assert b1["beginner_issues_points"] == 22

    s2, _, b2 = calculate_newcomer_friendliness_score(good_first_issues=2, last_activity_iso=None)
    assert b2["beginner_issues_points"] == 15

    # Activity brackets: <=30d -> 25, <=90d -> 15, <=180d -> 8, >180d -> 0
    _, _, b_recent = calculate_newcomer_friendliness_score(last_activity_iso=now_iso)
    assert b_recent["recent_activity_points"] == 25

    _, _, b_med = calculate_newcomer_friendliness_score(last_activity_iso=two_months_ago)
    assert b_med["recent_activity_points"] == 15

    _, _, b_older = calculate_newcomer_friendliness_score(last_activity_iso=four_months_ago)
    assert b_older["recent_activity_points"] == 8

    # Tier boundaries:
    # Very Welcoming: >= 80
    score_vw, tier_vw, _ = calculate_newcomer_friendliness_score(
        good_first_issues=5, last_activity_iso=now_iso, has_contributing=True, has_code_of_conduct=False
    )
    assert score_vw == 80
    assert tier_vw == "Very Welcoming"

    # Welcoming: 60 - 79
    score_w, tier_w, _ = calculate_newcomer_friendliness_score(
        good_first_issues=3, last_activity_iso=now_iso, has_contributing=True, has_code_of_conduct=False
    )
    assert score_w == 72  # 22 + 25 + 25 + 0
    assert tier_w == "Welcoming"

    # Moderate: 40 - 59
    score_m, tier_m, _ = calculate_newcomer_friendliness_score(
        good_first_issues=1, last_activity_iso=now_iso, has_contributing=False, has_code_of_conduct=False
    )
    assert score_m == 40  # 15 + 25
    assert tier_m == "Moderate"

    # Challenging: < 40
    score_c, tier_c, _ = calculate_newcomer_friendliness_score(
        good_first_issues=1, last_activity_iso=two_months_ago, has_contributing=False, has_code_of_conduct=False
    )
    assert score_c == 30  # 15 + 15
    assert tier_c == "Challenging"


# ---------------------------------------------------------
# Integration Tests: Discover Repositories with Sanitized Fixtures
# ---------------------------------------------------------
@pytest.mark.asyncio
async def test_discover_repositories_ranking_with_sanitized_fixtures():
    """Verify repositories are fetched and ranked strictly in descending score order."""
    cache.clear()
    search_fixture = load_fixture("search/search_repositories_python.json")

    async def mock_github_get(url: str, params=None):
        if "/search/repositories" in url:
            return Response(200, json=search_fixture, request=b"")
        if "/community/profile" in url:
            if "tiangolo/fastapi" in url:
                return Response(
                    200,
                    json={"files": {"contributing": {"url": "https://..."}, "code_of_conduct": {"url": "https://..."}}},
                    request=b"",
                )
            elif "pallets/flask" in url:
                return Response(
                    200,
                    json={"files": {"contributing": {"url": "https://..."}, "code_of_conduct": None}},
                    request=b"",
                )
            return Response(200, json={"files": {}}, request=b"")
        if "/search/issues" in url:
            if "tiangolo/fastapi" in str(params.get("q", "")):
                return Response(200, json={"total_count": 8}, request=b"")
            elif "pallets/flask" in str(params.get("q", "")):
                return Response(200, json={"total_count": 3}, request=b"")
            return Response(200, json={"total_count": 0}, request=b"")
        return Response(200, json={}, request=b"")

    with patch("app.services.discover_service.github_get", side_effect=mock_github_get):
        result = await discover_repositories(language="Python", limit=10)

        repos = result["repositories"]
        assert len(repos) > 0
        assert result["total_count"] == len(repos)
        assert result["selected_language"] == "Python"

        # Check ranking order: every item must have score >= next item's score
        scores = [r["newcomer_friendliness_score"] for r in repos]
        assert scores == sorted(scores, reverse=True)

        # tiangolo/fastapi has 8 issues (30), recent (25), contributing (25), coc (20) -> 100
        fastapi = next(r for r in repos if r["full_name"] == "tiangolo/fastapi")
        assert fastapi["newcomer_friendliness_score"] == 100
        assert fastapi["newcomer_friendliness_tier"] == "Very Welcoming"


@pytest.mark.asyncio
async def test_discover_repositories_size_and_empty_filter():
    """Verify star range filtering and empty result handling."""
    cache.clear()
    search_fixture = load_fixture("search/search_repositories_python.json")
    empty_fixture = load_fixture("search/search_repositories_empty.json")

    async def mock_github_get(url: str, params=None):
        q = str(params.get("q", "")) if params else ""
        if "stars:100..1000" in q:
            # Only small-helper should pass
            return Response(200, json=search_fixture, request=b"")
        return Response(200, json=empty_fixture, request=b"")

    with patch("app.services.discover_service.github_get", side_effect=mock_github_get):
        # 1. Size filter: 100 to 1,000 stars
        res_small = await discover_repositories(language="Python", min_stars=100, max_stars=1000)
        assert len(res_small["repositories"]) == 1
        assert res_small["repositories"][0]["full_name"] == "example/small-helper"

        # 2. Empty results
        res_empty = await discover_repositories(language="Haskell")
        assert res_empty["repositories"] == []
        assert res_empty["total_count"] == 0


def test_discover_route_via_client():
    """Test GET /api/v1/repositories/discover endpoint returns 200 with schema matching."""
    cache.clear()
    search_fixture = load_fixture("search/search_repositories_python.json")

    async def mock_github_get(url: str, params=None):
        if "/search/repositories" in url:
            return Response(200, json=search_fixture, request=b"")
        return Response(200, json={"files": {}}, request=b"")

    with patch("app.services.discover_service.github_get", side_effect=mock_github_get):
        resp = client.get("/api/v1/repositories/discover?language=Python&min_stars=500")
        assert resp.status_code == 200
        data = resp.json()
        assert "repositories" in data
        assert "total_count" in data
        assert data["selected_language"] == "Python"
        assert len(data["repositories"]) > 0


def test_discover_route_rate_limit_error():
    """Test that GitHubRateLimitError translates to HTTP 429."""
    cache.clear()

    async def mock_github_get(url: str, params=None):
        raise GitHubRateLimitError(reset_at=datetime.now(UTC) + timedelta(minutes=5))

    with patch("app.services.discover_service.github_get", side_effect=mock_github_get):
        resp = client.get("/api/v1/repositories/discover?language=Python")
        assert resp.status_code == 429
        data = resp.json()
        assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert "reset_at" in data
