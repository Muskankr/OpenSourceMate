import unittest
import httpx
from app.main import app


class TestRecommendationsPagination(unittest.IsolatedAsyncioTestCase):
    """Test pagination through first, middle, and last pages ensuring no duplicates and no gaps (Issue #481)."""

    async def test_matched_issues_pagination_first_middle_last_pages(self):
        # Generate 55 distinct mock issues
        mock_issues = [
            {
                "id": 1000 + i,
                "title": f"Issue number {i}",
                "html_url": f"https://github.com/org/repo/issues/{i}",
                "body": f"Description for issue {i} in Python",
                "language": "Python",
                "labels": ["good first issue"],
                "comments": 2,
                "created_at": "2026-03-01T00:00:00Z",
                "updated_at": "2026-03-10T00:00:00Z",
                "reactions": {"total_count": 5},
            }
            for i in range(1, 56)
        ]

        async def mock_get_user_repositories(username, refresh=False):
            return [{"name": "repo1", "full_name": "octocat/repo1", "language": "Python", "fork": False}]

        def mock_analyze_skills(repositories, **kwargs):
            return {
                "skills": [{"name": "Python", "repository_count": 1, "percentage": 100.0}],
                "total_repositories_analyzed": 1,
            }

        async def mock_search_github_issues(language=None, label=None, per_page=10):
            return {"total_count": len(mock_issues), "issues": mock_issues}

        from unittest.mock import patch

        with patch("app.api.routes.matching.get_user_repositories", mock_get_user_repositories), \
             patch("app.api.routes.matching.analyze_skills", mock_analyze_skills), \
             patch("app.api.routes.matching.search_github_issues", mock_search_github_issues):

            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                # 1. Page 1: First page (limit=20, cursor=0)
                res_page1 = await client.get("/api/matching/users/octocat/issues?limit=20&cursor=0")
                self.assertEqual(res_page1.status_code, 200)
                data1 = res_page1.json()
                self.assertEqual(data1["total"], 55)
                self.assertEqual(len(data1["recommendations"]), 20)
                self.assertEqual(data1["next_cursor"], 20)
                page1_ids = [iss["id"] for iss in data1["recommendations"]]
                self.assertEqual(len(set(page1_ids)), 20)

                # 2. Page 2: Middle page (limit=20, cursor=20)
                res_page2 = await client.get("/api/matching/users/octocat/issues?limit=20&cursor=20")
                self.assertEqual(res_page2.status_code, 200)
                data2 = res_page2.json()
                self.assertEqual(data2["total"], 55)
                self.assertEqual(len(data2["recommendations"]), 20)
                self.assertEqual(data2["next_cursor"], 40)
                page2_ids = [iss["id"] for iss in data2["recommendations"]]
                self.assertEqual(len(set(page2_ids)), 20)
                # No overlap between page 1 and page 2
                self.assertTrue(set(page1_ids).isdisjoint(set(page2_ids)))

                # 3. Page 3: Last page (limit=20, cursor=40)
                res_page3 = await client.get("/api/matching/users/octocat/issues?limit=20&cursor=40")
                self.assertEqual(res_page3.status_code, 200)
                data3 = res_page3.json()
                self.assertEqual(data3["total"], 55)
                self.assertEqual(len(data3["recommendations"]), 15)  # Remaining 55 - 40 = 15
                self.assertIsNone(data3["next_cursor"])  # End of list
                page3_ids = [iss["id"] for iss in data3["recommendations"]]
                self.assertEqual(len(set(page3_ids)), 15)
                self.assertTrue(set(page2_ids).isdisjoint(set(page3_ids)))

                # Combined check: All 55 items retrieved with no gaps and no duplicates
                all_ids = page1_ids + page2_ids + page3_ids
                self.assertEqual(len(all_ids), 55)
                self.assertEqual(len(set(all_ids)), 55)

    async def test_matched_issues_pagination_validation_errors(self):
        """Test validation errors for invalid limit and cursor parameters (Issue #481)."""
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            # Invalid limit: 0 or negative
            res_bad_limit = await client.get("/api/matching/users/octocat/issues?limit=0")
            self.assertEqual(res_bad_limit.status_code, 422)

            # Invalid limit: exceeds 100
            res_too_high = await client.get("/api/matching/users/octocat/issues?limit=101")
            self.assertEqual(res_too_high.status_code, 422)

            # Invalid cursor: negative
            res_bad_cursor = await client.get("/api/matching/users/octocat/issues?cursor=-1")
            self.assertEqual(res_bad_cursor.status_code, 422)

    async def test_matched_issues_default_client_without_parameters(self):
        """Test that existing clients without pagination parameters still receive first page with default limit 20."""
        mock_issues = [
            {
                "id": 2000 + i,
                "title": f"Issue {i}",
                "html_url": f"https://github.com/org/repo/issues/{i}",
                "body": f"Python issue {i}",
                "language": "Python",
                "labels": ["good first issue"],
                "comments": 1,
                "created_at": "2026-03-01T00:00:00Z",
                "updated_at": "2026-03-10T00:00:00Z",
                "reactions": {"total_count": 1},
            }
            for i in range(1, 30)
        ]

        async def mock_get_user_repositories(username, refresh=False):
            return [{"name": "repo1", "full_name": "octocat/repo1", "language": "Python", "fork": False}]

        def mock_analyze_skills(repositories, **kwargs):
            return {
                "skills": [{"name": "Python", "repository_count": 1, "percentage": 100.0}],
                "total_repositories_analyzed": 1,
            }

        async def mock_search_github_issues(language=None, label=None, per_page=10):
            return {"total_count": len(mock_issues), "issues": mock_issues}

        from unittest.mock import patch

        with patch("app.api.routes.matching.get_user_repositories", mock_get_user_repositories), \
             patch("app.api.routes.matching.analyze_skills", mock_analyze_skills), \
             patch("app.api.routes.matching.search_github_issues", mock_search_github_issues):

            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get("/api/matching/users/octocat/issues")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertIn("recommendations", data)
                self.assertEqual(len(data["recommendations"]), 20)
                self.assertEqual(data["limit"], 20)
                self.assertEqual(data["next_cursor"], 20)
                self.assertEqual(data["total"], 29)


if __name__ == "__main__":
    unittest.main()
