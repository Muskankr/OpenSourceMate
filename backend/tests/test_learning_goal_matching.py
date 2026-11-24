"""Tests for learning goal mode matching (Issue #418).

Verifies:
- Choosing a learning goal returns beginner issues in that technology.
- Results are ranked by approachability instead of skill overlap.
- Results are marked as stretch learning opportunities (is_stretch: True).
- The feature is off when no goal is selected.
- Tests cover goal selection and empty results.
"""

from unittest.mock import AsyncMock, patch
from starlette.testclient import TestClient

from app.main import app

client = TestClient(app)


def _make_issue(issue_id: int, title: str, language: str, comments: int = 0):
    return {
        "id": issue_id,
        "title": title,
        "body": f"Details for {title}",
        "repository_url": "https://api.github.com/repos/example/repo",
        "html_url": f"https://github.com/example/repo/issues/{issue_id}",
        "repository": "example/repo",
        "state": "open",
        "labels": ["good first issue"],
        "comments": comments,
        "created_at": "2026-10-01T00:00:00Z",
        "updated_at": "2026-10-15T00:00:00Z",
        "language": language,
    }


def test_learning_goal_selection_returns_beginner_issues_marked_stretch():
    rust_issues = [
        _make_issue(101, "Add CLI flag in Rust", "Rust", comments=1),
        _make_issue(102, "Fix typo in docs", "Rust", comments=8),
    ]

    async def mock_search(language, label, per_page=20):
        if language == "Rust":
            return {"total_count": 2, "issues": rust_issues}
        return {"total_count": 0, "issues": []}

    with patch("app.api.routes.matching.search_github_issues", side_effect=mock_search):
        resp = client.get("/api/matching/users/testuser/issues?learning_goal=Rust")
        assert resp.status_code == 200
        data = resp.json()

        assert len(data["recommendations"]) == 2
        rec0 = data["recommendations"][0]
        rec1 = data["recommendations"][1]

        # Acceptance criterion: Results are clearly labelled as learning opportunities
        assert rec0["is_stretch"] is True
        assert rec0["is_learning_mode"] is True
        assert rec0["learning_skill"] == "Rust"
        assert any("Stretch learning opportunity" in r for r in rec0["match_reasons"])

        # Ranked by approachability: fewer comments (small scope) ranks higher
        assert rec0["comments"] == 1
        assert rec1["comments"] == 8
        assert rec0["score"] > rec1["score"]


def test_learning_goal_empty_result():
    async def mock_search(language, label, per_page=20):
        return {"total_count": 0, "issues": []}

    with patch("app.api.routes.matching.search_github_issues", side_effect=mock_search):
        resp = client.get("/api/matching/users/testuser/issues?learning_goal=Haskell")
        assert resp.status_code == 200
        data = resp.json()

        # Acceptance criterion: Tests cover an empty result
        assert data["skills"] == ["Haskell"]
        assert data["recommendations"] == []


def test_learning_goal_feature_off_when_no_goal_selected():
    mock_repos = [
        {"name": "repo1", "fork": False, "language": "Python", "stargazers_count": 10}
    ]
    python_issues = [_make_issue(201, "Python issue", "Python", comments=0)]

    async def mock_get_repos(username):
        return mock_repos

    async def mock_search(language, label, per_page=10):
        return {"total_count": 1, "issues": python_issues}

    with patch("app.api.routes.matching.get_user_repositories", side_effect=mock_get_repos), \
         patch("app.api.routes.matching.search_github_issues", side_effect=mock_search):
        # Feature is off: no learning_goal query parameter provided
        resp = client.get("/api/matching/users/testuser/issues")
        assert resp.status_code == 200
        data = resp.json()

        assert len(data["recommendations"]) > 0
        rec = data["recommendations"][0]
        # Not marked as stretch because feature is off
        assert rec["is_stretch"] is False
        assert rec["is_learning_mode"] is False


def test_learning_goal_invalid_name_returns_400():
    resp = client.get("/api/matching/users/testuser/issues?learning_goal=<script>alert(1)</script>")
    assert resp.status_code == 400
