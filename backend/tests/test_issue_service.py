import json
from datetime import UTC, datetime, timedelta
from typing import Any
import httpx
import pytest

from app.config import Settings
from app.main import app
from app.services import github_service
from app.services.issue_service import (
    is_issue_assigned,
    is_repository_archived,
    is_repository_inactive,
    load_issue_filter_config,
    search_github_issues,
)


@pytest.fixture
async def api():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://test"
    ) as client:
        yield client


def _mock_issue_item(
    issue_id: int,
    title: str,
    repo_name: str,
    assignee: dict[str, Any] | None = None,
    assignees: list[dict[str, Any]] | None = None,
    updated_at: str = "2026-11-20T00:00:00Z",
) -> dict[str, Any]:
    return {
        "id": issue_id,
        "title": title,
        "body": f"Description for issue {issue_id}",
        "repository_url": f"https://api.github.com/repos/{repo_name}",
        "html_url": f"https://github.com/{repo_name}/issues/{issue_id}",
        "state": "open",
        "labels": [{"name": "good first issue"}],
        "comments": 2,
        "created_at": "2026-10-01T00:00:00Z",
        "updated_at": updated_at,
        "user": {"login": "contributor1"},
        "assignee": assignee,
        "assignees": assignees if assignees is not None else ([] if assignee is None else [assignee]),
    }


# ==============================================================================
# 1. Unit Tests for Helper Functions
# ==============================================================================


def test_is_issue_assigned():
    # Unassigned
    assert is_issue_assigned({"assignee": None, "assignees": []}) is False
    assert is_issue_assigned({}) is False

    # Single assignee in assignee field
    assert is_issue_assigned({"assignee": {"login": "alice"}}) is True

    # Single or multiple in assignees list
    assert is_issue_assigned({"assignee": None, "assignees": [{"login": "bob"}]}) is True
    assert (
        is_issue_assigned(
            {"assignee": None, "assignees": [{"login": "bob"}, {"login": "charlie"}]}
        )
        is True
    )


def test_is_repository_archived():
    # Not archived
    assert is_repository_archived({"archived": False}) is False
    assert is_repository_archived(None) is False

    # Archived repo data
    assert is_repository_archived({"archived": True}) is True

    # Embedded issue metadata
    assert is_repository_archived(None, {"repository_archived": True}) is True
    assert (
        is_repository_archived(None, {"repository": {"archived": True}}) is True
    )


def test_is_repository_inactive():
    now = datetime(2026, 11, 23, 12, 0, 0, tzinfo=UTC)

    # Disabled when max_inactive_days <= 0
    assert (
        is_repository_inactive(
            {"pushed_at": "2020-01-01T00:00:00Z"},
            max_inactive_days=0,
            now=now,
        )
        is False
    )

    # No data
    assert is_repository_inactive(None, max_inactive_days=90, now=now) is False

    # Active repo pushed 10 days ago (within 90-day threshold)
    ten_days_ago = (now - timedelta(days=10)).isoformat()
    assert (
        is_repository_inactive(
            {"pushed_at": ten_days_ago},
            max_inactive_days=90,
            now=now,
        )
        is False
    )

    # Inactive repo pushed 150 days ago (exceeds 90-day threshold)
    long_ago = (now - timedelta(days=150)).isoformat()
    assert (
        is_repository_inactive(
            {"pushed_at": long_ago, "updated_at": long_ago},
            max_inactive_days=90,
            now=now,
        )
        is True
    )

    # Most recent timestamp (pushed_at vs updated_at) is respected
    assert (
        is_repository_inactive(
            {"pushed_at": long_ago, "updated_at": ten_days_ago},
            max_inactive_days=90,
            now=now,
        )
        is False
    )


# ==============================================================================
# 2. Mocked GitHub API Tests for Issue Fetcher Rules
# ==============================================================================


