# Shared Sanitized GitHub API Fixtures

This directory contains deterministic, privacy-sanitized JSON fixtures conforming to the GitHub REST API v3 contract (`application/vnd.github+json`). Both the Python backend test suite (`backend/tests/`) and the TypeScript frontend mock API and unit tests (`frontend/mocks/`, `frontend/__tests__/`) consume these files as a single shared source of truth.

## Directory Organization

```text
fixtures/
├── README.md                                 # Fixture catalog, provenance, sanitization rules & usage
├── users/
│   ├── user_standard.json                    # Real public profile with bio & full metadata (@tiangolo)
│   ├── user_no_bio.json                      # Real public profile with bio: null (@torvalds)
│   ├── user_many_repos.json                  # Real high-volume profile (public_repos: 301, @gaearon)
│   └── user_no_repos.json                    # Synthetic user profile with public_repos: 0
├── repositories/
│   ├── repos_standard.json                   # Real 8-repo list covering null language & forks (@octocat)
│   ├── repos_paginated_page1.json            # Real paginated page 1 (10 items, @torvalds)
│   ├── repos_paginated_page2.json            # Real paginated terminal page 2 (2 items, @torvalds)
│   ├── repos_large.json                      # Real 100-repo page 1 (@gaearon, per_page=100)
│   ├── repos_empty.json                      # Synthetic empty repository list ([])
│   └── repos_forks_only.json                 # Synthetic fork-only repository list (all fork: true)
├── languages/
│   ├── languages_multi.json                  # Real multi-language + noise bytes (Muskankr/OpenSourceMate)
│   ├── languages_single.json                 # Real single-language bytes (sindresorhus/is)
│   └── languages_empty.json                  # Real empty languages map (octocat/Hello-World)
├── events/
│   ├── events_active.json                    # Real 30 sanitized public events (@sindresorhus, >= 15 tier)
│   ├── events_occasional.json                # Derived 4-event subset from events_active.json (1-14 tier)
│   └── events_empty.json                     # Real empty public events list (@octocat, 0 events tier)
└── issues/
    ├── posted_issue_fetcher.json             # Baseline issue "Build the open-issue fetcher using the GitHub Search API" (#345)
    └── search_issues_mixed.json              # Mixed search items covering assignee, PR, claim comment, and stale signals (#345)
```

## Fixture Catalog & Provenance

### User Profiles (`fixtures/users/`)

| Fixture File           | Scenario                               | Origin Type          | Exact Provenance / Retrieval                       | Notes                                                                                  |
| :--------------------- | :------------------------------------- | :------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `user_standard.json`   | Standard active developer profile      | **Real (sanitized)** | `GET /users/tiangolo` (`2026-11-10`)               | Non-null `bio`, `company`, `blog`, `twitter_username`; raw `email` sanitized to `null` |
| `user_no_bio.json`     | User without bio (`bio: null`)         | **Real (sanitized)** | `GET /users/torvalds` (`2026-11-10`)               | Verifies null handling for `bio`, `blog`, `twitter_username`                           |
| `user_many_repos.json` | High-volume contributor (`>300` repos) | **Real (sanitized)** | `GET /users/gaearon` (`2026-11-10`)                | `public_repos: 301`; raw personal `email` sanitized to `null`                          |
| `user_no_repos.json`   | New user with `0` public repositories  | **Synthetic**        | Authored edge case (`login: "newbie-contributor"`) | Deterministic `public_repos: 0` fixture (live empty accounts change frequently)        |

### Repositories (`fixtures/repositories/`)

