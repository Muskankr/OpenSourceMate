"""Tests for the SVG Skill Badge endpoint and service (#347)."""

import unittest
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes.badge import router as badge_router
from app.services.badge_service import generate_skill_badge_svg
from app.services.github_service import GitHubRateLimitError, GitHubUpstreamError

# Standalone FastAPI test app with dual-mounted badge router
test_app = FastAPI()
test_app.include_router(badge_router, prefix="/api/v1")
test_app.include_router(badge_router, prefix="/api")

MOCK_REPOSITORIES = [
    {
        "name": "project-python",
        "description": "Python project",
        "language": "Python",
        "fork": False,
        "stargazers_count": 50,
        "forks_count": 10,
        "languages": {"Python": 80000, "Shell": 5000},
        "topics": ["python", "fastapi"],
    },
    {
        "name": "project-frontend",
        "description": "TypeScript app",
        "language": "TypeScript",
        "fork": False,
        "stargazers_count": 30,
        "forks_count": 5,
        "languages": {"TypeScript": 60000, "CSS": 10000},
        "topics": ["react", "typescript"],
    },
    {
        "name": "project-backend",
        "description": "Go microservice",
        "language": "Go",
        "fork": False,
        "stargazers_count": 20,
        "forks_count": 2,
        "languages": {"Go": 40000},
        "topics": ["go"],
    },
]

MOCK_REPO_DETAILS = {
    "project-python": {"languages": {"Python": 80000, "Shell": 5000}, "topics": ["python", "fastapi"]},
    "project-frontend": {"languages": {"TypeScript": 60000, "CSS": 10000}, "topics": ["react", "typescript"]},
    "project-backend": {"languages": {"Go": 40000}, "topics": ["go"]},
}


class TestBadgeService(unittest.TestCase):
    """Test SVG badge generation and XML escaping."""

    def test_generate_badge_success(self):
        svg = generate_skill_badge_svg("octocat", skills=["Python", "TypeScript", "Go"])
        self.assertIn("<svg", svg)
        self.assertIn("</svg>", svg)
        self.assertIn("OpenSourceMate", svg)
        self.assertIn("Python • TypeScript • Go", svg)
        self.assertIn("#7c3aed", svg)  # Vibrant purple badge color
        self.assertIn('aria-label="OpenSourceMate skill badge for octocat: Python • TypeScript • Go"', svg)

    def test_generate_badge_max_three_skills(self):
        svg = generate_skill_badge_svg("octocat", skills=["Python", "TypeScript", "Go", "Rust", "C++"])
        self.assertIn("Python • TypeScript • Go", svg)
        self.assertNotIn("Rust", svg)

    def test_generate_badge_xml_escaping(self):
        # Usernames and skills with characters that must be escaped
        svg = generate_skill_badge_svg("user<script>", skills=["C++", "HTML & CSS", "<malicious>"])
        self.assertNotIn("<script>", svg)
        self.assertNotIn("<malicious>", svg)
        self.assertIn("&lt;script&gt;", svg)
        self.assertIn("HTML &amp; CSS", svg)
        self.assertIn("&lt;malicious&gt;", svg)

    def test_generate_badge_neutral_error(self):
        svg = generate_skill_badge_svg("octocat", error_message="skills unavailable")
        self.assertIn("<svg", svg)
        self.assertIn("skills unavailable", svg)
        self.assertIn("#6e7681", svg)  # Neutral gray color

    def test_generate_badge_empty_skills(self):
        svg = generate_skill_badge_svg("octocat", skills=[])
        self.assertIn("no public skills", svg)
        self.assertIn("#6e7681", svg)


class TestBadgeEndpoint(unittest.TestCase):
    """Test HTTP badge endpoint behavior, headers, and error fallbacks."""

    def setUp(self):
        self.client = TestClient(test_app)

    @patch("app.api.routes.badge.get_user_repositories")
    @patch("app.api.routes.badge.get_repository_details")
    def test_get_badge_success(self, mock_details, mock_repos):
        mock_repos.return_value = MOCK_REPOSITORIES
        mock_details.return_value = MOCK_REPO_DETAILS

        response = self.client.get("/api/badge/octocat.svg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/svg+xml")
        self.assertIn("public, max-age=3600", response.headers.get("cache-control", ""))
        self.assertIn("Python", response.text)
        self.assertIn("TypeScript", response.text)

    @patch("app.api.routes.badge.get_user_repositories")
    @patch("app.api.routes.badge.get_repository_details")
    def test_get_badge_v1_prefix(self, mock_details, mock_repos):
        mock_repos.return_value = MOCK_REPOSITORIES
        mock_details.return_value = MOCK_REPO_DETAILS

        response = self.client.get("/api/v1/badge/octocat.svg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/svg+xml")
        self.assertIn("Python", response.text)

    @patch("app.api.routes.badge.get_user_repositories")
    def test_get_badge_user_not_found_returns_neutral_badge(self, mock_repos):
        mock_repos.return_value = None  # 404 from GitHub

        response = self.client.get("/api/badge/nonexistent-user.svg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/svg+xml")
        self.assertIn("user not found", response.text)
        self.assertIn("#6e7681", response.text)  # Neutral gray

    @patch("app.api.routes.badge.get_user_repositories")
    def test_get_badge_rate_limited_returns_neutral_badge(self, mock_repos):
        mock_repos.side_effect = GitHubRateLimitError("Rate limit exceeded")

        response = self.client.get("/api/badge/octocat.svg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/svg+xml")
        self.assertIn("rate limited", response.text)
        self.assertIn("#6e7681", response.text)

    @patch("app.api.routes.badge.get_user_repositories")
    def test_get_badge_upstream_error_returns_neutral_badge(self, mock_repos):
        mock_repos.side_effect = GitHubUpstreamError(status_code=502, url="https://api.github.com")

        response = self.client.get("/api/badge/octocat.svg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/svg+xml")
        self.assertIn("skills unavailable", response.text)
        self.assertIn("#6e7681", response.text)

    def test_get_badge_invalid_username(self):
        response = self.client.get("/api/badge/invalid@@user!.svg")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "image/svg+xml")
        self.assertIn("invalid username", response.text)


if __name__ == "__main__":
    unittest.main()
