#!/usr/bin/env python3
"""Smoke test for a deployed OpenSourceMate backend.

Checks, in order:
  1. GET /api/health returns 200 and {"status": "healthy", ...}
  2. GET /api/github/users/<username> returns the profile shape the frontend reads
  3. GET /api/github/users/<username>/skills returns a non-empty skill analysis

The API base URL and the username come from the SMOKE_API_URL and SMOKE_USERNAME
environment variables (or --api-url / --username). Only the standard library is
used, so it runs anywhere with Python 3.10+.

    SMOKE_API_URL=https://api.example.com python scripts/smoke_test.py

Exit codes: 0 all checks passed, 1 a check failed, 2 bad or missing configuration.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_USERNAME = "octocat"
USERNAME_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$")
USER_AGENT = "opensourcemate-smoke-test"


class SmokeFailure(Exception):
    """A check failed. The message says what was expected and what came back."""


def fetch_json(url: str, timeout: float, retries: int, wait: float):
    """GET url and return (status, parsed JSON).

    Connection errors, timeouts and 5xx answers are retried, because a freshly
    deployed or sleeping service often needs a moment. Other statuses are
    returned right away so the caller can judge them.
    """
    last_problem = ""
    for attempt in range(1, retries + 1):
        request = urllib.request.Request(
            url, headers={"Accept": "application/json", "User-Agent": USER_AGENT}
        )
        status = None
        body = b""
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                status = response.status
                body = response.read()
        except urllib.error.HTTPError as exc:
            status = exc.code
            body = exc.read()
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            reason = getattr(exc, "reason", exc)
            last_problem = f"could not connect ({reason})"

        if status is not None and status < 500:
            try:
                return status, json.loads(body.decode("utf-8")) if body else None
            except (UnicodeDecodeError, ValueError):
                raise SmokeFailure(
                    f"GET {url} returned HTTP {status} but the body is not JSON "
                    f"(starts with {body[:80]!r})"
                )
        if status is not None:
            last_problem = f"HTTP {status}"

        if attempt < retries:
            print(f"  attempt {attempt}/{retries} failed: {last_problem}, retrying")
            time.sleep(wait)

    raise SmokeFailure(f"GET {url} failed after {retries} attempts: {last_problem}")


def expect_status(url: str, status: int, body, expected: int = 200) -> None:
    if status == expected:
        return
    detail = ""
    if isinstance(body, dict):
        detail = body.get("detail") or ""
        if isinstance(detail, dict) or not isinstance(detail, str):
            detail = json.dumps(detail)[:200]
    if status == 429:
        detail = f"rate limited ({detail or 'GitHub or API rate limit'})"
    raise SmokeFailure(
        f"GET {url} returned HTTP {status}, expected {expected}. {detail}".strip()
    )


def check_health(base: str, **opts) -> str:
    url = f"{base}/api/health"
    status, body = fetch_json(url, **opts)
    expect_status(url, status, body)
    if not isinstance(body, dict) or body.get("status") != "healthy":
        raise SmokeFailure(f'GET {url}: expected "status": "healthy", got {body!r}')
    if not isinstance(body.get("service"), str) or not body["service"]:
        raise SmokeFailure(f'GET {url}: response has no "service" name: {body!r}')
    return f"{body['service']} {body.get('version', '')}".strip()


def check_profile(base: str, username: str, **opts) -> str:
    url = f"{base}/api/github/users/{urllib.parse.quote(username)}"
    status, body = fetch_json(url, **opts)
    expect_status(url, status, body)
    if not isinstance(body, dict):
        raise SmokeFailure(
            f"GET {url}: expected a JSON object, got {type(body).__name__}"
        )

    problems = []
    if str(body.get("username", "")).lower() != username.lower():
        problems.append(
            f'"username" is {body.get("username")!r}, expected {username!r}'
        )
    for key in ("avatar_url", "profile_url"):
        if not isinstance(body.get(key), str) or not body[key].startswith("http"):
            problems.append(f'"{key}" is missing or not a URL ({body.get(key)!r})')
    for key in ("public_repositories", "followers", "following"):
        value = body.get(key)
        if not isinstance(value, int) or isinstance(value, bool) or value < 0:
            problems.append(f'"{key}" is not a non-negative integer ({value!r})')
    if problems:
        raise SmokeFailure(
            f"GET {url}: unexpected profile shape: " + "; ".join(problems)
        )
    return f"{body['username']}: {body['public_repositories']} public repos"


def check_skills(base: str, username: str, **opts) -> str:
    url = f"{base}/api/github/users/{urllib.parse.quote(username)}/skills"
    status, body = fetch_json(url, **opts)
    expect_status(url, status, body)
    if not isinstance(body, dict):
        raise SmokeFailure(
            f"GET {url}: expected a JSON object, got {type(body).__name__}"
        )

    problems = []
    skills = body.get("skills")
    if not isinstance(skills, list) or not skills:
        problems.append('"skills" is missing or empty')
    else:
        bad = [s for s in skills if not (isinstance(s, dict) and s.get("name"))]
        if bad:
            problems.append(f'{len(bad)} entries in "skills" have no "name"')
    total = body.get("total_repositories_analyzed")
    if not isinstance(total, int) or isinstance(total, bool) or total < 1:
        problems.append(
            f'"total_repositories_analyzed" is not a positive integer ({total!r})'
        )
    if problems:
        raise SmokeFailure(
            f"GET {url}: unexpected skills shape: " + "; ".join(problems)
        )
    return f"{len(skills)} skills from {total} repositories"


def normalize_base_url(raw: str) -> str:
    parsed = urllib.parse.urlparse(raw.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError(
            f"API URL must start with http:// or https:// and include a host, got {raw!r}"
        )
    return raw.strip().rstrip("/")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument(
        "--api-url",
        default=os.environ.get("SMOKE_API_URL", ""),
        help="backend base URL, default $SMOKE_API_URL",
    )
    parser.add_argument(
        "--username",
        default=os.environ.get("SMOKE_USERNAME", ""),
        help=f"public GitHub username to analyze, default $SMOKE_USERNAME or {DEFAULT_USERNAME}",
    )
    parser.add_argument(
        "--timeout", type=float, default=30.0, help="seconds per request"
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=3,
        help="attempts per request on connection errors and 5xx",
    )
    parser.add_argument(
        "--retry-wait", type=float, default=10.0, help="seconds between attempts"
    )
    parser.add_argument(
        "--skip-if-unconfigured",
        action="store_true",
        help="exit 0 with a warning when no API URL is set (scheduled runs on repos without the variable)",
    )
    args = parser.parse_args(argv)

    on_actions = os.environ.get("GITHUB_ACTIONS") == "true"

    def report_error(message: str) -> None:
        print(
            f"::error title=Smoke test failed::{message}"
            if on_actions
            else f"ERROR: {message}"
        )

    if not args.api_url.strip():
        if args.skip_if_unconfigured:
            msg = "SMOKE_API_URL is not set, nothing to test. Set it as a repository variable to enable the smoke test."
            print(
                f"::warning title=Smoke test skipped::{msg}"
                if on_actions
                else f"WARNING: {msg}"
            )
            return 0
        report_error("no API URL given. Set SMOKE_API_URL or pass --api-url.")
        return 2
    try:
        base = normalize_base_url(args.api_url)
    except ValueError as exc:
        report_error(str(exc))
        return 2

    username = (args.username or DEFAULT_USERNAME).strip()
    if not USERNAME_RE.match(username):
        report_error(f"{username!r} is not a valid GitHub username.")
        return 2
    if args.retries < 1:
        report_error("--retries must be at least 1.")
        return 2

    opts = {"timeout": args.timeout, "retries": args.retries, "wait": args.retry_wait}
    print(f"Smoke testing {base} with username {username}")

    checks = [
        ("health", lambda: check_health(base, **opts)),
        ("profile", lambda: check_profile(base, username, **opts)),
        ("skills", lambda: check_skills(base, username, **opts)),
    ]
    failures = []
    for name, run in checks:
        try:
            print(f"ok    {name}: {run()}")
        except SmokeFailure as exc:
            failures.append(f"{name}: {exc}")
            print(f"FAIL  {name}: {exc}")
            if name == "health":
                # The other checks hit the same server, so skip them.
                break

    if failures:
        report_error("; ".join(failures))
        return 1
    print("All smoke checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
