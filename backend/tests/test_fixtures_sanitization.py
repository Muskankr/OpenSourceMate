"""Validation tests for the shared sanitized GitHub API fixture suite."""

import json
import re

from tests.fixture_loader import FIXTURES_DIR, load_fixture

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
TOKEN_PATTERN = re.compile(r"(ghp_|gho_|github_pat_|Bearer\s+)", re.IGNORECASE)

REQUIRED_FIXTURES = [
    "users/user_standard.json",
    "users/user_no_bio.json",
    "users/user_no_repos.json",
    "users/user_many_repos.json",
    "repositories/repos_standard.json",
    "repositories/repos_empty.json",
    "repositories/repos_forks_only.json",
    "repositories/repos_large.json",
    "repositories/repos_paginated_page1.json",
    "repositories/repos_paginated_page2.json",
    "languages/languages_multi.json",
    "languages/languages_single.json",
    "languages/languages_empty.json",
    "events/events_active.json",
    "events/events_occasional.json",
    "events/events_empty.json",
    "health/health_active.json",
    "health/health_slow.json",
    "health/health_inactive.json",
    "health/health_unknown.json",
]


def test_required_fixtures_exist_and_are_valid_json():
    for rel_path in REQUIRED_FIXTURES:
        data = load_fixture(rel_path)
        assert data is not None


def _assert_no_key_recursive(obj: object, forbidden_key: str, path_label: str) -> None:
    """Recursively ensure a forbidden key is absent from nested dicts and lists."""
    if isinstance(obj, dict):
        assert forbidden_key not in obj, (
            f"Forbidden key '{forbidden_key}' in {path_label}"
        )
        for value in obj.values():
            _assert_no_key_recursive(value, forbidden_key, path_label)
    elif isinstance(obj, list):
        for item in obj:
            _assert_no_key_recursive(item, forbidden_key, path_label)


def test_all_fixtures_are_sanitized_without_emails_tokens_or_private_flags():
    json_files = sorted(FIXTURES_DIR.rglob("*.json"))
    assert len(json_files) >= len(REQUIRED_FIXTURES)

    for path in json_files:
        raw_text = path.read_text(encoding="utf-8")
        assert not EMAIL_PATTERN.search(raw_text), f"Email leaked in {path}"
        assert not TOKEN_PATTERN.search(raw_text), f"Token leaked in {path}"

        parsed = json.loads(raw_text)
        _assert_no_key_recursive(parsed, "node_id", str(path))

        if path.parent.name == "users":
            assert parsed.get("email") is None
        elif path.parent.name == "repositories":
            assert isinstance(parsed, list)
            for repo in parsed:
                assert repo.get("private") is False
        elif path.parent.name == "events":
            assert isinstance(parsed, list)
            for event in parsed:
                assert event.get("public") is True
                payload = event.get("payload")
                if isinstance(payload, dict):
                    assert "commits" not in payload
        elif path.parent.name == "languages":
            assert isinstance(parsed, dict)
            for language, byte_count in parsed.items():
                assert isinstance(language, str) and language
                assert isinstance(byte_count, int) and not isinstance(byte_count, bool)
                assert byte_count >= 0
        elif path.parent.name == "health":
            assert isinstance(parsed, dict)
            assert "commits" in parsed
            assert "pulls" in parsed
            assert "issues" in parsed


def test_edge_case_fixture_invariants():
    assert load_fixture("users/user_no_bio.json")["bio"] is None
    assert load_fixture("users/user_no_repos.json")["public_repos"] == 0
    assert load_fixture("users/user_many_repos.json")["public_repos"] >= 300

    assert load_fixture("repositories/repos_empty.json") == []
    forks_only = load_fixture("repositories/repos_forks_only.json")
    assert len(forks_only) > 0
    assert all(repo["fork"] is True for repo in forks_only)

    repos_large = load_fixture("repositories/repos_large.json")
    assert len(repos_large) == 100

    assert load_fixture("languages/languages_empty.json") == {}
    assert len(load_fixture("languages/languages_single.json")) == 1
    assert len(load_fixture("languages/languages_multi.json")) > 1

    assert len(load_fixture("events/events_active.json")) >= 15
    assert 1 <= len(load_fixture("events/events_occasional.json")) <= 14
    assert load_fixture("events/events_empty.json") == []

    active_health = load_fixture("health/health_active.json")
    assert len(active_health["commits"]) > 0
    assert len(active_health["pulls"]) > 0

    unknown_health = load_fixture("health/health_unknown.json")
    assert len(unknown_health["commits"]) == 0
    assert len(unknown_health["issues"]) == 0
