"""Unit tests for contributor programs configuration, matching, and endpoints (Acceptance Criteria)."""

from unittest.mock import AsyncMock, patch
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.services.program_service import (
    get_all_programs,
    get_program_by_id_or_name,
    issue_matches_program,
    filter_issues_by_program,
    load_programs_config,
)

client = TestClient(app)

SAMPLE_ISSUES = [
    {
        "id": 101,
        "title": "Add TypeScript type definitions for options parser",
        "repository": "vercel/next.js",
        "labels": ["good first issue", "typescript", "hacktoberfest"],
        "topics": ["hacktoberfest"],
        "language": "TypeScript",
    },
    {
        "id": 102,
        "title": "Improve async connection pool error handling in client",
        "repository": "tiangolo/fastapi",
        "labels": ["help wanted", "enhancement", "nsoc2026"],
        "topics": ["nsoc"],
        "language": "Python",
    },
    {
        "id": 103,
        "title": "Topic-only match for NJACK Winter of Code",
        "repository": "BurntSushi/ripgrep",
        "labels": ["cli", "rust"],
        "topics": ["nwoc"],
        "language": "Rust",
    },
    {
        "id": 104,
        "title": "General refactoring issue without program tags",
        "repository": "facebook/react",
        "labels": ["enhancement"],
        "topics": [],
        "language": "JavaScript",
    },
]


def test_load_programs_config_contains_nsoc_and_hacktoberfest():
    programs = get_all_programs()
    assert len(programs) >= 2

    prog_ids = [p["id"] for p in programs]
    assert "hacktoberfest" in prog_ids
    assert "nsoc" in prog_ids

    hacktoberfest = get_program_by_id_or_name("hacktoberfest")
    assert hacktoberfest is not None
    assert "hacktoberfest" in hacktoberfest["labels"]

    nsoc = get_program_by_id_or_name("nsoc")
    assert nsoc is not None
    assert "nsoc" in nsoc["labels"]
    assert "nwoc" in nsoc["topics"]


def test_get_program_by_id_or_name_case_insensitive():
    assert get_program_by_id_or_name("HACKTOBERFEST") is not None
    assert get_program_by_id_or_name("NSoC") is not None
    assert get_program_by_id_or_name("unknown-program-xyz") is None


def test_issue_matches_program_labels_and_topics():
    hacktoberfest = get_program_by_id_or_name("hacktoberfest")
    nsoc = get_program_by_id_or_name("nsoc")
    assert hacktoberfest is not None
    assert nsoc is not None

    # Issue 101 matches Hacktoberfest via label and topic
    assert issue_matches_program(SAMPLE_ISSUES[0], hacktoberfest) is True
    assert issue_matches_program(SAMPLE_ISSUES[0], nsoc) is False

    # Issue 102 matches NSoC via label
    assert issue_matches_program(SAMPLE_ISSUES[1], nsoc) is True
    assert issue_matches_program(SAMPLE_ISSUES[1], hacktoberfest) is False

    # Issue 103 matches NSoC via repository topic "nwoc"
    assert issue_matches_program(SAMPLE_ISSUES[2], nsoc) is True

    # Issue 104 has neither
    assert issue_matches_program(SAMPLE_ISSUES[3], hacktoberfest) is False
    assert issue_matches_program(SAMPLE_ISSUES[3], nsoc) is False


def test_filter_issues_by_program_acceptance_criteria_1():
    """Acceptance criterion 1: Selecting a program returns only issues carrying its labels or topics."""
    # Hacktoberfest
    h_results = filter_issues_by_program(SAMPLE_ISSUES, "hacktoberfest")
    assert len(h_results) == 1
    assert h_results[0]["id"] == 101

    # NSoC / NWOC
    n_results = filter_issues_by_program(SAMPLE_ISSUES, "nsoc")
    assert len(n_results) == 2
    assert {i["id"] for i in n_results} == {102, 103}


