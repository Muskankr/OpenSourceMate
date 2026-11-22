"""Tests for the OpenSourceMate (OSM) Command-Line Client (#348)."""

import io
import json
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import MagicMock, patch

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from osm.api_client import (
    ApiConnectionError,
    ApiRequestError,
    UserNotFoundError,
    fetch_user_skills,
    validate_username,
)
from osm.cli import main
from osm.formatter import format_skills_json, format_skills_table

MOCK_SKILLS_PAYLOAD = {
    "username": "octocat",
    "analyzed_at": "2026-11-22T12:00:00Z",
    "total_repositories_analyzed": 10,
    "skills": [
        {
            "name": "Python",
            "repository_count": 6,
            "percentage": 60.0,
            "type": "language",
            "proficiency": "Strong",
            "proficiency_score": 8.5,
        },
        {
            "name": "TypeScript",
            "repository_count": 3,
            "percentage": 30.0,
            "type": "language",
            "proficiency": "Comfortable",
            "proficiency_score": 6.0,
        },
        {
            "name": "Docker",
            "repository_count": 1,
            "percentage": 10.0,
            "type": "tool",
            "proficiency": "Learning",
            "proficiency_score": 3.0,
        },
    ],
}


class TestOsmUsernameValidation(unittest.TestCase):
    """Test username validation rules."""

    def test_valid_usernames(self):
        self.assertEqual(validate_username("octocat"), "octocat")
        self.assertEqual(validate_username("octo-cat"), "octo-cat")
        self.assertEqual(validate_username("user123"), "user123")
        self.assertEqual(validate_username("A"), "A")

    def test_invalid_usernames(self):
        with self.assertRaises(ValueError):
            validate_username("")
        with self.assertRaises(ValueError):
            validate_username("-leading-hyphen")
        with self.assertRaises(ValueError):
            validate_username("trailing-hyphen-")
        with self.assertRaises(ValueError):
            validate_username("invalid@user")
        with self.assertRaises(ValueError):
            validate_username("space user")
        with self.assertRaises(ValueError):
            validate_username("a" * 40)


class TestOsmFormatters(unittest.TestCase):
    """Test table and JSON formatting."""

    def test_format_skills_json(self):
        output = format_skills_json(MOCK_SKILLS_PAYLOAD)
        parsed = json.loads(output)
        self.assertEqual(parsed["username"], "octocat")
        self.assertEqual(len(parsed["skills"]), 3)

    def test_format_skills_table(self):
        output = format_skills_table(MOCK_SKILLS_PAYLOAD)
        self.assertIn("Skill Profile: @octocat", output)
        self.assertIn("Analyzed Repositories: 10", output)
        self.assertIn("Python", output)
        self.assertIn("TypeScript", output)
        self.assertIn("Strong (8.5/10)", output)
        self.assertIn("Comfortable (6.0/10)", output)
        self.assertIn("Learning (3.0/10)", output)

    def test_format_skills_table_empty(self):
        empty_payload = {
            "username": "newuser",
            "total_repositories_analyzed": 0,
            "skills": [],
        }
        output = format_skills_table(empty_payload)
        self.assertIn("No public technical skills detected", output)


