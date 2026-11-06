# Skill Growth Timeline & Language Evolution (Issue #195)

## Overview

Issue **#195** adds a year-over-year **Skill Growth Timeline** illustrating when a developer adopted different languages across their public repositories.

---

## 1. Aggregation Rules (`frontend/utils/skillTimeline.ts`)

- **Creation Date Parsing**:
  Inspects the `created_at` timestamp of each public repository, extracting the UTC year.
- **Fork Exclusion**:
  Excludes forked repositories (`is_fork: true`) to ensure timeline reflects personal creation milestones.
- **Language Bucketing**:
  Maps repositories to their detected primary language per calendar year.
- **Minor Language Filtering**:
  Allows users to toggle "Hide minor (<2 repos)" so high-frequency languages take center stage without visual clutter.

---

## 2. Accessible UI Component (`components/SkillTimelineChart.tsx`)

- **Dual Rendering Modes**:
  1. **Stacked Bar Chart**: Visual horizontal bars where each segment represents a language proportionally.
  2. **Accessible Table Alternative**: Screen-reader-friendly data table mapping year rows to language counts with row totals.
- **Color Legend**: High-contrast, theme-aware palette legend mapping languages to distinct color dots.
- **Edge Cases**:
  - Handles accounts with 0 repositories cleanly.
  - Handles single-year or brand-new GitHub accounts without layout skew.

---

## 3. Testing & Verification

Unit tests in `frontend/__tests__/skillTimeline.test.ts`:
- Verifies chronological year sorting.
- Tests minor language grouping into "Other".
- Tests toggle between visual chart and accessible table.