async def test_skip_assigned_issues(github_mock):
    """Verify that issues with an assignee are filtered out and not returned."""
    unassigned_issue = _mock_issue_item(101, "Help wanted: docs", "acme/active-tool", assignee=None)
    assigned_issue_1 = _mock_issue_item(
        102, "Bug in parser", "acme/active-tool", assignee={"login": "dev1"}
    )
    assigned_issue_2 = _mock_issue_item(
        103, "Refactor component", "acme/active-tool", assignees=[{"login": "dev2"}]
    )

    def handler(request: httpx.Request) -> httpx.Response:
        if "/search/issues" in request.url.path:
            # Check that 'no:assignee' was added to query
            query = request.url.params.get("q", "")
            assert "no:assignee" in query
            return httpx.Response(
                200,
                json={
                    "total_count": 3,
                    "items": [unassigned_issue, assigned_issue_1, assigned_issue_2],
                },
            )
        if "/repos/acme/active-tool" in request.url.path:
            return httpx.Response(
                200,
                json={
                    "archived": False,
                    "pushed_at": "2026-11-20T00:00:00Z",
                    "updated_at": "2026-11-20T00:00:00Z",
                },
            )
        return httpx.Response(404)

    calls = github_mock(handler)

    result = await search_github_issues(language="python", skip_assigned=True)
    returned_ids = [iss["id"] for iss in result["issues"]]

    assert returned_ids == [101]
    assert 102 not in returned_ids
    assert 103 not in returned_ids


async def test_skip_archived_repositories(github_mock):
    """Verify that issues from archived repositories are filtered out."""
    issue_active = _mock_issue_item(201, "Active repo issue", "acme/live-project")
    issue_archived = _mock_issue_item(202, "Archived repo issue", "acme/frozen-project")

    def handler(request: httpx.Request) -> httpx.Response:
        if "/search/issues" in request.url.path:
            query = request.url.params.get("q", "")
            assert "archived:false" in query
            return httpx.Response(
                200,
                json={"total_count": 2, "items": [issue_active, issue_archived]},
            )
        if "/repos/acme/live-project" in request.url.path:
            return httpx.Response(
                200,
                json={"archived": False, "pushed_at": "2026-11-20T00:00:00Z"},
            )
        if "/repos/acme/frozen-project" in request.url.path:
            return httpx.Response(
                200,
                json={"archived": True, "pushed_at": "2026-11-20T00:00:00Z"},
            )
        return httpx.Response(404)

    github_mock(handler)

    result = await search_github_issues(skip_archived=True)
    returned_ids = [iss["id"] for iss in result["issues"]]

    assert returned_ids == [201]
    assert 202 not in returned_ids


async def test_skip_inactive_repositories(github_mock):
    """Verify that repositories with no recent activity within threshold are filtered out."""
    issue_recent = _mock_issue_item(301, "Fresh project issue", "acme/fresh-repo")
    issue_abandoned = _mock_issue_item(302, "Abandoned project issue", "acme/old-repo")

    now = datetime(2026, 11, 23, 12, 0, 0, tzinfo=UTC)
    five_days_ago = (now - timedelta(days=5)).isoformat()
    two_hundred_days_ago = (now - timedelta(days=200)).isoformat()

    def handler(request: httpx.Request) -> httpx.Response:
        if "/search/issues" in request.url.path:
            return httpx.Response(
                200,
                json={"total_count": 2, "items": [issue_recent, issue_abandoned]},
            )
        if "/repos/acme/fresh-repo" in request.url.path:
            return httpx.Response(
                200,
                json={"archived": False, "pushed_at": five_days_ago, "updated_at": five_days_ago},
            )
        if "/repos/acme/old-repo" in request.url.path:
            return httpx.Response(
                200,
                json={
                    "archived": False,
                    "pushed_at": two_hundred_days_ago,
                    "updated_at": two_hundred_days_ago,
                },
            )
        return httpx.Response(404)

    github_mock(handler)

    # 90-day threshold skips the 200-day old repo
    result = await search_github_issues(max_repo_inactive_days=90)
    returned_ids = [iss["id"] for iss in result["issues"]]

    assert returned_ids == [301]
    assert 302 not in returned_ids


async def test_repo_metadata_caching(github_mock):
    """Verify that repeated checks for the same repository use the cache without making extra API calls."""
    issue_1 = _mock_issue_item(401, "Issue 1", "acme/cached-repo")
    issue_2 = _mock_issue_item(402, "Issue 2", "acme/cached-repo")
    issue_3 = _mock_issue_item(403, "Issue 3", "acme/cached-repo")

    repo_calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal repo_calls
        if "/search/issues" in request.url.path:
            return httpx.Response(
                200,
                json={"total_count": 3, "items": [issue_1, issue_2, issue_3]},
            )
        if "/repos/acme/cached-repo" in request.url.path:
            repo_calls += 1
            return httpx.Response(
                200,
                json={"archived": False, "pushed_at": "2026-11-20T00:00:00Z"},
            )
        return httpx.Response(404)

    github_mock(handler)

    result = await search_github_issues(max_repo_inactive_days=90)
    assert len(result["issues"]) == 3
    # Exactly 1 request to /repos/acme/cached-repo for all 3 issues
    assert repo_calls == 1


