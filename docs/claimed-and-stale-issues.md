# Claimed and Stale Issue Detection

OpenSourceMate detects claimed and stale GitHub issues to prevent recommending issues that are already taken or inactive, ensuring contributors focus on viable contribution opportunities.

---

## 1. Detection Signals

Issues are evaluated across four primary signals:

### A. Assigned Contributor (`detect_assignee`)

- **Signal**: Evaluates `assignee` and `assignees` from the GitHub API payload.
- **Trigger**: Any assigned GitHub user login (`item.assignee` or `item.assignees`).
- **Classification**: `is_claimed = True`, `is_flagged = True`.
- **Why Flagged Reason**: `Assigned to @<username>` (e.g., `Assigned to @octocat`).

### B. Linked or Open Pull Request (`detect_linked_pr`)

- **Signal**:
  1. `item.pull_request` key present in GitHub Search API response.
  2. Explicit `pull_requests` / `linked_pull_requests` list.
  3. Regular expression extraction in issue description:
     - Full PR URL: `https://github.com/<owner>/<repo>/pull/<id>`
     - PR references: `PR #123`, `pull request #123`, `fixes #123`, `closes #123`.
- **Classification**: `is_claimed = True`, `is_flagged = True`.
- **Why Flagged Reason**: `Linked pull request detected (#<id>)` or `Linked or open pull request detected`.

### C. Recent Claim Comment (`detect_claim_comment`)

- **Signal**: Natural language intent in recent comments or issue description indicating that a contributor has asked or committed to work on the issue.
- **Matched Phrases**:
  - _"I'd like to work on this"_ / _"I would like to work on this"_
  - _"Can I work on this"_ / _"May I work on this"_ / _"Could I work on this"_
  - _"Please assign me"_ / _"Assign this to me"_ / _"Can you assign this to me"_
  - _"I'm working on this"_ / _"I am working on this"_ / _"Working on this"_
  - _"I will work on this"_ / _"Taking this up"_ / _"I'll take this up"_
  - _"Interested in working on this"_
  - `"/claim"` / _"claim this issue"_
- **Recency Window**: Evaluates comment timestamps against `recent_claim_days` (default: 30 days). If older than the window, the comment is considered abandoned.
- **Classification**: `is_claimed = True`, `is_flagged = True`.
- **Why Flagged Reason**: `Recent claim comment: "<phrase>" by @<author> (<days>d ago)`.

### D. Inactive / Stale Duration (`detect_stale`)

- **Signal**: Measures elapsed days since `updated_at` (or `created_at`).
- **Trigger**: Inactivity exceeding `stale_days` threshold (default: 60 days).
- **Classification**: `is_stale = True`, `is_flagged = True`.
- **Why Flagged Reason**: `No activity for <days> days (stale threshold: <threshold> days)`.

---

## 2. Configurable Filters & API Endpoints

### `/api/issues/search` & `/api/v1/issues/search`

```http
GET /api/issues/search?language=python&exclude_claimed=true&exclude_stale=true&stale_days=60
```

| Parameter         | Type    | Default | Description                                                                   |
| ----------------- | ------- | ------- | ----------------------------------------------------------------------------- |
| `language`        | string  | `None`  | Filter by language                                                            |
| `label`           | string  | `None`  | Filter by label (e.g. `good first issue`)                                     |
| `keyword`         | string  | `None`  | Free-text search keyword                                                      |
| `exclude_claimed` | boolean | `false` | When `true`, filters out issues with assignees, linked PRs, or claim comments |
| `exclude_stale`   | boolean | `false` | When `true`, filters out issues inactive beyond `stale_days`                  |
| `stale_days`      | integer | `60`    | Number of inactive days before flagging an issue as stale                     |

### `/api/matching/users/{username}/issues`

```http
GET /api/matching/users/{username}/issues?exclude_claimed=true&exclude_stale=true
```

Supports `exclude_claimed=true` and `exclude_stale=true` to ensure recommended opportunities are active and unassigned.

---

## 3. Data Structure

Each issue object includes:

```json
{
  "id": 1042,
  "title": "Build the open-issue fetcher using the GitHub Search API",
  "repository": "Muskankr/OpenSourceMate",
  "url": "https://github.com/Muskankr/OpenSourceMate/issues/42",
  "is_claimed": true,
  "is_stale": false,
  "is_flagged": true,
  "why_flagged": [
    "Assigned to @octocat",
    "Recent claim comment: \"I'd like to work on this\" by @octocat (2d ago)"
  ],
  "claim_details": {
    "has_assignee": true,
    "assignees": ["octocat"],
    "has_linked_pr": false,
    "linked_prs": [],
    "has_claim_comment": true,
    "claim_comment_snippets": ["I'd like to work on this"],
    "is_stale": false,
    "days_inactive": 2,
    "stale_threshold_days": 60,
    "recent_claim_threshold_days": 30
  }
}
```

---

## 4. Test Fixtures & Verification

Deterministic fixtures verify all rules:

- `fixtures/issues/posted_issue_fetcher.json`: Baseline unassigned instance of _"Build the open-issue fetcher using the GitHub Search API"_.
- `fixtures/issues/search_issues_mixed.json`: Comprehensive suite with unassigned, assigned, linked PR, claim comment, and stale issue variations.
- Backend test suite: `backend/tests/test_issue_flags.py` (10 test cases covering unit logic, fixtures, and API client queries).
- Frontend test suite: `frontend/__tests__/IssueCard.test.tsx` and `frontend/__tests__/RecommendedIssuesList.test.tsx`.
