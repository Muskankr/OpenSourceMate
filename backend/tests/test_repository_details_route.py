import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

# Ensure backend/ is importable when invoked from repo root
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api.routes.github import router as github_router
from app.cache import cache

test_app = FastAPI()
test_app.include_router(github_router, prefix="/api")


class FakeResponse:
    def __init__(self, status_code: int, payload, text: str = ""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        return self._payload


class RepositoryDetailsRouteTests(unittest.TestCase):
    def setUp(self):
        cache.clear()
        self.client = TestClient(test_app)

    def tearDown(self):
        cache.clear()

    def test_get_repository_details_success_and_caches(self):
        async def fake_github_get(url: str, params=None, **kwargs):
            if url.endswith("/repos/vercel/next.js"):
                return FakeResponse(
                    200,
                    {
                        "full_name": "vercel/next.js",
                        "name": "next.js",
                        "owner": {"login": "vercel"},
                        "description": "The React Framework",
                        "html_url": "https://github.com/vercel/next.js",
                        "stargazers_count": 125000,
                        "forks_count": 26500,
                        "open_issues_count": 2900,
                        "default_branch": "canary",
                        "license": {"spdx_id": "MIT"},
                        "topics": ["react", "nextjs", "ssr"],
                        "pushed_at": "2026-11-20T12:00:00Z",
                    },
                )
            if url.endswith("/languages"):
                return FakeResponse(200, {"TypeScript": 8000, "JavaScript": 1500, "CSS": 500})
            if url.endswith("/commits"):
                return FakeResponse(
                    200,
                    [{"commit": {"committer": {"date": "2026-11-25T15:30:00Z"}}}],
                )
            if url.endswith("/community/profile"):
                return FakeResponse(
                    200,
                    {
                        "files": {
                            "contributing": {
                                "html_url": "https://github.com/vercel/next.js/blob/canary/contributing.md"
                            }
                        }
                    },
                )
            return FakeResponse(404, {})

        with patch("app.services.github_service.github_get", new=AsyncMock(side_effect=fake_github_get)) as mock_get:
            res1 = self.client.get("/api/github/repos/vercel/next.js")
            self.assertEqual(res1.status_code, 200)
            data1 = res1.json()
            self.assertEqual(data1["repository"], "vercel/next.js")
            self.assertEqual(data1["description"], "The React Framework")
            self.assertEqual(data1["stars"], 125000)
            self.assertEqual(data1["open_issues_count"], 2900)
            self.assertEqual(data1["languages"], ["TypeScript", "JavaScript", "CSS"])
            self.assertEqual(data1["last_commit_date"], "2026-11-25T15:30:00Z")
            self.assertEqual(
                data1["contributing_url"],
                "https://github.com/vercel/next.js/blob/canary/contributing.md",
            )
            self.assertFalse(data1["cached"])
            first_call_count = mock_get.call_count
            self.assertEqual(first_call_count, 4)

            # Second request should be served from cache without calling github_get again
            res2 = self.client.get("/api/github/repos/vercel/next.js")
            self.assertEqual(res2.status_code, 200)
            data2 = res2.json()
            self.assertTrue(data2["cached"])
            self.assertEqual(mock_get.call_count, first_call_count)

    def test_get_repository_details_not_found(self):
        async def fake_github_get(url: str, params=None, **kwargs):
            return FakeResponse(404, {"message": "Not Found"})

        with patch("app.services.github_service.github_get", new=AsyncMock(side_effect=fake_github_get)):
            res = self.client.get("/api/github/repos/vercel/nonexistent-repo-xyz")
            self.assertEqual(res.status_code, 404)

    def test_get_repository_details_invalid_repo_name(self):
        res = self.client.get("/api/github/repos/vercel/bad$repo")
        self.assertEqual(res.status_code, 422)


if __name__ == "__main__":
    unittest.main()
