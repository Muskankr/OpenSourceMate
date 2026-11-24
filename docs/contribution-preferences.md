# Contribution Preferences Guide (#421)

## Overview

Issue **#421** addresses the reality that developers with identical skills have diverse contribution goals and real-world constraints:
- One developer avoids massive monolithic organizations.
- Another only wants issues written in Python.
- Another has only a weekend free and needs a scoped contribution opportunity.

This feature adds a customizable **Matching Preferences Panel** that persists user preferences in the browser, sends them as request parameters to the matching engine, filters results with strict exclusion and criteria matching, and displays active preferences above the results with a 1-click **Reset** action.

---

## 1. Parameters & API Schema

The matching endpoint `/api/matching/users/{username}/issues` (and `/api/v1/matching/users/{username}/issues`) accepts the following optional query parameters:

| Parameter | Type | Allowed Values / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `preferred_languages` | `list[str]` | 1–50 alphanumeric chars or symbols (`+`, `#`, `.`, `-`, space) | Narrows issue matching to specified languages. |
| `excluded_orgs` | `list[str]` | Valid GitHub org or repo slug (`owner` or `owner/repo`) | Strict exclusions: matching repositories or organizations **never** appear in results. |
| `max_age_days` | `int` | Integer between `1` and `3650` | Excludes issues created more than `max_age_days` ago. |
| `expected_time` | `string` | `quick`, `weekend`, `ongoing` | Filters issues by estimated scope and discussion complexity. |

### Validation & Error Handling
Invalid values return a standardized **400 Bad Request** error with detailed diagnostic messages, for example:
- `Invalid preferred language: '<script>'. Must be 1-50 alphanumeric characters or standard symbols (+, #, ., -, space).`
- `Invalid excluded organization or repository: 'invalid slug'. Must be in 'owner' or 'owner/repo' format.`
- `Invalid max_age_days: -5. Must be between 1 and 3650 days.`
- `Invalid expected_time: 'fulltime'. Allowed values are: ongoing, quick, weekend.`

---

## 2. Expected Time Commitment Mapping

The `expected_time` parameter filters candidate issues using discussion count, issue description length, and community difficulty labels:

- **`quick` (< 2 hours)**: Small-scope fixes, typos, or beginner-friendly starter tasks (`comments <= 2` and `body <= 600 chars`, or `good first issue` / `beginner` labels).
- **`weekend` (A weekend)**: Moderate scope (`comments <= 6` and `body <= 1000 chars`).
- **`ongoing` (Ongoing)**: Substantial features, epic initiatives, or deeper architectural discussions (`comments >= 3` or `body >= 500 chars`, or `epic` / `feature` labels).

---

## 3. Frontend Components & Browser Storage

- **Storage (`localStorage`)**:
  - Saved under key `osm_matching_preferences_v1`.
  - Preferences stay on the client side and are sent only as request parameters when analyzing recommendations.
- **`ContributionPreferencesPanel.tsx`**:
  - Collapsible panel allowing users to toggle preferred languages, add excluded organizations/repos, choose maximum issue age, and select expected time commitment.
  - Supports 1-click quick reset directly from the panel header or footer.
- **`ActivePreferencesBar.tsx`**:
  - Prominently displays all active preference chips above the recommendation results with an immediate 1-click **Reset preferences** action.

---

## 4. Verification & Testing

- **Backend**: `backend/tests/test_preferences_matching.py` validates all parameter sanitizers, exclusion enforcement, filter combinations, and HTTP 400 error responses.
- **Frontend**: `frontend/__tests__/ContributionPreferences.test.tsx` validates storage utilities, component interactions, input handling, active badges, and 1-click reset behavior.
