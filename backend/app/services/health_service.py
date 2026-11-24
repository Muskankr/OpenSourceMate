"""Repository health signals evaluation service (Issue #416).

Computes simple health signals from public data:
- Days since last commit
- Share of recent pull requests merged (sampled latest 20 items)
- Median time to first response on recent issues and PRs (sampled latest 20 items)
- Overall health status rating: Active, Slow, Inactive, or Unknown (if insufficient data)
"""

from datetime import UTC, datetime
from typing import Any

from app.cache import cache
from app.services.friendliness_service import parse_repo_owner_name
from app.services.github_service import GITHUB_API_URL, github_get

# Default cache TTL: 5 minutes (300 seconds) for health signals
HEALTH_CACHE_TTL_SECONDS = 300
MIN_SAMPLE_THRESHOLD = 3


def compute_repository_health(
    repository: str,
    commits: list[dict[str, Any]],
    pulls: list[dict[str, Any]],
    issues: list[dict[str, Any]],
    now_dt: datetime | None = None,
) -> dict[str, Any]:
    """Pure evaluation of repository health signals from commits, PRs, and issues."""
    if now_dt is None:
        now_dt = datetime.now(UTC)
    elif now_dt.tzinfo is None:
        now_dt = now_dt.replace(tzinfo=UTC)

    # 1. Days since last commit
    days_since_last_commit: float | None = None
    if commits and isinstance(commits, list) and len(commits) > 0:
        c_obj = commits[0]
        commit_date_str = (
            c_obj.get("commit", {}).get("committer", {}).get("date")
            or c_obj.get("commit", {}).get("author", {}).get("date")
        )
        if commit_date_str:
            try:
                commit_dt = datetime.fromisoformat(commit_date_str.replace("Z", "+00:00"))
                diff_sec = max(0.0, (now_dt - commit_dt).total_seconds())
                days_since_last_commit = round(diff_sec / 86400.0, 1)
            except Exception:
                days_since_last_commit = None

    # 2. Share of recent pull requests merged (latest 20)
    merged_pr_share: float | None = None
    if pulls and isinstance(pulls, list) and len(pulls) > 0:
        merged_count = sum(1 for pr in pulls if pr.get("merged_at") is not None)
        merged_pr_share = round(merged_count / len(pulls), 2)

    # 3. Median response hours on recent issues and pull requests (latest 20)
    sample_count = len(issues) if isinstance(issues, list) else 0
    response_hours: list[float] = []

    if issues and isinstance(issues, list):
        for itm in issues:
            comments_count = itm.get("comments", 0)
            created_at_str = itm.get("created_at")
            updated_at_str = itm.get("updated_at")
            if comments_count > 0 and created_at_str and updated_at_str:
                try:
                    c_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    u_dt = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
                    diff_h = max(0.5, (u_dt - c_dt).total_seconds() / 3600.0)
                    response_hours.append(diff_h)
                except Exception:
                    pass

    median_response_hours: float | None = None
    if response_hours:
        sorted_h = sorted(response_hours)
        median_response_hours = round(sorted_h[len(sorted_h) // 2], 1)

    # 4. Classification Rules:
    # Rule A: Insufficient data threshold -> Unknown
    if sample_count < MIN_SAMPLE_THRESHOLD or days_since_last_commit is None:
        status = "Unknown"
        rule_explanation = (
            "Fewer than 3 recent issues/PRs or no commits found for this repository. "
            "Repositories with too little data show 'Unknown' instead of guessing."
        )
        tooltip_text = (
            "Unknown: Insufficient recent activity data (fewer than 3 items sampled) "
            "to determine repository health."
        )
    # Rule B: Active (<=30 days commit, >=50% PR merge rate, <=48h response)
    elif (
        days_since_last_commit <= 30.0
        and (merged_pr_share is not None and merged_pr_share >= 0.50)
        and (median_response_hours is not None and median_response_hours <= 48.0)
    ):
        status = "Active"
        rule_explanation = (
            f"Last commit was {int(days_since_last_commit)} days ago (<= 30d), "
            f"{int(merged_pr_share * 100)}% recent PRs merged (>= 50%), "
            f"and median response is ~{median_response_hours}h (<= 48h). Maintainers actively respond and merge."
        )
        tooltip_text = (
            f"Active: Last commit {int(days_since_last_commit)}d ago, "
            f"{int(merged_pr_share * 100)}% recent PRs merged, "
            f"median response ~{median_response_hours}h. Maintainers are actively shipping and reviewing."
        )
    # Rule C: Slow (<=90 days commit, >=20% PR merge rate, <=168h response)
    elif (
        days_since_last_commit <= 90.0
        and (merged_pr_share is None or merged_pr_share >= 0.20)
        and (median_response_hours is None or median_response_hours <= 168.0)
    ):
        status = "Slow"
        pct_display = f"{int(merged_pr_share * 100)}%" if merged_pr_share is not None else "N/A"
        resp_display = f"~{median_response_hours}h" if median_response_hours is not None else "N/A"
        rule_explanation = (
            f"Last commit was {int(days_since_last_commit)} days ago (<= 90d), "
            f"{pct_display} recent PRs merged, "
            f"and median response is {resp_display}. Reviews and merges proceed at a slower pace."
        )
        tooltip_text = (
            f"Slow: Last commit {int(days_since_last_commit)}d ago, "
            f"{pct_display} recent PRs merged, "
            f"median response {resp_display}. Maintainers respond, but reviews may take time."
        )
    # Rule D: Inactive (>90 days commit, <20% PR merge rate, or >168h response)
    else:
        status = "Inactive"
        pct_display = f"{int(merged_pr_share * 100)}%" if merged_pr_share is not None else "0%"
        resp_display = f"~{median_response_hours}h" if median_response_hours is not None else ">7d"
        rule_explanation = (
            f"Last commit was {int(days_since_last_commit)} days ago (> 90d), "
            f"PR merge rate is {pct_display}, or median response time exceeds 7 days. Maintainer activity is currently stalled."
        )
        tooltip_text = (
            f"Inactive: Last commit {int(days_since_last_commit)}d ago, "
            f"{pct_display} recent PRs merged, "
            f"median response {resp_display}. Minimal maintainer activity in recent months."
        )

    return {
        "repository": repository,
        "status": status,
        "days_since_last_commit": days_since_last_commit,
        "merged_pr_share": merged_pr_share,
        "median_response_hours": median_response_hours,
        "sample_count": sample_count,
        "tooltip_text": tooltip_text,
        "rule_explanation": rule_explanation,
    }


async def evaluate_repository_health(
    repo_target: str,
    now_dt: datetime | None = None,
    bypass_cache: bool = False,
) -> dict[str, Any]:
    """Evaluates repository health signals, respecting cache and rate limits."""
    owner, repo = parse_repo_owner_name(repo_target)
    full_name = f"{owner}/{repo}"

    cache_key = f"repo_health:{full_name.lower()}"
    if not bypass_cache:
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

    # 1. Fetch Latest Commits
    commits_resp = await github_get(
        f"{GITHUB_API_URL}/repos/{full_name}/commits",
        params={"per_page": 1},
    )

    if commits_resp.status_code == 404:
        result = {
            "repository": full_name,
            "status": "Unknown",
            "days_since_last_commit": None,
            "merged_pr_share": None,
            "median_response_hours": None,
            "sample_count": 0,
            "tooltip_text": "Unknown: Repository not found or is private.",
            "rule_explanation": "Repository was not found or is private.",
        }
        cache.set(cache_key, result, ttl=HEALTH_CACHE_TTL_SECONDS)
        return result

    commits_data = (
        commits_resp.json()
        if commits_resp.status_code == 200 and isinstance(commits_resp.json(), list)
        else []
    )

    # 2. Fetch Latest Pull Requests (sample up to 20)
    pulls_resp = await github_get(
        f"{GITHUB_API_URL}/repos/{full_name}/pulls",
        params={"state": "all", "sort": "updated", "direction": "desc", "per_page": 20},
    )
    pulls_data = (
        pulls_resp.json()
        if pulls_resp.status_code == 200 and isinstance(pulls_resp.json(), list)
        else []
    )

    # 3. Fetch Latest Issues and PRs for response time (sample up to 20)
    issues_resp = await github_get(
        f"{GITHUB_API_URL}/repos/{full_name}/issues",
        params={"state": "all", "sort": "updated", "direction": "desc", "per_page": 20},
    )
    issues_data = (
        issues_resp.json()
        if issues_resp.status_code == 200 and isinstance(issues_resp.json(), list)
        else []
    )

    result = compute_repository_health(
        repository=full_name,
        commits=commits_data,
        pulls=pulls_data,
        issues=issues_data,
        now_dt=now_dt,
    )

    cache.set(cache_key, result, ttl=HEALTH_CACHE_TTL_SECONDS)
    return result
