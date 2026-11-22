"""Tests for detecting claimed and stale issues before recommending them (#345).

Verifies detection rules:
- Assignee: Individual or multiple assignees flag the issue as claimed.
- Linked or open PR: GitHub pull_request key or PR URLs/references in body flag as claimed.
- Recent claim comment: Comments containing claim intent like "I'd like to work on this" flag as claimed.
- Inactive/stale: Issues with no updates beyond configurable stale_days flag as stale.
- Configurable filters: `exclude_claimed` and `exclude_stale` correctly filter issues.
- Acceptance criteria: Verified against fixtures, specifically the posted issue
  "Build the open-issue fetcher using the GitHub Search API".
"""

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
import unittest
from unittest.mock import AsyncMock, patch

from app.services.issue_flag_service import (
    CLAIM_PATTERNS,
    detect_assignee,
    detect_claim_comment,
    detect_linked_pr,
    detect_stale,
    evaluate_issue_flags,
)
from app.services.issue_service import (
    process_github_issue_item,
    search_github_issues,
)

FIXTURES_DIR = (
    Path(__file__).resolve().parent.parent.parent / "fixtures" / "issues"
).resolve()


class TestIssueClaimedAndStaleDetection(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 22, 12, 0, 0, tzinfo=UTC)

    def test_posted_issue_fetcher_unclaimed_baseline(self):
        """The posted issue 'Build the open-issue fetcher using the GitHub Search API'

        should NOT be flagged when it is active, unassigned, and has no PR or claim comments.
        """
        fixture_file = FIXTURES_DIR / "posted_issue_fetcher.json"
        with fixture_file.open("r", encoding="utf-8") as f:
            issue = json.load(f)

        self.assertEqual(
            issue["title"],
            "Build the open-issue fetcher using the GitHub Search API",
        )

        flags = evaluate_issue_flags(issue, stale_days=60, now=self.now)
        self.assertFalse(flags["is_claimed"])
        self.assertFalse(flags["is_stale"])
        self.assertFalse(flags["is_flagged"])
        self.assertEqual(flags["why_flagged"], [])

        # Check normalization
        processed = process_github_issue_item(issue, now=self.now)
        self.assertEqual(
            processed["title"],
            "Build the open-issue fetcher using the GitHub Search API",
        )
        self.assertFalse(processed["is_claimed"])
        self.assertFalse(processed["is_stale"])
        self.assertFalse(processed["is_flagged"])
        self.assertEqual(processed["why_flagged"], [])

    def test_posted_issue_flagged_when_assigned(self):
        """Posted issue flags as claimed when assigned to a contributor."""
        issue = {
            "title": "Build the open-issue fetcher using the GitHub Search API",
            "assignee": {"login": "octocat"},
            "assignees": [{"login": "octocat"}],
            "updated_at": (self.now - timedelta(days=2)).isoformat(),
        }

        has_assignee, assignees, reason = detect_assignee(issue)
        self.assertTrue(has_assignee)
        self.assertIn("octocat", assignees)
        self.assertIn("@octocat", reason)

        flags = evaluate_issue_flags(issue, now=self.now)
        self.assertTrue(flags["is_claimed"])
        self.assertTrue(flags["is_flagged"])
        self.assertTrue(any("Assigned to @octocat" in r for r in flags["why_flagged"]))

    def test_posted_issue_flagged_when_linked_pr_present(self):
        """Posted issue flags as claimed when a pull request is linked."""
        issue = {
            "title": "Build the open-issue fetcher using the GitHub Search API",
            "pull_request": {
                "html_url": "https://github.com/Muskankr/OpenSourceMate/pull/42"
            },
            "updated_at": (self.now - timedelta(days=3)).isoformat(),
        }

        has_pr, pr_ids, reason = detect_linked_pr(issue)
        self.assertTrue(has_pr)
        self.assertIn("https://github.com/Muskankr/OpenSourceMate/pull/42", pr_ids)

        flags = evaluate_issue_flags(issue, now=self.now)
        self.assertTrue(flags["is_claimed"])
        self.assertTrue(flags["is_flagged"])
        self.assertTrue(any("Linked pull request" in r for r in flags["why_flagged"]))

    def test_posted_issue_flagged_when_body_mentions_pr(self):
        """Posted issue flags as claimed when issue body references linked PR."""
        issue = {
            "title": "Build the open-issue fetcher using the GitHub Search API",
            "body": "Work in progress. Closes #123. See linked PR https://github.com/Muskankr/OpenSourceMate/pull/99",
            "updated_at": (self.now - timedelta(days=1)).isoformat(),
        }

        has_pr, pr_ids, reason = detect_linked_pr(issue)
        self.assertTrue(has_pr)
        self.assertTrue(any("#123" in x or "pull/99" in x for x in pr_ids))

        flags = evaluate_issue_flags(issue, now=self.now)
        self.assertTrue(flags["is_claimed"])
        self.assertTrue(flags["is_flagged"])

    def test_posted_issue_flagged_with_claim_comment(self):
        """Posted issue flags as claimed when recent comments express claim intent."""
        issue = {
            "title": "Build the open-issue fetcher using the GitHub Search API",
            "comments": 1,
            "comments_data": [
                {
                    "user": {"login": "contributor_jane"},
                    "body": "Hello! I'd like to work on this, could you please assign me?",
                    "created_at": (self.now - timedelta(days=2)).isoformat(),
                }
            ],
            "updated_at": (self.now - timedelta(days=2)).isoformat(),
        }

        has_claim, snippets, reason = detect_claim_comment(
            issue, recent_claim_days=14, now=self.now
        )
        self.assertTrue(has_claim)
        self.assertTrue(any("like to work on this" in s.lower() for s in snippets))
        self.assertIn("@contributor_jane", reason)

        flags = evaluate_issue_flags(issue, now=self.now)
        self.assertTrue(flags["is_claimed"])
        self.assertTrue(flags["is_flagged"])
        self.assertTrue(any("Recent claim comment" in r for r in flags["why_flagged"]))

    def test_claim_comment_older_than_window_not_flagged(self):
        """Claim comments older than recent_claim_days are not flagged as active claims."""
        issue = {
            "title": "Build the open-issue fetcher using the GitHub Search API",
            "comments_data": [
                {
                    "user": {"login": "abandoned_contributor"},
                    "body": "I'd like to work on this",
                    "created_at": (self.now - timedelta(days=45)).isoformat(),
                }
            ],
            "updated_at": (self.now - timedelta(days=45)).isoformat(),
        }

        # Window is 14 days, comment is 45 days old -> not recent!
        has_claim, _, _ = detect_claim_comment(issue, recent_claim_days=14, now=self.now)
        self.assertFalse(has_claim)

    def test_posted_issue_flagged_when_stale(self):
        """Posted issue flags as stale when inactive past stale threshold."""
        issue = {
            "title": "Build the open-issue fetcher using the GitHub Search API",
            "updated_at": (self.now - timedelta(days=75)).isoformat(),
        }

        is_stale, days, reason = detect_stale(issue, stale_days=60, now=self.now)
        self.assertTrue(is_stale)
        self.assertEqual(days, 75)
        self.assertIn("No activity for 75 days", reason)

        flags = evaluate_issue_flags(issue, stale_days=60, now=self.now)
        self.assertTrue(flags["is_stale"])
        self.assertTrue(flags["is_flagged"])
        self.assertFalse(flags["is_claimed"])

    def test_search_issues_mixed_fixtures_all_items(self):
        """Test the mixed search issues fixture covering all scenarios."""
        fixture_file = FIXTURES_DIR / "search_issues_mixed.json"
        with fixture_file.open("r", encoding="utf-8") as f:
            data = json.load(f)

        items = data["items"]
        self.assertEqual(len(items), 6)

        processed = [
            process_github_issue_item(it, stale_days=60, now=self.now)
            for it in items
        ]

        # Item 0: clean open issue
        self.assertFalse(processed[0]["is_flagged"])
        self.assertFalse(processed[0]["is_claimed"])
        self.assertFalse(processed[0]["is_stale"])

        # Item 1: assigned
        self.assertTrue(processed[1]["is_claimed"])
        self.assertTrue(any("Assigned to @octocat" in r for r in processed[1]["why_flagged"]))

        # Item 2: linked PR
        self.assertTrue(processed[2]["is_claimed"])
        self.assertTrue(any("Linked pull request" in r for r in processed[2]["why_flagged"]))

        # Item 3: claim comment
        self.assertTrue(processed[3]["is_claimed"])
        self.assertTrue(any("Recent claim comment" in r for r in processed[3]["why_flagged"]))

        # Item 4: stale
        self.assertTrue(processed[4]["is_stale"])
        self.assertTrue(any("No activity for" in r for r in processed[4]["why_flagged"]))

        # Item 5: clean frontend issue
        self.assertFalse(processed[5]["is_flagged"])

    @patch("app.services.issue_service.github_get")
    async def test_search_github_issues_configurable_filters(self, mock_github_get):
        """Test exclude_claimed and exclude_stale filtering in search_github_issues."""
        from unittest.mock import MagicMock

        fixture_file = FIXTURES_DIR / "search_issues_mixed.json"
        with fixture_file.open("r", encoding="utf-8") as f:
            raw_fixture = json.load(f)

        mock_resp = MagicMock()
        mock_resp.json.return_value = raw_fixture
        mock_resp.raise_for_status = MagicMock()
        mock_github_get.return_value = mock_resp

        # 1. Unfiltered: returns all 6 issues with flags attached
        res_all = await search_github_issues(
            language="python",
            exclude_claimed=False,
            exclude_stale=False,
            now=self.now,
        )
        self.assertEqual(len(res_all["issues"]), 6)
        flagged_count = sum(1 for iss in res_all["issues"] if iss["is_flagged"])
        self.assertEqual(flagged_count, 4)  # items 1, 2, 3, 4

        # 2. Exclude claimed: items 1, 2, 3 are excluded
        res_no_claimed = await search_github_issues(
            language="python",
            exclude_claimed=True,
            exclude_stale=False,
            now=self.now,
        )
        for iss in res_no_claimed["issues"]:
            self.assertFalse(iss["is_claimed"])
        self.assertEqual(len(res_no_claimed["issues"]), 3)  # items 0, 4, 5

        # 3. Exclude stale: item 4 is excluded
        res_no_stale = await search_github_issues(
            language="python",
            exclude_claimed=False,
            exclude_stale=True,
            stale_days=60,
            now=self.now,
        )
        for iss in res_no_stale["issues"]:
            self.assertFalse(iss["is_stale"])
        self.assertEqual(len(res_no_stale["issues"]), 5)  # items 0, 1, 2, 3, 5

        # 4. Exclude both: only clean issues (0 and 5) remain
        res_clean = await search_github_issues(
            language="python",
            exclude_claimed=True,
            exclude_stale=True,
            stale_days=60,
            now=self.now,
        )
        self.assertEqual(len(res_clean["issues"]), 2)
        for iss in res_clean["issues"]:
            self.assertFalse(iss["is_flagged"])
            self.assertEqual(iss["why_flagged"], [])

    @patch("app.services.issue_service.github_get")
    def test_issues_search_endpoint_with_filters(self, mock_github_get):
        """Test /api/issues/search endpoint returns valid serializer schema and respects filters."""
        from fastapi import FastAPI
        from starlette.testclient import TestClient
        from app.api.routes.issues import router as issues_router
        from unittest.mock import MagicMock

        fixture_file = FIXTURES_DIR / "search_issues_mixed.json"
        with fixture_file.open("r", encoding="utf-8") as f:
            raw_fixture = json.load(f)

        mock_resp = MagicMock()
        mock_resp.json.return_value = raw_fixture
        mock_resp.raise_for_status = MagicMock()
        mock_github_get.return_value = mock_resp

        app = FastAPI()
        app.include_router(issues_router, prefix="/api")
        client = TestClient(app)

        # Query endpoint with exclude_claimed=true
        resp = client.get("/api/issues/search?language=python&exclude_claimed=true")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("issues", data)
        self.assertEqual(data["total_count"], 3)
        for item in data["issues"]:
            self.assertFalse(item["is_claimed"])
            self.assertIn("claim_details", item)
            self.assertIn("why_flagged", item)

        # Query endpoint with both filters
        resp_clean = client.get(
            "/api/issues/search?language=python&exclude_claimed=true&exclude_stale=true"
        )
        self.assertEqual(resp_clean.status_code, 200)
        clean_data = resp_clean.json()
        self.assertEqual(clean_data["total_count"], 2)
        for item in clean_data["issues"]:
            self.assertFalse(item["is_flagged"])
            self.assertEqual(item["why_flagged"], [])


if __name__ == "__main__":
    unittest.main()