class TestOsmApiClient(unittest.TestCase):
    """Test HTTP client with mocked responses."""

    @patch("urllib.request.urlopen")
    def test_fetch_user_skills_success(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps(MOCK_SKILLS_PAYLOAD).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        data = fetch_user_skills("octocat", api_url="http://localhost:8000")
        self.assertEqual(data["username"], "octocat")
        self.assertEqual(len(data["skills"]), 3)

    @patch("urllib.request.urlopen")
    def test_fetch_user_skills_404(self, mock_urlopen):
        http_error = urllib.error.HTTPError(
            url="http://localhost:8000/api/v1/github/users/ghost/skills",
            code=404,
            msg="Not Found",
            hdrs={},
            fp=io.BytesIO(b'{"detail":"GitHub user not found"}'),
        )
        mock_urlopen.side_effect = http_error

        with self.assertRaises(UserNotFoundError):
            fetch_user_skills("ghost")

    @patch("urllib.request.urlopen")
    def test_fetch_user_skills_429_rate_limit(self, mock_urlopen):
        http_error = urllib.error.HTTPError(
            url="http://localhost:8000/api/v1/github/users/octocat/skills",
            code=429,
            msg="Too Many Requests",
            hdrs={},
            fp=io.BytesIO(b'{"detail":"Rate limit exceeded"}'),
        )
        mock_urlopen.side_effect = http_error

        with self.assertRaises(ApiRequestError) as ctx:
            fetch_user_skills("octocat")
        self.assertIn("rate limit exceeded", str(ctx.exception).lower())

    @patch("urllib.request.urlopen")
    def test_fetch_user_skills_connection_error(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.URLError("Connection refused")

        with self.assertRaises(ApiConnectionError) as ctx:
            fetch_user_skills("octocat", api_url="http://unreachable-host:8000")
        self.assertIn("Could not connect to OpenSourceMate API", str(ctx.exception))


class TestOsmCliExecution(unittest.TestCase):
    """Test CLI command parsing, table/json outputs, and exit codes."""

    def test_help_command(self):
        stdout = io.StringIO()
        with patch("sys.stdout", stdout):
            code = main(["--help"])
        self.assertEqual(code, 0)
        self.assertIn("OpenSourceMate Command-Line Client", stdout.getvalue())

    def test_analyze_help(self):
        stdout = io.StringIO()
        with patch("sys.stdout", stdout):
            code = main(["analyze", "--help"])
        self.assertEqual(code, 0)
        self.assertIn("--api-url", stdout.getvalue())
        self.assertIn("--json", stdout.getvalue())

    @patch("osm.cli.fetch_user_skills")
    def test_analyze_table_output(self, mock_fetch):
        mock_fetch.return_value = MOCK_SKILLS_PAYLOAD
        stdout = io.StringIO()

        with patch("sys.stdout", stdout):
            code = main(["analyze", "octocat"])

        self.assertEqual(code, 0)
        output = stdout.getvalue()
        self.assertIn("Skill Profile: @octocat", output)
        self.assertIn("Python", output)
        self.assertIn("60.0%", output)

    @patch("osm.cli.fetch_user_skills")
    def test_analyze_json_output(self, mock_fetch):
        mock_fetch.return_value = MOCK_SKILLS_PAYLOAD
        stdout = io.StringIO()

        with patch("sys.stdout", stdout):
            code = main(["analyze", "octocat", "--json"])

        self.assertEqual(code, 0)
        parsed = json.loads(stdout.getvalue())
        self.assertEqual(parsed["username"], "octocat")
        self.assertEqual(len(parsed["skills"]), 3)

    def test_analyze_invalid_username_format(self):
        stderr = io.StringIO()
        with patch("sys.stderr", stderr):
            code = main(["analyze", "invalid@user!"])
        self.assertEqual(code, 1)
        self.assertIn("Invalid GitHub username", stderr.getvalue())

    @patch("osm.cli.fetch_user_skills")
    def test_analyze_user_not_found_exit_code(self, mock_fetch):
        mock_fetch.side_effect = UserNotFoundError("GitHub user 'unknown' was not found.")
        stderr = io.StringIO()

        with patch("sys.stderr", stderr):
            code = main(["analyze", "unknown"])

        self.assertEqual(code, 1)
        self.assertIn("Error: GitHub user 'unknown' was not found.", stderr.getvalue())

    @patch("osm.cli.fetch_user_skills")
    def test_analyze_connection_error_exit_code(self, mock_fetch):
        mock_fetch.side_effect = ApiConnectionError("Could not connect to API server.")
        stderr = io.StringIO()

        with patch("sys.stderr", stderr):
            code = main(["analyze", "octocat"])

        self.assertEqual(code, 1)
        self.assertIn("Connection Error:", stderr.getvalue())

    def test_analyze_missing_username_argument(self):
        stderr = io.StringIO()
        with patch("sys.stderr", stderr):
            code = main(["analyze"])
        # argparse returns exit code 2 when required positional argument is missing
        self.assertEqual(code, 2)
        self.assertIn("the following arguments are required: username", stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
