import unittest
from datetime import datetime, timezone
from app.services.skill_service import analyze_skills, has_user_commits_on_fork
from tests.fixture_loader import load_fixture


class TestForkAwareSkills(unittest.TestCase):
    def test_pure_fork_skipped_by_default(self):
        """Pure forks without commits should be skipped by default and reported in excluded_forks_count."""
        forks_only = load_fixture("repositories/repos_forks_only.json")
        result = analyze_skills(forks_only, include_forks=False)

        self.assertEqual(result["total_repositories_analyzed"], 0)
        self.assertEqual(result["excluded_forks_count"], 2)
        self.assertEqual(result["skills"], [])

    def test_include_all_forks_switch_restores_previous_behaviour(self):
        """Include-all switch restores inclusion of all forks at full 1.0 weight."""
        forks_only = load_fixture("repositories/repos_forks_only.json")
        result = analyze_skills(forks_only, include_forks=True)

        self.assertEqual(result["total_repositories_analyzed"], 2)
        self.assertEqual(result["excluded_forks_count"], 0)
        skill_names = {s["name"] for s in result["skills"] if s["type"] == "language"}
        self.assertIn("Python", skill_names)
        self.assertIn("TypeScript", skill_names)
        # Check weights are 1.0
        for s in result["skills"]:
            if s["type"] == "language":
                self.assertEqual(s["repository_count"], 1)

    def test_mixed_repositories_fixture(self):
        """Mixed fixture with own repository, pure fork, and fork with own commits."""
        mixed = load_fixture("repositories/repos_mixed_forks.json")
        result = analyze_skills(mixed, include_forks=False)

        # 1 own repo + 1 active fork with commits = 2 analyzed, 1 pure fork excluded
        self.assertEqual(result["total_repositories_analyzed"], 2)
        self.assertEqual(result["excluded_forks_count"], 1)

        # Kubernetes (Go) is pure fork -> should NOT appear as skill
        names = {s["name"]: s for s in result["skills"]}
        self.assertNotIn("Go", names)

        # TypeScript is own repo (weight 1.0)
        self.assertIn("TypeScript", names)
        self.assertEqual(names["TypeScript"]["repository_count"], 1)

        # Python is fork with own commits (weight 0.5)
        self.assertIn("Python", names)
        self.assertEqual(names["Python"]["repository_count"], 0.5)

        # TypeScript has higher weight/score than Python
        self.assertGreater(names["TypeScript"]["repository_count"], names["Python"]["repository_count"])

    def test_no_forks_fixture(self):
        """Repositories with no forks: excluded_forks_count is 0 and all repos analyzed."""
        no_forks = load_fixture("repositories/repos_no_forks.json")
        result = analyze_skills(no_forks, include_forks=False)

        self.assertEqual(result["total_repositories_analyzed"], 2)
        self.assertEqual(result["excluded_forks_count"], 0)
        names = {s["name"] for s in result["skills"]}
        self.assertIn("Rust", names)
        self.assertIn("TypeScript", names)

    def test_has_user_commits_on_fork_logic(self):
        """Test timestamp comparison and explicit flag in has_user_commits_on_fork."""
        # Non-fork always returns True
        self.assertTrue(has_user_commits_on_fork({"fork": False}))

        # Explicit flag
        self.assertTrue(has_user_commits_on_fork({"fork": True, "has_own_commits": True}))
        self.assertFalse(has_user_commits_on_fork({"fork": True, "has_own_commits": False}))

        # Timestamp comparison: pushed_at > created_at
        active_fork = {
            "fork": True,
            "created_at": "2024-01-01T12:00:00Z",
            "pushed_at": "2024-01-02T12:00:00Z",
        }
        self.assertTrue(has_user_commits_on_fork(active_fork))

        # Timestamp comparison: pushed_at == created_at
        pure_fork = {
            "fork": True,
            "created_at": "2024-01-01T12:00:00Z",
            "pushed_at": "2024-01-01T12:00:00Z",
        }
        self.assertFalse(has_user_commits_on_fork(pure_fork))

        # Missing timestamps
        self.assertFalse(has_user_commits_on_fork({"fork": True}))


if __name__ == "__main__":
    unittest.main()
