# Issue Recommendation Filtering

## Overview

Recommending open-source issues that are already taken or belong to abandoned repositories wastes contributors' valuable time. Building on the issue fetcher introduced in [#25](https://github.com/Muskankr/OpenSourceMate/issues/25), OpenSourceMate automatically filters out:

1. **Assigned Issues:** Issues that already have one or more developers assigned (`assignee != null` or `len(assignees) > 0`).
2. **Archived Repositories:** Issues belonging to repositories that have been archived by their maintainers (`archived: true`).
3. **Inactive / Abandoned Repositories:** Issues belonging to repositories with no code pushes or commits within a configurable threshold of days (`max_repo_inactive_days`).

These rules ensure that contributors are only presented with actionable, welcoming, and actively maintained issues.

---

## Filtering Rules

### 1. Assignee Filtering (`skip_assigned`)

- Uses the native GitHub Search qualifier `no:assignee` to filter at the search engine level and conserve rate limits.
- Validates the parsed GitHub issue payload: if `issue["assignee"]` is set or `issue["assignees"]` contains one or more assignees, the issue is discarded.

### 2. Archived Repository Filtering (`skip_archived`)

- Uses the native GitHub Search qualifier `archived:false` to request only non-archived repositories.
- Verifies repository metadata: checks the repository's `archived` attribute via cached repository info lookup (`GET /repos/{owner}/{repo}`) or embedded issue metadata.

### 3. Inactive Repository Filtering (`max_repo_inactive_days`)

- Repositories with no recent development activity are considered inactive or abandoned.
- Activity timestamp is evaluated as the most recent of:
  - `pushed_at`: Time of the most recent git push or commit to any repository branch.
  - `updated_at`: Time of the most recent repository update.
- If `(now - last_activity).days > max_repo_inactive_days`, the repository is classified as inactive and its issues are omitted from recommendations.
- Set `max_repo_inactive_days` to `0` to disable inactivity filtering.

---

## Configuration & Thresholds

Thresholds can be changed **without any code modifications** through environment variables or a JSON configuration file.

### Environment Variables

Configure these settings in `backend/.env` or container runtime environment:

| Variable                              | Type    | Default                   | Description                                              |
| ------------------------------------- | ------- | ------------------------- | -------------------------------------------------------- |
| `ISSUE_FILTER_SKIP_ASSIGNED`          | Boolean | `true`                    | Skip issues that already have an assigned developer      |
| `ISSUE_FILTER_SKIP_ARCHIVED`          | Boolean | `true`                    | Skip issues in archived repositories                     |
| `ISSUE_FILTER_MAX_REPO_INACTIVE_DAYS` | Integer | `90`                      | Max days of repository inactivity allowed (0 to disable) |
| `ISSUE_FILTER_CONFIG_PATH`            | String  | `data/issue_filters.json` | Path to JSON config file overriding thresholds           |

### JSON Configuration File

You can also customize thresholds by modifying `data/issue_filters.json`:

```json
{
  "skip_assigned": true,
  "skip_archived": true,
  "max_repo_inactive_days": 90
}
```

A JSON schema is provided in `data/issue_filters.schema.json` for validation in IDEs and CI.

---

## Caching & Rate Limits

To stay well within GitHub API rate limits (60 req/hr unauthenticated, 5,000 req/hr with `GITHUB_TOKEN`), repository metadata is cached in-memory with a configurable TTL (`GITHUB_CACHE_TTL`, default 300 seconds).

When an issue search returns multiple issues from the same repository, only a single cached `/repos/{owner}/{repo}` call is made.

---

## Testing

Comprehensive unit tests with mocked GitHub API responses are implemented in `backend/tests/test_issue_service.py`:

- `test_skip_assigned_issues`: Verifies issues with assignees are omitted.
- `test_skip_archived_repositories`: Verifies issues from archived repos are omitted.
- `test_skip_inactive_repositories`: Verifies issues from repos past the inactivity threshold are omitted.
- `test_repo_metadata_caching`: Verifies repository metadata lookups are cached.
- `test_configurable_via_json_config`: Verifies config file adjustments without code changes.
- `test_configurable_via_environment_variables`: Verifies env variable overrides.
- `test_filtered_issues_never_returned_to_frontend`: Verifies end-to-end API response guarantees.
