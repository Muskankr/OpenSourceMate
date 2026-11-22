from datetime import datetime
from typing import Any

from app.services.github_service import GITHUB_API_URL, github_get
from app.services.issue_flag_service import evaluate_issue_flags

MAX_BODY_LENGTH: int = 1000


def process_github_issue_item(
    issue: dict[str, Any],
    language: str | None = None,
    stale_days: int = 60,
    recent_claim_days: int = 30,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Normalize and flag a raw GitHub issue search item.

    Evaluates whether the issue has an assignee, linked PR, recent claim comment,
    or is stale, attaching `is_claimed`, `is_stale`, `is_flagged`, `why_flagged`,
    and `claim_details`.
    """
    flags = evaluate_issue_flags(
        issue,
        stale_days=stale_days,
        recent_claim_days=recent_claim_days,
        now=now,
    )

    repo_val = issue.get("repository_url") or ""
    repo_name = repo_val.split("/repos/")[-1] if "/repos/" in repo_val else repo_val

    user_val = issue.get("user")
    user_login = (
        user_val.get("login")
        if isinstance(user_val, dict)
        else str(user_val or "")
    )

    assignee_val = issue.get("assignee")
    assignee_login = (
        assignee_val.get("login")
        if isinstance(assignee_val, dict)
        else (str(assignee_val) if assignee_val else None)
    )

    assignees_list: list[str] = []
    raw_assignees = issue.get("assignees")
    if isinstance(raw_assignees, list):
        for a in raw_assignees:
            if isinstance(a, dict) and a.get("login"):
                assignees_list.append(str(a["login"]))
            elif isinstance(a, str) and a.strip():
                assignees_list.append(a.strip())

    labels_list: list[str] = []
    for lbl in issue.get("labels") or []:
        if isinstance(lbl, dict) and lbl.get("name"):
            labels_list.append(str(lbl["name"]))
        elif isinstance(lbl, str) and lbl.strip():
            labels_list.append(lbl.strip())

    return {
        "id": issue.get("id"),
        "number": issue.get("number"),
        "title": issue.get("title") or "",
        "repository": repo_name,
        "url": issue.get("html_url") or issue.get("url") or "",
        "state": issue.get("state") or "open",
        "labels": labels_list,
        "comments": issue.get("comments", 0),
        "created_at": issue.get("created_at") or "",
        "updated_at": issue.get("updated_at") or "",
        "user": user_login,
        "body": (issue.get("body") or "")[:MAX_BODY_LENGTH],
        "language": language,
        "assignee": assignee_login,
        "assignees": assignees_list,
        "pull_request": issue.get("pull_request"),
        "is_claimed": flags["is_claimed"],
        "is_stale": flags["is_stale"],
        "is_flagged": flags["is_flagged"],
        "why_flagged": flags["why_flagged"],
        "claim_details": flags["claim_details"],
    }


async def search_github_issues(
    language: str | None = None,
    label: str | None = None,
    keyword: str | None = None,
    per_page: int = 20,
    exclude_claimed: bool = False,
    exclude_stale: bool = False,
    stale_days: int = 60,
    recent_claim_days: int = 30,
    now: datetime | None = None,
) -> dict[str, Any]:
    query_parts: list[str] = [
        "is:issue",
        "is:open",
    ]

    if language:
        query_parts.append(f"language:{language}")

    if label:
        query_parts.append(f'label:"{label}"')

    if keyword:
        query_parts.append(keyword)

    query = " ".join(query_parts)

    url = f"{GITHUB_API_URL}/search/issues"

    params: dict[str, Any] = {
        "q": query,
        "per_page": min(per_page, 100),
    }

    response = await github_get(url, params=params)

    response.raise_for_status()

    data = response.json()

    issues: list[dict[str, Any]] = []

    for item in data.get("items", []):
        processed = process_github_issue_item(
            item,
            language=language,
            stale_days=stale_days,
            recent_claim_days=recent_claim_days,
            now=now,
        )

        # Apply configurable filters
        if exclude_claimed and processed["is_claimed"]:
            continue
        if exclude_stale and processed["is_stale"]:
            continue

        issues.append(processed)

    return {
        "total_count": len(issues) if (exclude_claimed or exclude_stale) else data.get("total_count", len(issues)),
        "issues": issues,
    }
