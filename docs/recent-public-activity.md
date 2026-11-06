# Recent Public Activity Summary & 90-Day Trend (Issue #193)

## Overview

Issue **#193** provides insight into developer momentum by analyzing public GitHub events over the last 90 days. It categorizes activity into clear tiers (`Inactive`, `Occasional`, or `Active`) and renders an accessible 12-week distribution bar chart.

Importantly, this metric focuses on **recency and ongoing cadence**, complementing rather than duplicating the static repository language proficiency badges in PR #54.

---

## 1. Activity Level Calculation Rules

Documented in `frontend/utils/activitySummary.ts`:

| Activity Level | Criteria (Last 90 Days) | Interpretation |
| :--- | :--- | :--- |
| **Active** | 15 or more public events (commits, PRs, or issues) | Regular weekly engagement in public open-source projects. |
| **Occasional** | 1 to 14 public events | Sporadic contributions, sprint participation, or intermittent activity. |
| **Inactive** | 0 public events in the last 90 days | No public events recorded (may indicate private repo work or hiatus). |

---

## 2. Event Aggregation & 12-Week Distribution

Public events (from `GET https://api.github.com/users/{username}/events/public`) are grouped into 12 chronological week buckets:
- Calculates separate counts for:
  - `PushEvent` (Commits pushed)
  - `PullRequestEvent` (PRs opened, reviewed, or merged)
  - `IssuesEvent` (Issues created or commented on)
- Each weekly bucket displays relative bar heights with hover tooltips detailing dates and breakdown counts.

---

## 3. UI Component (`components/ActivitySummaryCard.tsx`)

- Displays color-coded level badges (`emerald` for Active, `amber` for Occasional, `gray` for Inactive).
- Includes total push, PR, and issue counts.
- Zero-event state includes friendly explanatory copy:
  *"No public events recorded in the last 90 days. User may be working in private repositories or taking a break."*
- Full accessibility support: `role="region"`, descriptive aria-labels on weekly bars, and screen-reader status text.

---

## 4. Testing & Verification

Unit tests in `frontend/__tests__/activitySummary.test.ts`:
- Verifies classification thresholds (`Active`, `Occasional`, `Inactive`).
- Tests weekly bucketing with synthetic 90-day timestamps.
- Tests zero-event safety without runtime exceptions.
