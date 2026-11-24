"""Tests for configurable scoring weights, formula calculation, and 0-100 clamping (#422)."""

import math
import unittest
from datetime import UTC, datetime, timedelta

from app.services.matching_service import (
    calculate_issue_score,
    categorize_issue_freshness,
)
from app.services.scoring_config import DEFAULT_SCORING_CONFIG, ScoringConfig


def _create_sample_issue(
    language: str | None = "Python",
    labels: list[str] | None = None,
    updated_at: str | None = None,
    comments: int = 2,
    title: str = "Sample issue title",
    body: str = "Sample issue body",
    repository: str = "sample/repo",
) -> dict:
    return {
        "title": title,
        "repository": repository,
        "language": language,
        "labels": labels if labels is not None else ["good first issue"],
        "comments": comments,
        "updated_at": updated_at or datetime.now(UTC).isoformat(),
        "body": body,
    }


class TestScoringConfigFormula(unittest.TestCase):
    """Test scoring formula calculation for representative cases and weight responsiveness."""

    def test_default_config_values(self):
        config = DEFAULT_SCORING_CONFIG
        self.assertEqual(config.language_match_weight, 40.0)
        self.assertEqual(config.max_text_points, 30)
        self.assertEqual(config.max_embedding_points, 25)
        self.assertEqual(config.good_first_issue_bonus, 25)
        self.assertEqual(config.help_wanted_bonus, 15)
        self.assertEqual(config.activity_recent_bonus, 10)
        self.assertEqual(config.activity_moderate_bonus, 5)
        self.assertEqual(config.comments_manageable_bonus, 10)
        self.assertEqual(config.min_score, 0)
        self.assertEqual(config.max_score, 100)

    def test_custom_config_modifies_scoring_weights(self):
        issue = _create_sample_issue(
            language="Python",
            labels=["good first issue"],
            comments=2,
            title="Clean code",
            body="Short task",
        )
        skills = ["Python"]

        # Default config score
        default_res = calculate_issue_score(issue, skills, config=DEFAULT_SCORING_CONFIG)

        # Custom config with doubled language weight and zero good-first bonus
        custom_config = ScoringConfig(
            language_match_weight=20.0,
            good_first_issue_bonus=0,
            activity_recent_bonus=0,
            comments_manageable_bonus=0,
            max_text_points=0,
        )
        custom_res = calculate_issue_score(issue, skills, config=custom_config)

        # In custom_res, only language match should contribute (20 pts)
        self.assertEqual(custom_res["score"], 20)
        self.assertLess(custom_res["score"], default_res["score"])

    def test_representative_case_perfect_newcomer_match(self):
        """Case: Complete match with language, good first issue, help wanted, recent activity, few comments."""
        now = datetime.now(UTC)
        issue = _create_sample_issue(
            language="Python",
            labels=["good first issue", "help wanted"],
            updated_at=(now - timedelta(days=2)).isoformat(),
            comments=1,
            title="Fix Python parser bug",
            body="Looking for help in Python",
        )
        skills = [{"name": "Python", "weight": 1.0}]

        res = calculate_issue_score(issue, skills)
        self.assertEqual(res["score"], 100)
        self.assertGreaterEqual(res["raw_score"], 100)
        self.assertIn("Python", "".join(res["reasons"]))
        self.assertIn("good first issue", "".join(res["reasons"]))
        self.assertIn("actively looking for contributors", "".join(res["reasons"]))
        self.assertIn("active recently", "".join(res["reasons"]))
        self.assertIn("manageable discussion size", "".join(res["reasons"]))

    def test_representative_case_zero_overlap_old_stale_issue(self):
        """Case: Unrelated language, no beginner labels, many comments, inactive for 1 year."""
        old_time = (datetime.now(UTC) - timedelta(days=400)).isoformat()
        issue = _create_sample_issue(
            language="Fortran",
            labels=["bug", "performance"],
            updated_at=old_time,
            comments=45,
            title="Refactor numerical matrix core",
            body="Legacy code migration without keywords",
        )
        skills = [{"name": "Python", "weight": 1.0}]

        res = calculate_issue_score(issue, skills)
        self.assertEqual(res["score"], 0)
        self.assertEqual(res["raw_score"], 0)
        self.assertEqual(res["reasons"], [])

    def test_representative_case_partial_skill_weight(self):
        """Case: Developer has partial skill weight (0.5), language match scales accordingly."""
        issue = _create_sample_issue(
            language="Go",
            labels=[],
            updated_at=(datetime.now(UTC) - timedelta(days=200)).isoformat(),
            comments=25,
            title="Refactor concurrency",
            body="Routine refactoring",
        )
        skills = [{"name": "Go", "weight": 0.5}]

        res = calculate_issue_score(issue, skills)
        # 40 * 0.5 = 20 pts (no label, recency or comment bonuses)
        self.assertEqual(res["score"], 20)


