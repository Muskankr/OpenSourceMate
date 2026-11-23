from unittest.mock import AsyncMock

import httpx
import pytest

from app.services.issue_difficulty import estimate_issue_difficulty
from app.services.issue_service import search_github_issues


@pytest.mark.parametrize(
    ("issue", "expected"),
    [
        ({"labels": [{"name": "LEVEL_1"}]}, "Beginner"),
        ({"labels": ["easy", "E-hard"]}, "Advanced"),
        (
            {"labels": ["good first issue"], "title": "Parser race condition"},
            "Advanced",
        ),
        ({"labels": ["- docs"], "title": "Fix a README typo"}, "Beginner"),
        ({"labels": [None, 4], "body": None, "comments": True}, "Intermediate"),
        (
            {
                "labels": ["good first issue"],
                "body": "src/a.py src/b.py docs/c.md",
                "comments": 18,
            },
            "Intermediate",
        ),
        (
            {
                "body": (
                    "src/a.py src/b.py docs/c.md "
                    "https://github.com/o/r/pull/1 https://github.com/o/r/pull/2"
                ),
                "comments": 18,
            },
            "Advanced",
        ),
    ],
)
def test_estimate_uses_priority_and_returns_a_reason(issue, expected):
    result = estimate_issue_difficulty(issue)
    assert result["difficulty"] == expected
    assert 0 < len(result["difficulty_reason"]) <= 120


def test_duplicate_references_do_not_inflate_the_estimate():
    url = "https://github.com/o/r/pull/1"
    issue = {"labels": ["good first issue"], "body": f"a.py a.py a.py {url} {url}"}
    assert estimate_issue_difficulty(issue)["difficulty"] == "Beginner"


@pytest.mark.asyncio
async def test_search_results_include_difficulty_even_when_body_is_truncated(
    monkeypatch,
):
    response = httpx.Response(
        200,
        request=httpx.Request("GET", "https://api.github.com/search/issues"),
        json={
            "total_count": 1,
            "items": [
                {
                    "id": 27,
                    "title": "Fix a matching edge case",
                    "repository_url": "https://api.github.com/repos/o/r",
                    "html_url": "https://github.com/o/r/issues/27",
                    "state": "open",
                    "labels": [{"name": "good first issue"}],
                    "comments": 17,
                    "created_at": "2026-11-14T00:00:00Z",
                    "updated_at": "2026-11-15T00:00:00Z",
                    "user": {"login": "reporter"},
                    "body": "Long description. " * 120 + " src/a.py src/b.py docs/c.md",
                }
            ],
        },
    )
    mock = AsyncMock(return_value=response)
    monkeypatch.setattr("app.services.issue_service.github_get", mock)
    result = await search_github_issues(language="Python")
    issue = result["issues"][0]
    assert issue["difficulty"] == "Advanced"
    assert issue["difficulty_reason"]
    assert len(issue["body"]) == 1000
    mock.assert_awaited_once()
