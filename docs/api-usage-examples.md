# API Usage Examples (Issue #257)

This page shows how to call every OpenSourceMate backend endpoint with **curl**, **Python** and **JavaScript**, together with a sample response for each one.

The sample responses were captured from a local backend. Long lists are shortened to one or two items (marked with `...`), and values such as stars, timestamps and issue lists will differ when you run the requests yourself.

A ready-to-use [Bruno](https://www.usebruno.com/) collection with every request lives in [`docs/api-collection/`](api-collection/). See [Request collection](#request-collection) below.

## Contents

- [Setup](#setup)
- [Health](#health): `GET /api/v1`, `GET /api/v1/health`, `GET /api/v1/health/diagnostics`
- [GitHub](#github): profile, repositories, top repositories, skills, external PRs
- [Issues](#issues): `GET /api/v1/issues/search`
- [Matching](#matching): `GET /api/v1/matching/users/{username}/issues`, `GET /api/v1/matching/users/{username}/feed.atom`, `POST /api/v1/matching/explain`
- [AI](#ai): `POST /api/v1/ai/analyze-issue`
- [Errors](#errors)
- [Request collection](#request-collection)

## Setup

Start the backend (see [Run the backend](../README.md#3-run-the-backend)):

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

All examples use these base values:

| Name | Local | Production |
|---|---|---|
| Base URL | `http://localhost:8000` | URL of the deployed backend |
| Username | `octocat` | any public GitHub user |

Setting `GITHUB_TOKEN` in `backend/.env` is optional, but without it GitHub only allows 60 requests per hour and 10 searches per minute, which the matching endpoint uses up quickly.

Every endpoint is also served under the legacy `/api/` prefix (for example `/api/health`). New code should use `/api/v1/`.

The Python examples use [`requests`](https://pypi.org/project/requests/) (`pip install requests`). The JavaScript examples use the built-in `fetch` and run in a browser or in Node.js 18+ as an ES module (`.mjs`, because of top-level `await`).

```python
import requests

BASE_URL = "http://localhost:8000"
```

```javascript
const BASE_URL = "http://localhost:8000";
```

---

## Health

### `GET /api/v1`: API directory

Lists the API versions, their resources and links to the documentation.

```bash
curl http://localhost:8000/api/v1
```

```python
response = requests.get(f"{BASE_URL}/api/v1")
print(response.json())
```

```javascript
const response = await fetch(`${BASE_URL}/api/v1`);
console.log(await response.json());
```

```json
{
  "service": "OpenSourceMate API",
  "current_version": "/api/v1",
  "available_versions": [
    {
      "prefix": "/api/v1",
      "status": "stable",
      "is_default": true,
      "resources": [
        "/api/v1/health",
        "/api/v1/health/diagnostics",
        "/api/v1/github/users/{username}",
        "..."
      ]
    },
    {
      "prefix": "/api",
      "status": "legacy-compatible",
      "is_default": false,
      "resources": ["/api/health", "..."]
    }
  ],
  "documentation": {
    "title": "OpenSourceMate API",
    "version": "1.0.0",
    "docs_url": "/docs",
    "redoc_url": "/redoc",
    "openapi_url": "/openapi.json",
    "tags": ["Health", "GitHub", "Matching", "Issues", "AI"]
  }
}
```

### `GET /api/v1/health`: health check

```bash
curl http://localhost:8000/api/v1/health
```

```python
response = requests.get(f"{BASE_URL}/api/v1/health")
print(response.json())
```

```javascript
const response = await fetch(`${BASE_URL}/api/v1/health`);
console.log(await response.json());
```

```json
{
  "status": "healthy",
  "service": "OpenSourceMate API",
  "version": "0.1.0"
}
```

### `GET /api/v1/health/diagnostics`: health diagnostics

Checks whether GitHub is reachable and returns the remaining GitHub rate limit and cache statistics. `status` is `"degraded"` when GitHub cannot be reached.

```bash
curl http://localhost:8000/api/v1/health/diagnostics
```

```python
response = requests.get(f"{BASE_URL}/api/v1/health/diagnostics")
print(response.json())
```

```javascript
const response = await fetch(`${BASE_URL}/api/v1/health/diagnostics`);
console.log(await response.json());
```

```json
{
  "status": "healthy",
  "service": "OpenSourceMate API",
  "version": "0.1.0",
  "github": {
    "reachable": true,
    "latency_ms": 861.11,
    "token_configured": false,
    "token_preview": null,
    "rate_limit": {
      "core": { "limit": 60, "remaining": 56, "reset_at": "2026-11-16T05:18:28+00:00" },
      "search": { "limit": 10, "remaining": 10, "reset_at": "2026-11-16T05:14:26+00:00" }
    }
  },
  "cache": {
    "active_entries": 0,
    "total_keys": 0,
    "max_entries": 1000
  }
}
```

---

## GitHub

All GitHub endpoints that accept `refresh=true` skip the cache and fetch fresh data from GitHub.

### `GET /api/v1/github/users/{username}`: user profile

| Query parameter | Type | Default | Description |
|---|---|---|---|
| `refresh` | bool | `false` | Bypass the cache |

```bash
curl http://localhost:8000/api/v1/github/users/octocat
```

```python
response = requests.get(f"{BASE_URL}/api/v1/github/users/octocat")
print(response.json())
```

```javascript
const response = await fetch(`${BASE_URL}/api/v1/github/users/octocat`);
console.log(await response.json());
```

```json
{
  "username": "octocat",
  "name": "The Octocat",
  "bio": null,
  "avatar_url": "https://avatars.githubusercontent.com/u/583231?v=4",
  "public_repositories": 8,
  "followers": 25144,
  "following": 9,
  "profile_url": "https://github.com/octocat",
  "location": "San Francisco",
  "company": "@github",
  "blog": "https://github.blog",
  "twitter_username": null,
  "created_at": "2011-01-25T18:44:36Z",
  "public_gists": 8,
  "fetched_at": "2026-11-16T05:13:27.337205+00:00"
}
```

### `GET /api/v1/github/users/{username}/repositories`: user repositories

| Query parameter | Type | Default | Description |
|---|---|---|---|
| `refresh` | bool | `false` | Bypass the cache |

```bash
curl http://localhost:8000/api/v1/github/users/octocat/repositories
```

```python
response = requests.get(f"{BASE_URL}/api/v1/github/users/octocat/repositories")
print(response.json())
```

```javascript
const response = await fetch(`${BASE_URL}/api/v1/github/users/octocat/repositories`);
console.log(await response.json());
```

```json
{
  "username": "octocat",
  "repository_count": 8,
  "total_pages_fetched": 1,
  "has_more": false,
  "fetched_at": "2026-11-16T05:13:27.788183+00:00",
  "repositories": [
    {
      "name": "Spoon-Knife",
      "description": "This repo is for demonstration purposes only.",
      "language": "HTML",
      "stars": 14214,
      "forks": 161342,
      "is_fork": false,
      "url": "https://github.com/octocat/Spoon-Knife",
      "updated_at": "2026-11-16T02:46:56Z"
    },
    "..."
  ]
}
```

### `GET /api/v1/github/users/{username}/top-repositories`: top repositories

Returns the 5 most-starred and the 5 most recently pushed repositories.

| Query parameter | Type | Default | Description |
|---|---|---|---|
| `exclude_forks` | bool | `true` | Leave out forked repositories |
| `refresh` | bool | `false` | Bypass the cache |

```bash
curl "http://localhost:8000/api/v1/github/users/octocat/top-repositories?exclude_forks=true"
```

```python
response = requests.get(
    f"{BASE_URL}/api/v1/github/users/octocat/top-repositories",
    params={"exclude_forks": True},
)
print(response.json())
```

```javascript
const params = new URLSearchParams({ exclude_forks: "true" });
const response = await fetch(
  `${BASE_URL}/api/v1/github/users/octocat/top-repositories?${params}`,
);
console.log(await response.json());
```

```json
{
  "username": "octocat",
  "exclude_forks": true,
  "top_by_stars": [
    {
      "name": "Spoon-Knife",
      "description": "This repo is for demonstration purposes only.",
      "language": "HTML",
      "stars": 14214,
      "forks": 161342,
      "is_fork": false,
      "url": "https://github.com/octocat/Spoon-Knife",
      "updated_at": "2024-08-21T15:25:42Z"
    },
    "..."
  ],
  "most_recent": [
    { "name": "Spoon-Knife", "...": "same fields as above" },
    "..."
  ]
}
```

### `GET /api/v1/github/users/{username}/skills`: skill analysis

Detects languages and technologies from the user's public repositories.

| Query parameter | Type | Default | Description |
|---|---|---|---|
| `include_forks` | bool | `false` | Count forked repositories |
| `ignore_noise` | bool | `true` | Drop config/markup languages that say little about skills |
| `group_related` | bool | `false` | Group related skills (adds a `groups` field) |
| `include_proficiency` | bool | `true` | Add an estimated proficiency to each skill |
| `refresh` | bool | `false` | Bypass the cache |

```bash
curl "http://localhost:8000/api/v1/github/users/octocat/skills?group_related=true"
```

```python
response = requests.get(
    f"{BASE_URL}/api/v1/github/users/octocat/skills",
    params={"group_related": True},
)
print(response.json())
```

```javascript
const params = new URLSearchParams({ group_related: "true" });
const response = await fetch(
  `${BASE_URL}/api/v1/github/users/octocat/skills?${params}`,
);
console.log(await response.json());
```

```json
{
  "username": "octocat",
  "skills": [
    {
      "name": "HTML",
      "repository_count": 2,
      "percentage": 40.0,
      "type": "language",
      "weight": 1.0,
      "group": "Web",
      "proficiency": "Strong",
      "proficiency_score": 8.9,
      "proficiency_reason": "Estimated as Strong in HTML: used in 2 repositories (40.0% code share), active recently (0 days ago). Estimated indicator based on public repository activity."
    },
    "..."
  ],
  "total_repositories_analyzed": 6,
  "groups": {
    "Web": ["CSS", "HTML"],
    "JavaScript / TypeScript": ["JavaScript"]
  },
  "analyzed_at": "2026-11-16T05:13:36.041197+00:00"
}
```

### `GET /api/v1/github/users/{username}/external-prs`: merged external PRs

Returns pull requests the user got merged into repositories they do not own.

| Query parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | int (1-100) | `10` | Maximum number of recent PRs |
| `refresh` | bool | `false` | Bypass the cache |

```bash
curl "http://localhost:8000/api/v1/github/users/octocat/external-prs?limit=3"
```

```python
response = requests.get(
    f"{BASE_URL}/api/v1/github/users/octocat/external-prs",
    params={"limit": 3},
)
print(response.json())
```

```javascript
const params = new URLSearchParams({ limit: "3" });
const response = await fetch(
  `${BASE_URL}/api/v1/github/users/octocat/external-prs?${params}`,
);
console.log(await response.json());
```

```json
{
  "username": "octocat",
  "total_merged_prs": 0,
  "repositories_count": 0,
  "top_repositories": [],
  "recent_prs": []
}
```

Returns `429` with an `X-RateLimit-Reset` header when the GitHub rate limit is reached.

---

## Issues

### `GET /api/v1/issues/search`: search issues

Searches open GitHub issues. The issue `body` is truncated.

| Query parameter | Type | Default | Description |
|---|---|---|---|
| `language` | string | none | Repository language, for example `python` |
| `label` | string | none | Issue label, for example `good first issue` |
| `keyword` | string | none | Free-text search term |
| `per_page` | int (1-100) | `20` | Number of results |

```bash
curl "http://localhost:8000/api/v1/issues/search?language=python&label=good%20first%20issue&keyword=documentation&per_page=2"
```

```python
response = requests.get(
    f"{BASE_URL}/api/v1/issues/search",
    params={
        "language": "python",
        "label": "good first issue",
        "keyword": "documentation",
        "per_page": 2,
    },
)
print(response.json())
```

```javascript
const params = new URLSearchParams({
  language: "python",
  label: "good first issue",
  keyword: "documentation",
  per_page: "2",
});
const response = await fetch(`${BASE_URL}/api/v1/issues/search?${params}`);
console.log(await response.json());
```

```json
{
  "total_count": 7399,
  "issues": [
    {
      "id": 6295446490,
      "title": "Public API documentation",
      "repository": "Krasnopjorovs/temet",
      "url": "https://github.com/Krasnopjorovs/temet/issues/60",
      "state": "open",
      "labels": ["documentation", "good first issue", "engine"],
      "comments": 0,
      "created_at": "2026-11-09T21:51:49Z",
      "updated_at": "2026-11-09T21:51:49Z",
      "user": "Krasnopjorovs",
      "body": "**What**\n- An OpenAPI page with examples for chart, forecast and compatibility...",
      "language": "python"
    },
    "..."
  ]
}
```

---

## Matching

### `GET /api/v1/matching/users/{username}/feed.atom`: Atom feed

Subscribe to ranked issue matches for a public GitHub username in an Atom feed reader. Each entry includes the issue title, repository, issue link, match score and GitHub update time. The endpoint uses the same matching path, GitHub response cache and rate limits as the JSON recommendations endpoint. Unknown usernames return HTTP 404.

```bash
curl -H 'Accept: application/atom+xml' \
  http://localhost:8000/api/v1/matching/users/octocat/feed.atom
```

The response has content type `application/atom+xml` and can be used directly as a feed subscription URL.

### `GET /api/v1/matching/users/{username}/issues`: recommended issues

Analyses the user's skills, searches good first issues for their top skills and returns up to 20 ranked recommendations. This endpoint makes several GitHub search requests, so set `GITHUB_TOKEN` and expect it to take a few seconds.

| Query parameter | Type | Default | Description |
|---|---|---|---|
| `exclude_stale` | bool | `false` | Leave out issues inactive for more than 60 days |

```bash
curl "http://localhost:8000/api/v1/matching/users/octocat/issues?exclude_stale=true"
```

```python
response = requests.get(
    f"{BASE_URL}/api/v1/matching/users/octocat/issues",
    params={"exclude_stale": True},
    timeout=120,
)
print(response.json())
```

```javascript
const params = new URLSearchParams({ exclude_stale: "true" });
const response = await fetch(
  `${BASE_URL}/api/v1/matching/users/octocat/issues?${params}`,
);
console.log(await response.json());
```

```json
{
  "username": "octocat",
  "skills": ["HTML", "CSS"],
  "recommendations": [
    {
      "id": 6406408418,
      "title": "Improve alt text on legacy study images",
      "repository": "trustjonathan/STUDY-HUB",
      "url": "https://github.com/trustjonathan/STUDY-HUB/issues/8",
      "state": "open",
      "labels": ["good first issue"],
      "comments": 0,
      "created_at": "2026-11-15T16:20:48Z",
      "updated_at": "2026-11-15T16:38:35Z",
      "user": "trustjonathan",
      "body": "## Background\nSome older study pages describe images with vague text...",
      "language": "CSS",
      "match_score": 100,
      "match_reasons": [
        "Your profile includes CSS.",
        "The issue mentions html.",
        "This issue is marked as a good first issue.",
        "This issue has been active recently.",
        "The issue has a manageable discussion size."
      ],
      "matched_skills": ["html"],
      "score_method": "keyword-tfidf",
      "freshness": {
        "status": "Active",
        "days_ago": 0,
        "label": "Updated today",
        "is_stale": false
      },
      "explanation": "This issue in trustjonathan/STUDY-HUB directly leverages your experience with CSS, and is curated as a beginner-friendly 'good first issue', and has no discussion yet, giving you a fresh opportunity to contribute.",
      "is_ai_generated": false,
      "why_it_matches": "This issue in trustjonathan/STUDY-HUB directly leverages your experience with CSS, ..."
    },
    "..."
  ]
}
```

`explanation` is written by the AI provider when one is configured (`is_ai_generated: true`); otherwise a rule-based explanation is returned.

### `POST /api/v1/matching/explain`: explain a recommendation

Generates (or regenerates) the explanation for one issue and a list of skills. Returns `400` when `issue` is missing or empty.

Request body:

```json
{
  "issue": {
    "title": "Add type hints to utils module",
    "body": "The utils module lacks type hints. Add them and run mypy.",
    "labels": ["good first issue", "python"],
    "repository": "example/repo",
    "language": "Python"
  },
  "user_skills": ["Python", "FastAPI"]
}
```

```bash
curl -X POST http://localhost:8000/api/v1/matching/explain \
  -H "Content-Type: application/json" \
  -d '{
    "issue": {
      "title": "Add type hints to utils module",
      "body": "The utils module lacks type hints. Add them and run mypy.",
      "labels": ["good first issue", "python"],
      "repository": "example/repo",
      "language": "Python"
    },
    "user_skills": ["Python", "FastAPI"]
  }'
```

```python
payload = {
    "issue": {
        "title": "Add type hints to utils module",
        "body": "The utils module lacks type hints. Add them and run mypy.",
        "labels": ["good first issue", "python"],
        "repository": "example/repo",
        "language": "Python",
    },
    "user_skills": ["Python", "FastAPI"],
}
response = requests.post(f"{BASE_URL}/api/v1/matching/explain", json=payload)
print(response.json())
```

```javascript
const payload = {
  issue: {
    title: "Add type hints to utils module",
    body: "The utils module lacks type hints. Add them and run mypy.",
    labels: ["good first issue", "python"],
    repository: "example/repo",
    language: "Python",
  },
  user_skills: ["Python", "FastAPI"],
};
const response = await fetch(`${BASE_URL}/api/v1/matching/explain`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
console.log(await response.json());
```

```json
{
  "explanation": "This issue in example/repo directly leverages your experience with Python, and is curated as a beginner-friendly 'good first issue', and has no discussion yet, giving you a fresh opportunity to contribute.",
  "is_ai_generated": false,
  "matched_skills": ["Python"],
  "difficulty_level": "beginner"
}
```

---

## AI

### `POST /api/v1/ai/analyze-issue`: issue analysis

Returns a deeper analysis of how well an issue fits a set of skills. Uses the configured AI provider (`AI_API_KEY` or `GEMINI_API_KEY` in `backend/.env`) and falls back to a rule-based analysis when none is set, which is what the sample below shows.

The request body has the same shape as [`POST /api/v1/matching/explain`](#post-apiv1matchingexplain-explain-a-recommendation): `issue` (object, required) and `user_skills` (list of strings).

```bash
curl -X POST http://localhost:8000/api/v1/ai/analyze-issue \
  -H "Content-Type: application/json" \
  -d '{
    "issue": {
      "title": "Add type hints to utils module",
      "body": "The utils module lacks type hints. Add them and run mypy.",
      "labels": ["good first issue", "python"],
      "repository": "example/repo",
      "language": "Python"
    },
    "user_skills": ["Python", "FastAPI"]
  }'
```

```python
response = requests.post(f"{BASE_URL}/api/v1/ai/analyze-issue", json=payload)
print(response.json())
```

```javascript
const response = await fetch(`${BASE_URL}/api/v1/ai/analyze-issue`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
console.log(await response.json());
```

(`payload` is the same object as in the `matching/explain` example.)

```json
{
  "difficulty": "beginner",
  "required_skills": ["Python"],
  "skill_matches": ["Python"],
  "why_it_matches": "This issue in example/repo directly leverages your experience with Python, and is curated as a beginner-friendly 'good first issue', and has no discussion yet, giving you a fresh opportunity to contribute.",
  "recommended_steps": [
    "Review the GitHub issue description and guidelines",
    "Set up the repository locally according to its README",
    "Work on the fix and submit a draft pull request"
  ],
  "potential_challenges": [
    "Verify repository contribution guidelines before opening a pull request"
  ]
}
```

Returns `500` with `"AI analysis failed: ..."` if the analysis raises an error.

---

## Errors

Errors use the unified error format described in the [README](../README.md#unified-error-format). For example, an invalid username:

```bash
curl http://localhost:8000/api/v1/github/users/no--such--user
```

```json
{
  "error": {
    "code": "INVALID_USERNAME",
    "message": "Invalid GitHub username 'no--such--user'. GitHub usernames must be 1-39 characters, contain only alphanumeric characters or single hyphens, and cannot start or end with a hyphen.",
    "details": { "username": "no--such--user" }
  },
  "detail": "Invalid GitHub username 'no--such--user'. GitHub usernames must be 1-39 characters, contain only alphanumeric characters or single hyphens, and cannot start or end with a hyphen."
}
```

Check the status code before reading the body:

```python
response = requests.get(f"{BASE_URL}/api/v1/github/users/octocat")
if not response.ok:
    print(response.status_code, response.json()["error"]["message"])
```

```javascript
const response = await fetch(`${BASE_URL}/api/v1/github/users/octocat`);
if (!response.ok) {
  const { error } = await response.json();
  console.error(response.status, error.message);
}
```

| Status | When |
|---|---|
| `400` | Invalid username, or missing `issue` in `POST /matching/explain` |
| `404` | GitHub user not found |
| `422` | Wrong query parameter or body type (FastAPI validation) |
| `429` | GitHub or API rate limit reached |
| `500` | Unexpected server or AI error |
| `502` | GitHub returned a server error |

---

## Request collection

[`docs/api-collection/`](api-collection/) is a [Bruno](https://www.usebruno.com/) collection with one request per endpoint above, grouped into the folders Health, GitHub, Issues, Matching and AI.

It has two environments:

| Environment | `baseUrl` | `username` |
|---|---|---|
| `local` | `http://localhost:8000` | `octocat` |
| `production` | deployed backend URL | `octocat` |

The production `baseUrl` is a placeholder (`https://your-backend.example.com`). Replace it with the deployed backend URL, without a trailing slash and without `/api` (the same value as `SMOKE_API_URL` in the [smoke test](smoke-test.md)).

### Use it in the Bruno app

1. Install Bruno from <https://www.usebruno.com/downloads>.
2. **Open Collection** and select the `docs/api-collection` folder.
3. Pick the `local` environment in the top-right corner.
4. Start the backend and send any request.

### Run it from the command line

```bash
cd docs/api-collection
npx @usebruno/cli run --env local
```

Every request includes a test that checks for a `200` status, so the run fails if any endpoint is broken.

### Use it in Postman

Postman can build a collection from the OpenAPI schema: **Import** → paste `http://localhost:8000/openapi.json` while the backend is running.