# ==============================================================================
# 3. Configurable Thresholds Without Code Changes
# ==============================================================================


def test_configurable_via_json_config(tmp_path, monkeypatch):
    """Verify that filter thresholds can be adjusted by editing a config file only."""
    custom_config = {
        "skip_assigned": False,
        "skip_archived": False,
        "max_repo_inactive_days": 180,
    }
    config_file = tmp_path / "issue_filters.json"
    config_file.write_text(json.dumps(custom_config), encoding="utf-8")

    loaded = load_issue_filter_config(config_path=config_file)
    assert loaded["skip_assigned"] is False
    assert loaded["skip_archived"] is False
    assert loaded["max_repo_inactive_days"] == 180


def test_configurable_via_environment_variables(monkeypatch):
    """Verify that filter thresholds can be changed via environment variables."""
    monkeypatch.setenv("ISSUE_FILTER_SKIP_ASSIGNED", "false")
    monkeypatch.setenv("ISSUE_FILTER_SKIP_ARCHIVED", "false")
    monkeypatch.setenv("ISSUE_FILTER_MAX_REPO_INACTIVE_DAYS", "365")

    loaded = load_issue_filter_config()
    assert loaded["skip_assigned"] is False
    assert loaded["skip_archived"] is False
    assert loaded["max_repo_inactive_days"] == 365


# ==============================================================================
# 4. Acceptance Criterion: Filtered Issues Never Returned to Frontend
# ==============================================================================


async def test_filtered_issues_never_returned_to_frontend(api, github_mock):
    """End-to-end API test verifying that /api/matching/users/{username}/issues

    never returns assigned, archived, or inactive repository issues to the frontend.
    """
    valid_active_issue = _mock_issue_item(
        501, "Good active issue for Python", "acme/live-python-tool", assignee=None
    )
    assigned_issue = _mock_issue_item(
        502, "Taken issue in Python", "acme/live-python-tool", assignee={"login": "someone"}
    )
    archived_issue = _mock_issue_item(
        503, "Issue in archived project", "acme/archived-tool", assignee=None
    )
    abandoned_issue = _mock_issue_item(
        504, "Issue in abandoned project", "acme/dead-tool", assignee=None
    )

    now = datetime(2026, 11, 23, 12, 0, 0, tzinfo=UTC)
    five_days_ago = (now - timedelta(days=5)).isoformat()
    year_ago = (now - timedelta(days=365)).isoformat()

    def handler(request: httpx.Request) -> httpx.Response:
        # Mock user profile and repos
        if request.url.path == "/users/octocat":
            return httpx.Response(200, json={"login": "octocat", "type": "User"})
        if request.url.path == "/users/octocat/repos":
            return httpx.Response(
                200,
                json=[
                    {
                        "name": "my-tool",
                        "full_name": "octocat/my-tool",
                        "language": "Python",
                        "stargazers_count": 5,
                        "fork": False,
                        "updated_at": "2026-11-20T00:00:00Z",
                    }
                ],
            )
        if "/search/issues" in request.url.path:
            return httpx.Response(
                200,
                json={
                    "total_count": 4,
                    "items": [
                        valid_active_issue,
                        assigned_issue,
                        archived_issue,
                        abandoned_issue,
                    ],
                },
            )
        if "/repos/acme/live-python-tool" in request.url.path:
            return httpx.Response(
                200,
                json={"archived": False, "pushed_at": five_days_ago, "updated_at": five_days_ago},
            )
        if "/repos/acme/archived-tool" in request.url.path:
            return httpx.Response(
                200,
                json={"archived": True, "pushed_at": five_days_ago, "updated_at": five_days_ago},
            )
        if "/repos/acme/dead-tool" in request.url.path:
            return httpx.Response(
                200,
                json={"archived": False, "pushed_at": year_ago, "updated_at": year_ago},
            )
        return httpx.Response(404)

    github_mock(handler)

    response = await api.get("/api/matching/users/octocat/issues")
    assert response.status_code == 200
    data = response.json()

    recommendations = data["recommendations"]
    recommended_ids = [rec["id"] for rec in recommendations]

    # Only the valid active issue must be returned
    assert 501 in recommended_ids
    assert 502 not in recommended_ids  # assigned issue was filtered out
    assert 503 not in recommended_ids  # archived repo issue was filtered out
    assert 504 not in recommended_ids  # inactive repo issue was filtered out
