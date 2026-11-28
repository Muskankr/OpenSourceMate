# Repository Friendliness Score & Signal Documentation

## Overview

A beginner-friendly issue in an unwelcoming or unresponsive repository is a poor recommendation for newcomers and students. When first-time contributors encounter repositories lacking basic onboarding documentation, community guidelines, or active maintainers, they often get stuck or discouraged.

To solve this, OpenSourceMate computes a deterministic **Repository Friendliness Score** (0–100) and displays an accessible badge with a detailed breakdown popover on every recommended issue card.

---

## Deterministic Scoring Formula (100-Point Scale)

The score is calculated from five key community health signals:

| Signal | Evaluation Metric | Maximum Points | Thresholds & Allocation |
| :--- | :--- | :--- | :--- |
| **CONTRIBUTING Guide** | Presence of `CONTRIBUTING.md` / guidelines | **25 pts** | **25 pts** if present; **0 pts** if missing. |
| **Code of Conduct** | Presence of `CODE_OF_CONDUCT.md` | **20 pts** | **20 pts** if present; **0 pts** if missing. |
| **Issue & PR Templates** | Structured issue / pull request templates | **15 pts** | **15 pts** if configured; **0 pts** if missing. |
| **README Documentation** | Character length of project README | **20 pts** | $\ge 2500$ chars: **20 pts** (Comprehensive)<br>$800$–$2499$ chars: **12 pts** (Standard)<br>$1$–$799$ chars: **6 pts** (Brief)<br>$0$ or missing: **0 pts**. |
| **Recent Merged PRs** | Merged pull requests in the last 90 days | **20 pts** | $\ge 5$ merged PRs: **20 pts** (High maintainer activity)<br>$1$–$4$ merged PRs: **12 pts** (Moderate activity)<br>$0$ merged: **0 pts**. |

### Missing Signals & Determinism Guarantees

1. **Strict Determinism**:
   - Given the same input metrics, `calculateFriendlinessScore()` always produces the exact same score, tier, and signal breakdown.
2. **Missing Signals Resilience**:
   - Any missing, null, undefined, or negative metric is handled gracefully without runtime errors or exceptions, safely defaulting to 0 points for that signal.

---

## Friendliness Tiers

Repositories are classified into four distinct friendliness tiers:

| Tier | Score Range | Description | Badge Visual |
| :--- | :--- | :--- | :--- |
| **Very Welcoming** | $80$–$100$ pts | Highly welcoming repository with comprehensive onboarding guides and active maintainer engagement. | Emerald / Green |
| **Welcoming** | $60$–$79$ pts | Welcoming repository with solid contribution guidelines and regular review activity. | Blue |
| **Moderate** | $40$–$59$ pts | Moderately welcoming repository with some documentation; may require asking maintainers questions before starting. | Amber / Orange |
| **Challenging** | $0$–$39$ pts | Lacks key onboarding signals. First-time contributors may experience friction or delays. | Slate / Gray |

---

## Interactive Breakdown Popover

Each issue card displays a `FriendlinessBadge` next to the repository title. Clicking or hovering over the badge reveals an interactive tooltip popover (`role="tooltip"`, `data-testid="friendliness-breakdown"`):

- **Header**: Total score out of 100 (e.g., `88 / 100`).
- **Signal Breakdown**: Checklist of all five signals with:
  - Status indicator (✅ passed / ❌ missing)
  - Signal label (e.g. `CONTRIBUTING Guide`, `README Documentation`)
  - Detected value description (e.g. `4,800 chars (Comprehensive)`, `24 merged PRs`)
  - Point contribution (e.g. `+20/20`)
- **Summary**: Actionable guidance for contributors based on the repository's tier.

---

## Rate-Limit Protection & Caching Architecture

To respect GitHub API rate limits (Issue #14) and prevent redundant network requests across multiple issues from the same repository:

1. **In-Memory & Persistent Cache Window**:
   - Evaluation results are cached for **1 hour** (`DEFAULT_FRIENDLINESS_CACHE_TTL_MS = 3,600,000 ms`).
   - Cached scores are synchronized across the in-memory cache and browser `localStorage`.
2. **In-Flight Request Deduplication**:
   - Multiple issue cards from the same repository mounting simultaneously coalesce into a single in-flight Promise.
3. **Offline & Known Repository Fallbacks**:
   - Curated repositories (such as `vercel/next.js`, `facebook/react`, `tiangolo/fastapi`, `rails/rails`) have pre-computed community signals for instant rendering without API latency.

---

## Acceptance Criteria Verification

- [x] **The same repository always gets the same score**: Fully deterministic calculation with verified test cases in `__tests__/repoFriendliness.test.ts`.
- [x] **Missing signals are handled without errors**: Unset, null, undefined, and clamped negative inputs evaluate safely without throwing exceptions.
- [x] **Unit tests cover the scoring function**: Complete unit test coverage for scoring brackets, boundary values, tier assignments, badge popover rendering, and caching behavior.
