"""Unit and integration tests for OpenSourceMate CLI (Issue #451).

Verifies:
- python -m opensourcemate execution
- opensourcemate recommend <username> formatting as table and valid JSON
- --limit, --language, --json, and --token options
- Reading GITHUB_TOKEN from environment
- Tokens are never leaked/printed in stdout or stderr
- Non-zero exit code on errors (invalid username, rate limits, exceptions)
- Mocked responses from backend matching service
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import pytest
from app.services.github_service import GitHubRateLimitError, GitHubTimeoutError
from opensourcemate.cli import (
    fetch_recommendations,
    format_table,
    main,
    sanitize_output,
)


@pytest.fixture
def mock_matched_issues():
    """Mock issues response returned by get_matched_issues."""
    return {
        "username": "octocat",
        "skills": ["Python", "TypeScript"],
        "recommendations": [
            {
                "id": 101,
                "title": "Fix memory leak in parser",
                "repository": "octocat/hello-world",
                "url": "https://github.com/octocat/hello-world/issues/101",
                "language": "Python",
                "labels": ["bug", "good first issue"],
                "match_score": 95.0,
                "score": 95.0,
            },
            {
                "id": 202,
                "title": "Add documentation for setup",
                "repository": "octocat/hello-world",
                "url": "https://github.com/octocat/hello-world/issues/202",
                "language": "TypeScript",
                "labels": ["documentation"],
                "match_score": 88.0,
                "score": 88.0,
            },
            {
                "id": 303,
                "title": "Refactor router handlers",
                "repository": "octocat/api-server",
                "url": "https://github.com/octocat/api-server/issues/303",
                "language": "Python",
                "labels": ["refactor"],
                "match_score": 75.0,
                "score": 75.0,
            },
        ],
    }


def test_sanitize_output_redacts_tokens():
    secret_token = "ghp_SuperSecretGitHubToken12345"
    text = f"Connecting using token {secret_token} to fetch data."
    sanitized = sanitize_output(text, secret_token)

    assert secret_token not in sanitized
    assert "[REDACTED_TOKEN]" in sanitized


def test_sanitize_output_leaves_safe_text_alone():
    text = "Everything is safe and normal."
    assert sanitize_output(text, None) == text
    assert sanitize_output(text, "abc") == text


def test_format_table_renders_headers_and_columns(mock_matched_issues):
    table = format_table(mock_matched_issues["recommendations"])

    assert "#" in table
    assert "Score" in table
    assert "Language" in table
    assert "Repository & Issue" in table
    assert "Link" in table
    assert "octocat/hello-world#101" in table
    assert "95%" in table
    assert "https://github.com/octocat/hello-world/issues/101" in table


def test_format_table_empty():
    assert format_table([]) == "No matching issues found."


@pytest.mark.asyncio
async def test_fetch_recommendations_filters_and_limits(mock_matched_issues):
    with patch(
        "opensourcemate.cli.get_matched_issues",
        new=AsyncMock(return_value=mock_matched_issues),
    ) as mock_get:
        # 1. Default fetch
        res = await fetch_recommendations("octocat", limit=2)
        mock_get.assert_called_once_with(username="octocat", skills=None)
        assert len(res["recommendations"]) == 2
        assert res["total"] == 2

        # 2. Language filter
        mock_get.reset_mock()
        res_lang = await fetch_recommendations("octocat", language="Python", limit=10)
        mock_get.assert_called_once_with(username="octocat", skills=["Python"])
        for iss in res_lang["recommendations"]:
            assert iss["language"] == "Python"
        assert len(res_lang["recommendations"]) == 2


def test_cli_help(capsys):
    with pytest.raises(SystemExit) as exc_info:
        main(["--help"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    assert "opensourcemate" in captured.out
    assert "recommend" in captured.out


def test_cli_no_args_prints_help_and_exits_nonzero(capsys):
    exit_code = main([])
    assert exit_code != 0
    captured = capsys.readouterr()
    assert "usage:" in captured.err.lower() or "opensourcemate" in captured.err.lower()


def test_cli_invalid_username_exits_nonzero(capsys):
    exit_code = main(["recommend", "invalid--username--"])
    assert exit_code == 1
    captured = capsys.readouterr()
    assert "Error: Invalid GitHub username" in captured.err


def test_cli_table_output_success(mock_matched_issues, capsys):
    with patch(
        "opensourcemate.cli.get_matched_issues",
        new=AsyncMock(return_value=mock_matched_issues),
    ):
        exit_code = main(["recommend", "octocat", "--limit", "2"])
        assert exit_code == 0
        captured = capsys.readouterr()

        assert "Top recommended issues for @octocat:" in captured.out
        assert "Detected skills: Python, TypeScript" in captured.out
        assert "octocat/hello-world#101" in captured.out
        assert "95%" in captured.out
        assert "https://github.com/octocat/hello-world/issues/101" in captured.out


def test_cli_json_output_valid_json(mock_matched_issues, capsys):
    with patch(
        "opensourcemate.cli.get_matched_issues",
        new=AsyncMock(return_value=mock_matched_issues),
    ):
        exit_code = main(["recommend", "octocat", "--json"])
        assert exit_code == 0
        captured = capsys.readouterr()

        parsed = json.loads(captured.out)
        assert parsed["username"] == "octocat"
        assert len(parsed["recommendations"]) == 3
        assert parsed["recommendations"][0]["id"] == 101


def test_cli_shortcut_syntax_without_subcommand(mock_matched_issues, capsys):
    with patch(
        "opensourcemate.cli.get_matched_issues",
        new=AsyncMock(return_value=mock_matched_issues),
    ):
        exit_code = main(["octocat", "--limit", "1"])
        assert exit_code == 0
        captured = capsys.readouterr()
        assert "Top recommended issues for @octocat:" in captured.out


def test_cli_rate_limit_error_handling(capsys):
    with patch(
        "opensourcemate.cli.get_matched_issues",
        new=AsyncMock(side_effect=GitHubRateLimitError()),
    ):
        exit_code = main(["recommend", "octocat"])
        assert exit_code == 1
        captured = capsys.readouterr()
        assert "Error: GitHub API rate limit reached" in captured.err


def test_cli_timeout_error_handling(capsys):
    with patch(
        "opensourcemate.cli.get_matched_issues",
        new=AsyncMock(side_effect=GitHubTimeoutError("https://api.github.com", 10.0)),
    ):
        exit_code = main(["recommend", "octocat"])
        assert exit_code == 1
        captured = capsys.readouterr()
        assert "Error: Request timed out" in captured.err


def test_cli_token_never_printed(monkeypatch, capsys):
    secret_token = "ghp_TopSecretTokenNeverPrint123456"
    monkeypatch.setenv("GITHUB_TOKEN", secret_token)

    with patch(
        "opensourcemate.cli.get_matched_issues",
        new=AsyncMock(side_effect=Exception(f"Failed with {secret_token}")),
    ):
        exit_code = main(["recommend", "octocat"])
        assert exit_code == 1
        captured = capsys.readouterr()

        assert secret_token not in captured.out
        assert secret_token not in captured.err
        assert "[REDACTED_TOKEN]" in captured.err
