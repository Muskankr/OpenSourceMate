# Repository Responsiveness Signal Documentation

## Overview

Finding an easy or beginner-friendly issue is only half the battle: if maintainers are inactive or take weeks to review pull requests, contributors (especially newcomers and students) can become discouraged or stuck waiting. 

To solve this, OpenSourceMate calculates a simple, objective **Repository Responsiveness Signal** for every repository and displays it directly on each recommended issue card.

---

## Classification Rules

Responsiveness is computed from maintainer interaction metrics (such as the median time to first maintainer response/comment on recent issues and PRs) using the following deterministic thresholds:

| Rating | Median Response Time | Description & Tooltip | Badge Visual |
| :--- | :--- | :--- | :--- |
| **Fast** | $\le 24$ hours ($\le 1$ day) | Maintainers typically respond within 24 hours. Ideal for rapid feedback and quick PR reviews. | Emerald / Green |
| **Moderate** | $> 24$ hours and $\le 72$ hours (1–3 days) | Maintainers respond within 1 to 3 days. Standard open-source project review pace. | Blue |
| **Slow** | $> 72$ hours (> 3 days) | Maintainers typically take more than 3 days to respond. Reviews and comments may be delayed. | Amber / Orange |
| **Not enough data** | Fewer than 3 data points or missing metrics | Repositories with fewer than 3 recent active discussions show **Not enough data** instead of guessing. | Slate / Gray |

### Minimum Sample Threshold Rule

To prevent misleading recommendations on quiet or newly created repositories:
- **Rule**: If a repository has fewer than 3 active issues or pull requests sampled (`sampleCount < 3`), the system strictly assigns **Not enough data**.
- **Rationale**: An arbitrary guess on 1 or 2 outlier issues would misrepresent maintainer activity.

---

## Rate-Limit Protection & Caching Architecture

To respect GitHub API rate limits and avoid redundant network requests across multiple issue cards from the same repository:

1. **In-Memory & Persistent Cache Window**:
   - Every evaluated repository response is cached for a configurable TTL window (default: **1 hour / 3,600,000 ms**).
   - Repeat requests within the cache window return the cached rating immediately without triggering extra API calls.

2. **In-Flight Request Coalescing**:
   - If multiple issue cards for the same repository (e.g., 5 issues from `vercel/next.js`) mount concurrently, the system merges them into a single in-flight Promise so only **1 network request** is executed.

3. **Fallback & Graceful Degradation**:
   - When the backend or GitHub API is rate-limited (HTTP 429) or offline, realistic activity fixtures or a safe **Not enough data** fallback are used without breaking card rendering.

---

## Acceptance Criteria Verification

- [x] **Rules are documented and unit tested**: Thresholds ($\le 24$h, $24$–$72$h, $> 72$h, $< 3$ samples) are formally documented here and covered by comprehensive Jest tests in `__tests__/repoResponsiveness.test.ts`.
- [x] **Repositories with too little data show Not enough data instead of a guess**: Any repository with $< 3$ samples outputs `Not enough data`.
- [x] **No extra API calls for repeat requests inside the cache window**: Repeat queries within the cache window return cached metrics without issuing network calls.
