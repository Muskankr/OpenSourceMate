# External Merged PR History & Contribution Discovery (Issue #192)

## Overview

Issue **#192** detects prior open-source experience across external repositories using the GitHub Search API (`is:pr is:merged author:<username> -user:<username>`).

Prior contributions outside personal repositories are a key heuristic for determining appropriate issue difficulty levels (guiding newcomers toward `good-first-issue` and seasoned contributors toward intermediate or advanced challenges).

---

## 1. Backend Service (`backend/app/services/github_service.py`)

- **Query**: `is:pr is:merged author:{username} -user:{username}`
- **Metrics Computed**:
  - `total_merged_prs`: Total count of merged PRs authored in third-party repos.
  - `repositories_count`: Unique external projects contributed to.
  - `top_repositories`: Repositories ranked by merged PR volume.
  - `recent_prs`: Details of recent merged contributions (title, link, merge date).
- **Caching**: Results cached in `TTLCache` (TTL: 15 minutes) to conserve GitHub API rate limits.
- **Rate Limit & Error Recovery**: Captures `403/429` with `X-RateLimit-Reset` timestamp and handles unindexed/422 responses cleanly.

---

## 2. API Endpoint (`GET /api/v1/github/users/{username}/external-prs`)

```json
{
  "username": "octocat",
  "total_merged_prs": 42,
  "repositories_count": 8,
  "top_repositories": [
    { "repository": "facebook/react", "count": 12 },
    { "repository": "vercel/next.js", "count": 9 }
  ],
  "recent_prs": [
    {
      "id": 101,
      "title": "Fix memory leak in hydration listener",
      "html_url": "https://github.com/facebook/react/pull/101",
      "repository": "facebook/react",
      "created_at": "2026-10-15T12:00:00Z"
    }
  ]
}
```

---

## 3. Frontend UI (`frontend/components/ExternalContributions.tsx`)

- **Encouraging Zero State**:
  When a developer has zero external merged PRs, OpenSourceMate renders an encouraging welcome message:
  *"No merged pull requests detected in external repositories yet. OpenSourceMate can help you find beginner-friendly issues to make your very first open-source contribution!"*
- **Active State**:
  Displays total merged PRs badge and clickable pills linking directly to external repositories on GitHub.

---

## 4. Testing & Verification

- Unit tests in `backend/tests/test_external_prs.py` simulating GitHub search responses, rate limits, and zero-contribution states.
- Frontend component tests in `frontend/__tests__/ExternalContributions.test.tsx`.
