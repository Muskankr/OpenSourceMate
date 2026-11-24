# Repository Health Signals Documentation (Issue #416)

## Overview

A recommended open-source issue is only actionable if maintainers are actively engaged and merging contributions. Newcomers and student contributors often invest significant effort preparing pull requests for repositories that have not reviewed or merged contributions in months, resulting in stalled PRs and wasted effort.

To address this, OpenSourceMate calculates objective **Repository Health Signals** from public data and surfaces them directly on every recommended issue card as a small, high-visibility status badge (`Active`, `Slow`, `Inactive`, or `Unknown`) with an interactive tooltip explaining the metrics.

---

## Public Health Signals

Health is evaluated from three public activity dimensions (sampling up to the latest 20 items):

1. **Days Since Last Commit**:
   - Elapsed days since the most recent commit on the repository default branch (`GET /repos/{owner}/{repo}/commits?per_page=1`).
2. **Share of Recent Pull Requests Merged**:
   - Proportion of recently updated pull requests that were successfully merged (`GET /repos/{owner}/{repo}/pulls?state=all&sort=updated&per_page=20`).
3. **Median Time to First Response**:
   - Median time (in hours) to first maintainer interaction across recent issues and pull requests (`GET /repos/{owner}/{repo}/issues?state=all&sort=updated&per_page=20`).

---

## Classification Rules & Thresholds

Repository activity is evaluated against deterministic thresholds:

| Status Badge | Commit Recency | PR Merge Rate | Median Response Time | Description & Tooltip | Badge Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Active** | $\le 30$ days | $\ge 50\%$ merged | $\le 48$ hours ($\le 2$ days) | Maintainers are actively shipping commits, reviewing issues, and merging PRs. Ideal for newcomers seeking quick feedback. | Emerald / Green (`🟢 Active`) |
| **Slow** | $\le 90$ days | $\ge 20\%$ merged | $\le 168$ hours ($\le 7$ days) | Project is maintained, but reviews and PR merges proceed at a slower pace. Expect moderate waiting periods. | Amber / Yellow (`🟡 Slow`) |
| **Inactive** | $> 90$ days | $< 20\%$ merged | $> 168$ hours ($> 7$ days) | Commits have stalled for months or PRs are rarely merged. Not recommended for contributors needing timely feedback. | Rose / Red (`🔴 Inactive`) |
| **Unknown** | No commits found | Insufficient data | Insufficient data | Repositories with fewer than 3 sampled items show **Unknown** instead of guessing. | Slate / Gray (`⚪ Unknown`) |

### Minimum Sample Threshold Rule

- **Rule**: If a repository has fewer than 3 sampled issues/PRs (`sampleCount < 3`) or no commit history can be resolved, the status evaluates strictly to **Unknown**.
- **Rationale**: An arbitrary guess on 1 or 2 outlier items would misrepresent repository responsiveness. Repositories with too little data show `Unknown`, not `Active`.

---

## Rate-Limit Handling & Caching Architecture

To respect GitHub API rate limits (unauthenticated: 60 req/hr, authenticated: 5,000 req/hr) and ensure sub-millisecond card rendering:

1. **Short TTL In-Memory Caching**:
   - Evaluated health signals are cached with a short TTL (Backend default: **300 seconds / 5 minutes**; Frontend default: **300,000 ms**).
   - Repeat requests within the cache window are served directly from cache without making external GitHub API calls.
2. **In-Flight Request Coalescing**:
   - Concurrent requests for the same repository across multiple issue cards share a single in-flight Promise/request.
3. **Conditional Requests & ETag Support**:
   - The backend service uses ETag-based conditional caching (`If-None-Match`). When GitHub returns `304 Not Modified`, cached data is served without consuming rate-limit tokens.
4. **Graceful Rate-Limit Degradation**:
   - If GitHub rate limits are exhausted (`GitHubRateLimitError` / HTTP 429), the service respects the `X-RateLimit-Reset` timestamp and falls back safely to cached ratings or `Unknown`.

---

## Shared Sanitized API Fixtures

Deterministic, privacy-sanitized fixtures conforming to GitHub REST API v3 are provided in `fixtures/health/`:
- `fixtures/health/health_active.json`: Active repository scenario with commits within 2 days, 75% merged PRs, and fast responses.
- `fixtures/health/health_slow.json`: Slow repository scenario with occasional commits and delayed response times.
- `fixtures/health/health_inactive.json`: Inactive repository scenario with commits >90 days old and zero merged PRs.
- `fixtures/health/health_unknown.json`: Empty repository scenario (< 3 samples) evaluating strictly to `Unknown`.

---

## Acceptance Criteria Verification

- [x] **The badge appears on every recommended issue**: Rendered in `IssueCard.tsx` alongside repository metadata for every recommended issue.
- [x] **Thresholds are documented**: Defined in this specification and surfaced in accessible badge tooltips.
- [x] **Repositories with too little data show 'Unknown', not 'Active'**: Repositories with $< 3$ samples strictly output `Unknown`.
- [x] **Unit tests use sanitized API fixtures**: Both backend (`backend/tests/test_repo_health_service.py`) and frontend (`frontend/__tests__/repoHealth.test.ts`, `frontend/__tests__/HealthBadge.test.tsx`) test active, slow, inactive, and unknown scenarios using sanitized fixtures.
- [x] **Caching & Rate-Limit Handling**: Results are cached with a short TTL, duplicate in-flight calls are coalesced, and GitHub rate limits are respected.
