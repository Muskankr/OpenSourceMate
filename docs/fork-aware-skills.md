# Fork-Aware Skill Detection & Weighting (Issue #423)

## Overview

Forked repositories often distort detected user technical skills: for example, forking a large Go repository (e.g. Kubernetes) without ever committing to it does not signify personal expertise in Go. 

To ensure accurate, merit-based skill estimation, OpenSourceMate implements **fork-aware skill detection**.

---

## Behavior & Rules

1. **Pure Forks Skipped by Default**:
   - A repository marked `fork: true` where the user has not pushed any of their own commits (i.e., `has_own_commits == false`, or `pushed_at <= created_at`) is classified as a **pure fork**.
   - Pure forks are excluded from skill detection by default.
   - The total number of pure forks excluded is tracked and reported as `excluded_forks_count`.

2. **Active Forks Weighted Lower (0.5x)**:
   - When a user has pushed commits to a fork (`has_own_commits == true` or `pushed_at > created_at`), the fork is classified as an **active fork**.
   - Active forks contribute to language and framework analysis at a configurable reduced weight: `fork_own_commits_weight = 0.5` (50% of the weight of original non-fork repositories).

3. **Include All Forks Toggle**:
   - Users or API callers can pass `include_forks=true` (or toggle the "Include all forks" switch on the results page).
   - This restores the legacy behavior: all forks (pure and active) are included with standard 1.0 weight, and `excluded_forks_count` is 0.

4. **Results Page UI**:
   - Next to the repository count in the technical profile section, the UI displays the excluded fork count (e.g., `2 forks excluded`) alongside an interactive switch toggle `"Include all forks"`.
   - Toggling the switch instantly updates the skills analysis with `include_forks=true`.

---

## API Reference

### `GET /api/github/users/{username}/skills`

**Query Parameters:**
- `include_forks` (boolean, optional, default: `false`): Include all forked repositories with full 1.0 weight.
- `ignore_noise` (boolean, optional, default: `true`): Exclude noise languages.
- `group_related` (boolean, optional, default: `false`): Group related technologies into ecosystems.
- `include_proficiency` (boolean, optional, default: `true`): Calculate proficiency levels and scores.

**Response Schema (`UserSkillsSerializer`):**
```json
{
  "username": "octocat",
  "total_repositories_analyzed": 2,
  "excluded_forks_count": 1,
  "skills": [
    {
      "name": "TypeScript",
      "type": "language",
      "repository_count": 1,
      "percentage": 66.67,
      "weight": 1.0,
      "proficiency": "Learning"
    },
    {
      "name": "Python",
      "type": "language",
      "repository_count": 0.5,
      "percentage": 33.33,
      "weight": 0.5,
      "proficiency": "Learning"
    }
  ],
  "analyzed_at": "2026-11-24T18:00:00+00:00"
}
```

---

## Fixtures

Standard sanitized fixtures are provided in `fixtures/repositories/`:
- `repos_forks_only.json`: Only pure forks without own commits.
- `repos_mixed_forks.json`: Mixture of own original repo, pure fork, and active fork with user commits.
- `repos_no_forks.json`: Repositories with no forks (`fork: false`).
