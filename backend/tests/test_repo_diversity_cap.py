"""Unit tests for repository diversity cap in issue matching (#446).

Verifies:
- No repository appears more than the cap in the default list.
- Only the highest-scoring issues are retained up to the cap.
- The relative order of kept items across all repositories is strictly preserved.
- Hidden issues exceeding the cap are properly segregated and can be expanded.
- Custom caps (1, 2, 5, 0/None for no cap) work deterministically.
"""

import pytest
from app.services.matching_service import (
    DEFAULT_MAX_ISSUES_PER_REPO,
    apply_repository_diversity_cap,
)


def _make_issue(issue_id: int, repo: str, score: int, title: str = "") -> dict:
    return {
        "id": issue_id,
        "repository": repo,
        "title": title or f"Issue {issue_id} in {repo}",
        "score": score,
        "_raw_score": score,
        "labels": ["good first issue"],
    }


class TestRepositoryDiversityCap:
    def test_default_cap_is_three(self):
        assert DEFAULT_MAX_ISSUES_PER_REPO == 3

    def test_caps_single_repo_at_default_three(self):
        # 6 issues from the same repository, sorted descending by score
        issues = [
            _make_issue(1, "octocat/hello-world", 95),
            _make_issue(2, "octocat/hello-world", 90),
            _make_issue(3, "octocat/hello-world", 85),
            _make_issue(4, "octocat/hello-world", 80),
            _make_issue(5, "octocat/hello-world", 75),
            _make_issue(6, "octocat/hello-world", 70),
        ]

        kept, hidden = apply_repository_diversity_cap(issues, max_per_repo=3)

        assert len(kept) == 3
        assert len(hidden) == 3

        # Highest scoring ones are kept
        assert [i["id"] for i in kept] == [1, 2, 3]
        assert [i["score"] for i in kept] == [95, 90, 85]

        # Remaining issues are placed in hidden in original order
        assert [i["id"] for i in hidden] == [4, 5, 6]
        assert [i["score"] for i in hidden] == [80, 75, 70]

    def test_preserves_relative_order_of_remaining_items_across_mixed_repos(self):
        # Interleaved repositories
        # Repo A: 5 issues (ids: 1, 2, 4, 7, 9)
        # Repo B: 3 issues (ids: 3, 5, 8)
        # Repo C: 2 issues (ids: 6, 10)
        issues = [
            _make_issue(1, "org/repo-a", 99),  # 1st for A -> kept
            _make_issue(2, "org/repo-a", 95),  # 2nd for A -> kept
            _make_issue(3, "org/repo-b", 92),  # 1st for B -> kept
            _make_issue(4, "org/repo-a", 90),  # 3rd for A -> kept
            _make_issue(5, "org/repo-b", 88),  # 2nd for B -> kept
            _make_issue(6, "org/repo-c", 85),  # 1st for C -> kept
            _make_issue(7, "org/repo-a", 82),  # 4th for A -> hidden (cap 3)
            _make_issue(8, "org/repo-b", 80),  # 3rd for B -> kept
            _make_issue(9, "org/repo-a", 78),  # 5th for A -> hidden (cap 3)
            _make_issue(10, "org/repo-c", 75), # 2nd for C -> kept
        ]

        kept, hidden = apply_repository_diversity_cap(issues, max_per_repo=3)

        # In kept list, no repo has >3 issues
        repo_counts = {}
        for issue in kept:
            repo_counts[issue["repository"]] = repo_counts.get(issue["repository"], 0) + 1
            assert repo_counts[issue["repository"]] <= 3

        # Exactly issues 7 and 9 from repo-a should be hidden
        assert [i["id"] for i in hidden] == [7, 9]

        # The relative order of kept items must match the original ordering
        expected_kept_ids = [1, 2, 3, 4, 5, 6, 8, 10]
        assert [i["id"] for i in kept] == expected_kept_ids

    def test_custom_cap_values(self):
        issues = [
            _make_issue(1, "repo/x", 90),
            _make_issue(2, "repo/x", 85),
            _make_issue(3, "repo/x", 80),
            _make_issue(4, "repo/y", 75),
        ]

        # Cap = 1: only 1 from repo/x and 1 from repo/y
        kept_1, hidden_1 = apply_repository_diversity_cap(issues, max_per_repo=1)
        assert [i["id"] for i in kept_1] == [1, 4]
        assert [i["id"] for i in hidden_1] == [2, 3]

        # Cap = 2: 2 from repo/x and 1 from repo/y
        kept_2, hidden_2 = apply_repository_diversity_cap(issues, max_per_repo=2)
        assert [i["id"] for i in kept_2] == [1, 2, 4]
        assert [i["id"] for i in hidden_2] == [3]

    def test_zero_or_negative_cap_disables_capping(self):
        issues = [
            _make_issue(1, "repo/x", 90),
            _make_issue(2, "repo/x", 85),
            _make_issue(3, "repo/x", 80),
            _make_issue(4, "repo/x", 75),
        ]

        kept_0, hidden_0 = apply_repository_diversity_cap(issues, max_per_repo=0)
        assert len(kept_0) == 4
        assert len(hidden_0) == 0

        kept_none, hidden_none = apply_repository_diversity_cap(issues, max_per_repo=None)
        assert len(kept_none) == 4
        assert len(hidden_none) == 0

    def test_case_insensitive_repository_normalization(self):
        # Repositories with mixed casing should be recognized as the same repository
        issues = [
            _make_issue(1, "Facebook/React", 95),
            _make_issue(2, "facebook/react", 90),
            _make_issue(3, "FACEBOOK/REACT", 85),
            _make_issue(4, "facebook/React", 80),
        ]

        kept, hidden = apply_repository_diversity_cap(issues, max_per_repo=2)
        assert len(kept) == 2
        assert len(hidden) == 2
        assert [i["id"] for i in kept] == [1, 2]
        assert [i["id"] for i in hidden] == [3, 4]

    def test_empty_list_returns_empty_tuples(self):
        kept, hidden = apply_repository_diversity_cap([], max_per_repo=3)
        assert kept == []
        assert hidden == []
