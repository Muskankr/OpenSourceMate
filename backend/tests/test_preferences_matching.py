"""Tests for contribution matching preferences parameters and filtering (#421)."""

from datetime import UTC, datetime, timedelta
import httpx
import pytest

from app.services.preferences_service import (
    filter_by_preferences,
    validate_excluded_orgs_or_repos,
    validate_expected_time,
    validate_max_age_days,
    validate_preference_languages,
)


def _make_issue(
    issue_id: int,
    title: str,
    repository: str,
    language: str | None = None,
    labels: list[str] | None = None,
    created_at: str | None = None,
    comments: int = 1,
    body: str = "Issue description",
):
    now_str = created_at or datetime.now(UTC).isoformat()
    return {
        "id": issue_id,
        "title": title,
        "repository": repository,
        "repository_url": f"https://api.github.com/repos/{repository}",
        "html_url": f"https://github.com/{repository}/issues/{issue_id}",
        "url": f"https://github.com/{repository}/issues/{issue_id}",
        "state": "open",
        "labels": labels or ["good first issue"],
        "comments": comments,
        "created_at": now_str,
        "updated_at": now_str,
        "user": "dev",
        "body": body,
        "language": language,
    }


class TestPreferencesValidators:
    """Tests for preference input validation and invalid input rejection."""

    def test_validate_preference_languages(self):
        assert validate_preference_languages(["Python", "TypeScript"]) == ["Python", "TypeScript"]
        assert validate_preference_languages(["C++, Rust, Go"]) == ["C++", "Rust", "Go"]
        assert validate_preference_languages(None) == []
        assert validate_preference_languages([]) == []

        # Invalid languages reject with ValueError
        with pytest.raises(ValueError, match="Invalid preferred language"):
            validate_preference_languages(["<script>alert(1)</script>"])

        with pytest.raises(ValueError, match="Invalid preferred language"):
            validate_preference_languages(["a" * 55])

    def test_validate_excluded_orgs_or_repos(self):
        assert validate_excluded_orgs_or_repos(["facebook", "google/angular"]) == [
            "facebook",
            "google/angular",
        ]
        assert validate_excluded_orgs_or_repos(None) == []

        # Case normalization
        assert validate_excluded_orgs_or_repos(["Facebook", "Google/Angular"]) == [
            "facebook",
            "google/angular",
        ]

        # Invalid format rejection
        with pytest.raises(ValueError, match="Invalid excluded organization"):
            validate_excluded_orgs_or_repos(["invalid org name with spaces"])

        with pytest.raises(ValueError, match="Invalid excluded organization"):
            validate_excluded_orgs_or_repos(["org/repo/extra/slash"])

    def test_validate_max_age_days(self):
        assert validate_max_age_days(30) == 30
        assert validate_max_age_days(None) is None

        with pytest.raises(ValueError, match="Invalid max_age_days"):
            validate_max_age_days(0)

        with pytest.raises(ValueError, match="Invalid max_age_days"):
            validate_max_age_days(-5)

        with pytest.raises(ValueError, match="Invalid max_age_days"):
            validate_max_age_days(5000)

    def test_validate_expected_time(self):
        assert validate_expected_time("quick") == "quick"
        assert validate_expected_time("WEEKEND") == "weekend"
        assert validate_expected_time("Ongoing") == "ongoing"
        assert validate_expected_time(None) is None

        with pytest.raises(ValueError, match="Invalid expected_time"):
            validate_expected_time("invalid_time")

        with pytest.raises(ValueError, match="Invalid expected_time"):
            validate_expected_time("fulltime")


