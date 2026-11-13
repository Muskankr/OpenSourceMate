# Post-Deployment Smoke Test

The **Smoke Test** workflow (`.github/workflows/smoke.yml`) checks that the deployed backend really works, so problems such as a wrong API URL, a crashed service or broken GitHub access (see [Issue #41](https://github.com/Muskankr/OpenSourceMate/issues/41)) are noticed early.

It runs `scripts/smoke_test.py`, which calls the backend in this order:

1. `GET /api/health` must return `200` and `"status": "healthy"`.
2. `GET /api/github/users/<username>` must return the profile fields the frontend uses (`username`, `avatar_url`, `profile_url` and the integer counts).
3. `GET /api/github/users/<username>/skills` must return a non-empty `skills` list and `total_repositories_analyzed` of at least 1.

If the health check fails the other two are skipped. Connection errors, timeouts and `5xx` answers are retried 3 times, 10 seconds apart, so a service that is still starting does not cause a false alarm.

## Setup

Add these under **Settings > Secrets and variables > Actions > Variables** (variables, not secrets, and nothing sensitive should go in them because the URL is printed in the log):

| Variable | Required | Example | Meaning |
|---|---|---|---|
| `SMOKE_API_URL` | yes | `https://api.example.com` | Base URL of the deployed backend, without a trailing slash and without `/api`. |
| `SMOKE_USERNAME` | no | `octocat` | Public GitHub user with at least one public repository. Defaults to `octocat`. |

Until `SMOKE_API_URL` is set, scheduled and deployment runs only print a warning and succeed.

## When it runs

- Every 6 hours (`schedule`).
- After a deployment that reports `success` for an environment whose name contains `production` (`deployment_status`). Vercel posts these events for GitHub-connected projects. If the backend host does not post them, the schedule is what catches problems.
- On demand from the Actions tab (**Run workflow**). The optional `api_url` input overrides `SMOKE_API_URL`, so you can try the check against another URL or see it fail on purpose with a wrong one. A manual run without any URL fails.

## When it fails

The job fails and GitHub shows the failing check in the run summary. For scheduled and deployment runs a second job also opens an issue called "Smoke test is failing" (or comments on the open one) with a link to the run. Close that issue once the backend is healthy again.

## Run it locally

```bash
SMOKE_API_URL=http://localhost:8000 python scripts/smoke_test.py
python scripts/smoke_test.py --api-url https://api.example.com --username torvalds
```

Exit code `0` means all checks passed, `1` that a check failed and `2` that the configuration is wrong. Only the Python standard library is needed. The script is covered by `backend/tests/test_smoke_script.py`.