| Fixture File                 | Scenario                                 | Origin Type          | Exact Provenance / Retrieval                                               | Notes                                                                                    |
| :--------------------------- | :--------------------------------------- | :------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| `repos_standard.json`        | Mixed public repo collection (`8` items) | **Real (sanitized)** | `GET /users/octocat/repos?per_page=30&sort=updated` (`2026-11-10`)         | Includes `fork: true`, `fork: false`, `language: null`, `HTML`, `CSS`, `Ruby`            |
| `repos_paginated_page1.json` | Pagination page 1 (`10` items)           | **Real (sanitized)** | `GET /users/torvalds/repos?per_page=10&sort=updated&page=1` (`2026-11-10`) | Paired with RFC 5988 `Link: ... rel="next"` header in tests                              |
| `repos_paginated_page2.json` | Pagination terminal page 2 (`2` items)   | **Real (sanitized)** | `GET /users/torvalds/repos?per_page=10&sort=updated&page=2` (`2026-11-10`) | `< per_page` terminal condition + fork items                                             |
| `repos_large.json`           | Large collection (`100` items)           | **Real (sanitized)** | `GET /users/gaearon/repos?per_page=100&sort=updated&page=1` (`2026-11-10`) | Tests full default page (`per_page=100`), detail cap (`limit=5`), and multi-page 300 cap |
| `repos_empty.json`           | Empty repository collection (`[]`)       | **Synthetic**        | Deterministic edge case (`[]`)                                             | Matches GitHub response for `0` public repositories                                      |
| `repos_forks_only.json`      | Fork-only repositories (`2` items)       | **Synthetic**        | Deterministic edge case (`forks-only-dev/*`)                               | Every entry has `"fork": true` to verify `include_forks=False` filtering                 |

### Languages (`fixtures/languages/`)

| Fixture File            | Scenario                         | Origin Type | Exact Provenance / Retrieval                                  | Notes                                                  |
| :---------------------- | :------------------------------- | :---------- | :------------------------------------------------------------ | :----------------------------------------------------- |
| `languages_multi.json`  | Multi-language byte breakdown    | **Real**    | `GET /repos/Muskankr/OpenSourceMate/languages` (`2026-11-10`) | Includes `Makefile` for noise-language filtering tests |
| `languages_single.json` | Single-language byte breakdown   | **Real**    | `GET /repos/sindresorhus/is/languages` (`2026-11-10`)         | `{"TypeScript": 166122}`                               |
| `languages_empty.json`  | Empty languages breakdown (`{}`) | **Real**    | `GET /repos/octocat/Hello-World/languages` (`2026-11-10`)     | Tests fallback to repository metadata                  |

### Public Events (`fixtures/events/`)

| Fixture File             | Scenario                                               | Origin Type          | Exact Provenance / Retrieval                                              | Notes                                                                                                      |
| :----------------------- | :----------------------------------------------------- | :------------------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------- |
| `events_active.json`     | Active contributor (`>= 15` events tier, `30` items)   | **Real (sanitized)** | `GET /users/sindresorhus/events/public?per_page=30` (`2026-11-10`)        | Contains `PushEvent`, `PullRequestEvent`, `IssuesEvent`, `CreateEvent`, `DeleteEvent`, `IssueCommentEvent` |
| `events_occasional.json` | Occasional contributor (`1–14` events tier, `4` items) | **Derived subset**   | Deterministic slice of `events_active.json` (`2` Push, `1` PR, `1` Issue) | Keeps event distribution compact & deterministic                                                           |
| `events_empty.json`      | Inactive / zero public events (`0` items)              | **Real**             | `GET /users/octocat/events/public` (`2026-11-10`)                         | Evaluates to `"Inactive"` activity tier                                                                    |

### Issues (`fixtures/issues/`)