class TestFilterByPreferences:
    """Tests for individual preferences and their combinations."""

    @pytest.fixture
    def sample_issues(self):
        now = datetime.now(UTC)
        return [
            _make_issue(
                1,
                "Fix Python bug",
                "orgA/repo-python",
                language="Python",
                created_at=(now - timedelta(days=5)).isoformat(),
                comments=1,
                body="Small typo fix",
            ),
            _make_issue(
                2,
                "Refactor Go worker",
                "orgB/repo-go",
                language="Go",
                created_at=(now - timedelta(days=20)).isoformat(),
                comments=4,
                body="Refactor concurrent pool",
            ),
            _make_issue(
                3,
                "Big TypeScript rewrite",
                "bigcorp/repo-ts",
                language="TypeScript",
                created_at=(now - timedelta(days=100)).isoformat(),
                comments=12,
                body="Major epic overhaul",
            ),
        ]

    def test_excluded_organizations_never_appear(self, sample_issues):
        # Exclude entire org 'bigcorp'
        filtered = filter_by_preferences(sample_issues, excluded_orgs_or_repos=["bigcorp"])
        assert len(filtered) == 2
        assert all("bigcorp" not in i["repository"] for i in filtered)

        # Exclude specific repo 'orgA/repo-python'
        filtered_repo = filter_by_preferences(sample_issues, excluded_orgs_or_repos=["orgA/repo-python"])
        assert len(filtered_repo) == 2
        assert all(i["repository"] != "orgA/repo-python" for i in filtered_repo)

    def test_preferred_languages_filter(self, sample_issues):
        filtered = filter_by_preferences(sample_issues, preferred_languages=["Python"])
        assert len(filtered) == 1
        assert filtered[0]["id"] == 1

        filtered_multi = filter_by_preferences(sample_issues, preferred_languages=["Go", "TypeScript"])
        assert len(filtered_multi) == 2
        assert {i["id"] for i in filtered_multi} == {2, 3}

    def test_max_age_days_filter(self, sample_issues):
        # Max age 10 days -> only issue 1 (5 days old)
        filtered = filter_by_preferences(sample_issues, max_age_days=10)
        assert len(filtered) == 1
        assert filtered[0]["id"] == 1

        # Max age 50 days -> issues 1 and 2
        filtered_50 = filter_by_preferences(sample_issues, max_age_days=50)
        assert len(filtered_50) == 2
        assert {i["id"] for i in filtered_50} == {1, 2}

    def test_expected_time_commitment(self, sample_issues):
        # 'quick' -> issue 1 (1 comment, small body)
        filtered_quick = filter_by_preferences(sample_issues, expected_time="quick")
        assert len(filtered_quick) >= 1
        assert filtered_quick[0]["id"] == 1

        # 'ongoing' -> issue 3 (12 comments, large epic)
        filtered_ongoing = filter_by_preferences(sample_issues, expected_time="ongoing")
        assert len(filtered_ongoing) >= 1
        assert any(i["id"] == 3 for i in filtered_ongoing)

    def test_combined_preferences(self, sample_issues):
        # Combination: preferred Go, max age 30 days, excluded bigcorp
        filtered = filter_by_preferences(
            sample_issues,
            preferred_languages=["Go"],
            excluded_orgs_or_repos=["bigcorp"],
            max_age_days=30,
            expected_time="weekend",
        )
        assert len(filtered) == 1
        assert filtered[0]["id"] == 2


from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_matching_route_with_preferences(monkeypatch):
    mock_repos = [
        {
            "name": "polyglot",
            "full_name": "octocat/polyglot",
            "description": "Multi repo",
            "language": "Python",
            "stargazers_count": 5,
            "forks_count": 0,
            "fork": False,
            "html_url": "https://github.com/octocat/polyglot",
            "updated_at": "2026-01-01T00:00:00Z",
        }
    ]
    mock_issues = {
        "total_count": 2,
        "issues": [
            _make_issue(201, "Python issue in excluded org", "hugecorp/framework", "Python", comments=1),
            _make_issue(202, "Python issue in friendly org", "friendlyorg/tool", "Python", comments=1),
        ],
    }

    from unittest.mock import AsyncMock, patch

    with patch("app.api.routes.matching.get_user_repositories", new=AsyncMock(return_value=mock_repos)), \
         patch("app.api.routes.matching.search_github_issues", new=AsyncMock(return_value=mock_issues)), \
         patch("app.api.routes.matching.generate_issue_match_explanation", new=AsyncMock(return_value={"explanation": "Matches Python", "is_ai_generated": False})):

        # 1. Query excluding hugecorp
        resp = client.get("/api/matching/users/octocat/issues?excluded_orgs=hugecorp")
        assert resp.status_code == 200
        data = resp.json()
        assert all("hugecorp" not in r["repository"] for r in data["recommendations"])
        assert any("friendlyorg" in r["repository"] for r in data["recommendations"])

        # 2. Query with invalid expected_time -> 400 Bad Request
        resp_invalid = client.get("/api/matching/users/octocat/issues?expected_time=invalid_time")
        assert resp_invalid.status_code == 400
        assert "Invalid expected_time" in resp_invalid.json()["detail"]

        # 3. Query with invalid max_age_days -> 400 Bad Request
        resp_invalid_age = client.get("/api/matching/users/octocat/issues?max_age_days=-10")
        assert resp_invalid_age.status_code == 400
        assert "Invalid max_age_days" in resp_invalid_age.json()["detail"]