class TestScoreRangeConstraints(unittest.TestCase):
    """Test that the final score always stays within 0 to 100 across extreme configurations and inputs."""

    def test_score_never_exceeds_100_with_extreme_positive_weights(self):
        extreme_config = ScoringConfig(
            language_match_weight=200.0,
            max_text_points=100,
            good_first_issue_bonus=100,
            help_wanted_bonus=100,
            activity_recent_bonus=100,
            comments_manageable_bonus=100,
            max_embedding_points=100,
        )

        issue = _create_sample_issue(
            language="Python",
            labels=["good first issue", "help wanted"],
            comments=1,
            title="Python issue",
            body="Python Python Python",
        )
        skills = [{"name": "Python", "weight": 1.0}]

        res = calculate_issue_score(issue, skills, config=extreme_config, embedding_similarity=1.0)
        self.assertGreater(res["raw_score"], 500)
        self.assertEqual(res["score"], 100, "Final score must never exceed 100")

    def test_score_never_drops_below_0_with_negative_contributions(self):
        custom_config = ScoringConfig(
            min_score=0,
            max_score=100,
        )
        issue = _create_sample_issue(
            language=None,
            labels=[],
            comments=100,
            title="",
            body="",
        )
        skills = []

        res = calculate_issue_score(issue, skills, config=custom_config)
        self.assertGreaterEqual(res["score"], 0, "Final score must never fall below 0")
        self.assertLessEqual(res["score"], 100)

    def test_failing_weight_change_is_caught_by_range_enforcement(self):
        """Verify that any configured range change is strictly respected."""
        bounded_config = ScoringConfig(min_score=10, max_score=80)
        issue = _create_sample_issue(language="Python", labels=["good first issue"])
        skills = ["Python"]

        res = calculate_issue_score(issue, skills, config=bounded_config)
        self.assertLessEqual(res["score"], 80)
        self.assertGreaterEqual(res["score"], 10)


class TestScoreBreakdownScript(unittest.TestCase):
    """Test that the explain_score breakdown helper runs offline and matches calculate_issue_score."""

    def test_explain_score_matches_calculate_issue_score(self):
        import sys
        from pathlib import Path

        repo_root = Path(__file__).resolve().parent.parent.parent
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

        from scripts.explain_score import SAMPLE_ISSUE, SAMPLE_PROFILE, explain_match_score

        breakdown = explain_match_score(SAMPLE_ISSUE, SAMPLE_PROFILE)
        calculated = calculate_issue_score(SAMPLE_ISSUE, SAMPLE_PROFILE)

        self.assertEqual(breakdown["clamped_score"], calculated["score"])
        self.assertEqual(breakdown["raw_score"], calculated["raw_score"])
        self.assertEqual(breakdown["reasons"], calculated["reasons"])
        self.assertGreaterEqual(breakdown["clamped_score"], 0)
        self.assertLessEqual(breakdown["clamped_score"], 100)


if __name__ == "__main__":
    unittest.main()