def test_new_program_added_via_config_only_acceptance_criteria_2(tmp_path, monkeypatch):
    """Acceptance criterion 2: A new program can be added by editing the config file only."""
    custom_config = {
        "version": "1.0.0",
        "programs": [
            {
                "id": "winter-hack",
                "name": "Winter Hack 2026",
                "labels": ["winterhack", "winterhack-accepted"],
                "topics": ["winter-hack"],
            }
        ],
    }

    config_file = tmp_path / "programs.json"
    import json

    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(custom_config, f)

    # Monkeypatch get_programs_config_path to point to our newly edited config file
    monkeypatch.setattr(
        "app.services.program_service.get_programs_config_path", lambda: config_file
    )
    load_programs_config(force_reload=True)

    # The newly added program is immediately recognized without code change
    new_prog = get_program_by_id_or_name("winter-hack")
    assert new_prog is not None
    assert new_prog["name"] == "Winter Hack 2026"

    custom_issue = {
        "id": 999,
        "title": "Winter Hack issue",
        "labels": ["winterhack"],
        "topics": [],
    }

    filtered = filter_issues_by_program([*SAMPLE_ISSUES, custom_issue], "winter-hack")
    assert len(filtered) == 1
    assert filtered[0]["id"] == 999

    # Reset
    load_programs_config(force_reload=True)


def test_empty_selector_keeps_current_behaviour_acceptance_criteria_3():
    """Acceptance criterion 3: Leaving the selector empty keeps the current behaviour."""
    assert filter_issues_by_program(SAMPLE_ISSUES, None) == SAMPLE_ISSUES
    assert filter_issues_by_program(SAMPLE_ISSUES, "") == SAMPLE_ISSUES
    assert filter_issues_by_program(SAMPLE_ISSUES, "   ") == SAMPLE_ISSUES
    assert filter_issues_by_program(SAMPLE_ISSUES, "all") == SAMPLE_ISSUES


def test_programs_endpoints():
    # 1. GET /api/matching/programs
    res1 = client.get("/api/matching/programs")
    assert res1.status_code == 200
    data1 = res1.json()
    assert "programs" in data1
    assert any(p["id"] == "hacktoberfest" for p in data1["programs"])
    assert any(p["id"] == "nsoc" for p in data1["programs"])

    # 2. GET /api/programs
    res2 = client.get("/api/programs")
    assert res2.status_code == 200
    assert "programs" in res2.json()


@pytest.mark.asyncio
async def test_get_matched_issues_with_program_query():
    mock_repos = [
        {
            "name": "my-repo",
            "language": "Python",
            "stargazers_count": 5,
            "fork": False,
        }
    ]

    mock_search = {
        "total_count": 2,
        "issues": [
            {
                "id": 1,
                "title": "Fix bug in FastAPI for NSoC",
                "repository": "tiangolo/fastapi",
                "url": "https://github.com/tiangolo/fastapi/issues/1",
                "labels": ["good first issue", "nsoc2026"],
                "topics": ["nsoc"],
                "comments": 2,
                "created_at": "2026-10-15T10:00:00Z",
                "updated_at": "2026-10-20T10:00:00Z",
                "language": "Python",
            },
            {
                "id": 2,
                "title": "General Python bug",
                "repository": "tiangolo/fastapi",
                "url": "https://github.com/tiangolo/fastapi/issues/2",
                "labels": ["good first issue"],
                "topics": [],
                "comments": 1,
                "created_at": "2026-10-16T10:00:00Z",
                "updated_at": "2026-10-21T10:00:00Z",
                "language": "Python",
            },
        ],
    }

    with (
        patch("app.api.routes.matching.get_user_repositories", AsyncMock(return_value=mock_repos)),
        patch("app.api.routes.matching.search_github_issues", AsyncMock(return_value=mock_search)),
    ):
        # 1. Query with program=nsoc -> returns only the NSoC issue
        res_nsoc = client.get("/api/matching/users/octocat/issues?program=nsoc")
        assert res_nsoc.status_code == 200
        body_nsoc = res_nsoc.json()
        assert body_nsoc["program"] == "nsoc"
        assert len(body_nsoc["recommendations"]) == 1
        assert body_nsoc["recommendations"][0]["id"] == 1

        # 2. Query with empty program -> returns both issues (unfiltered)
        res_empty = client.get("/api/matching/users/octocat/issues")
        assert res_empty.status_code == 200
        body_empty = res_empty.json()
        assert len(body_empty["recommendations"]) == 2

        # 3. Query with invalid program -> returns 400
        res_invalid = client.get("/api/matching/users/octocat/issues?program=nonexistent-program")
        assert res_invalid.status_code == 400
        assert "Invalid program" in res_invalid.text