| Fixture File               | Scenario                                                                   | Origin Type   | Exact Provenance / Retrieval                                                       | Notes                                                                              |
| :------------------------- | :------------------------------------------------------------------------- | :------------ | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `posted_issue_fetcher.json`| Baseline unassigned issue "Build the open-issue fetcher using GitHub API" | **Synthetic** | Authored from MVP issue specification                                              | Deterministic active, unassigned issue (`is_flagged: false`, `#345`)              |
| `search_issues_mixed.json` | 6-issue search dataset with assignees, linked PRs, comments, and staleness | **Synthetic** | Derived from real GitHub search payload schema                                     | Tests `exclude_claimed` and `exclude_stale` filters and why-flagged reasons (#345) |

## Real vs. Synthetic Responses

- **Real (sanitized)** fixtures were captured directly from public GitHub REST API v3 endpoints on `2026-11-10` using `gh api` and transformed strictly by field allowlisting.
- **Derived** (`events_occasional.json`) is a deterministic, documented slice from `events_active.json` to isolate the `1–14` event occasional threshold cleanly.
- **Synthetic** fixtures (`user_no_repos.json`, `repos_empty.json`, `repos_forks_only.json`) are intentionally authored deterministic datasets where relying on mutable public accounts would cause flaky tests.

## Sanitization Rules

Every fixture is generated through an allowlist policy rather than ad-hoc editing:

1. **No emails or personal contact strings:** `"email"` is always forced to `null` on user profiles, and `payload.commits` (which may contain Git commit author emails) is stripped from all `PushEvent` objects.
2. **No tokens or credentials:** Authorization headers, cookies, PATs (`ghp_`, `gho_`, `github_pat_`), and bearer strings are never stored.
3. **Public-only visibility:** Repositories enforce `"private": false` and `"visibility": "public"`; events enforce `"public": true`.
4. **Minimal noise / internal metadata removed:** Stripped `node_id`, `gravatar_id`, `site_admin`, `permissions`, `user_view_type`, `org`, verbose pull-request/issue bodies, and ~35 redundant hypermedia `*_url` templates to keep fixtures small and fast.
5. **Automated enforcement:** `backend/tests/test_fixtures_sanitization.py` and `frontend/__tests__/githubFixtures.test.ts` assert zero email/token matches and required invariants on every test run.

## Consuming Fixtures in Tests & Mock API

### Backend (`pytest` and `unittest`)

`backend/tests/fixture_loader.py` provides `load_fixture(relative_path: str)` with path-traversal protection rooted at `fixtures/`. `backend/tests/conftest.py` also exposes a session-scoped `fixture_loader` pytest fixture:

```python
from tests.fixture_loader import load_fixture

def test_user_route():
    user = load_fixture("users/user_no_bio.json")
    assert user["bio"] is None

async def test_service(github_mock, fixture_loader):
    user = fixture_loader("users/user_standard.json")
    ...
```

### Frontend (TypeScript Mock API & Jest)

`frontend/tsconfig.json` enables `"resolveJsonModule": true`, allowing direct ES JSON imports:

- `frontend/mocks/fixtures/users.ts`, `repositories.ts`, and `skills.ts` adapt the root `fixtures/*.json` files directly into `GitHubUserProfile`, `RepositoryItem`, and `UserSkillsResponse` without duplicating raw API payloads.
- `frontend/__tests__/githubFixtures.test.ts` imports the mock handlers and `fixtures/events/*.json` directly to verify mock API scenarios (`tiangolo`, `torvalds`, `gaearon`, `newbie-contributor`, `forks-only-dev`) and `processPublicEvents` activity tiers.

## Adding New Fixtures Safely

1. Fetch public endpoints only (`gh api ...`) or explicitly mark synthetic datasets in this README as **Synthetic**.
2. Strip unnecessary hypermedia fields (`node_id`, `*_url`, `commits`, issue bodies) and explicitly set `"email": null` / remove any PII or tokens.
3. Keep files deterministic and compact (well below pre-commit's `1000 KB` limit).
4. Format JSON with Prettier (`npx prettier --write ../fixtures/**/*.json` from `frontend/`).
5. Verify sanitization and contract tests pass:
   - `cd backend && python -m pytest tests/test_fixtures_sanitization.py`
   - `cd frontend && npx jest __tests__/githubFixtures.test.ts`
