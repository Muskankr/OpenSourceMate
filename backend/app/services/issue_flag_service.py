"""Service for detecting claimed and stale GitHub issues.

Flags issues based on four primary signals:
1. Assignee: An individual or multiple contributors are assigned.
2. Linked/Open Pull Request: GitHub PR metadata or cross-references indicate a PR is open.
3. Recent Claim Comment: A comment within the recent window expresses explicit intent to claim/work on the issue.
4. Stale/Inactive: No updates or activity within a configurable duration (default: 60 days).
"""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

# Regular expressions matching explicit intent to claim or work on an issue
CLAIM_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bi(?:'d| would)? like to work on this\b", re.IGNORECASE),
    re.compile(r"\bcan i (?:please )?work on this\b", re.IGNORECASE),
    re.compile(r"\bmay i (?:please )?work on this\b", re.IGNORECASE),
    re.compile(r"\bcould i (?:please )?work on this\b", re.IGNORECASE),
    re.compile(r"\bplease assign (?:this to )?me\b", re.IGNORECASE),
    re.compile(r"\bcan you assign (?:this to )?me\b", re.IGNORECASE),
    re.compile(r"\bassign (?:this to )?me\b", re.IGNORECASE),
    re.compile(r"\bi(?:'m| am) working on this\b", re.IGNORECASE),
    re.compile(r"\bi will work on this\b", re.IGNORECASE),
    re.compile(r"\bi'll work on this\b", re.IGNORECASE),
    re.compile(r"\binterested in working on this\b", re.IGNORECASE),
    re.compile(r"\binterested to work on this\b", re.IGNORECASE),
    re.compile(r"\btaking this up\b", re.IGNORECASE),
    re.compile(r"\bi(?:'ll| will) take this up\b", re.IGNORECASE),
    re.compile(r"\bworking on a fix\b", re.IGNORECASE),
    re.compile(r"(?:^|\s)/claim\b", re.IGNORECASE),
    re.compile(r"\bclaim(?:ing)? this issue\b", re.IGNORECASE),
]

# Regular expressions matching linked or referenced pull requests
PR_URL_PATTERN = re.compile(
    r"https://github\.com/[^/\s]+/[^/\s]+/pull/(\d+)", re.IGNORECASE
)
PR_TEXT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\b(?:pr|pull request|linked pr|opened pr|submitted pr)[ :#-]+#?(\d+)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:fix(?:es)?|close[sd]?|resolve[sd]?)[ :#-]+#?(\d+)\b",
        re.IGNORECASE,
    ),
]


def _parse_timestamp(value: Any) -> datetime | None:
    """Safely parse an ISO-8601 string into an aware UTC datetime."""
    if not value or not isinstance(value, str):
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt.astimezone(UTC)
    except (ValueError, TypeError):
        return None


def detect_assignee(issue: dict[str, Any]) -> tuple[bool, list[str], str | None]:
    """Detect whether an issue has an assigned contributor.

    Returns:
        (has_assignee, assignees_list, reason_or_none)
    """
    assignees: list[str] = []

    # Check raw assignees list
    raw_assignees = issue.get("assignees")
    if isinstance(raw_assignees, list):
        for a in raw_assignees:
            if isinstance(a, dict) and a.get("login"):
                login = str(a["login"]).strip()
                if login and login not in assignees:
                    assignees.append(login)
            elif isinstance(a, str) and a.strip():
                login = a.strip()
                if login not in assignees:
                    assignees.append(login)

    # Check singular assignee
    raw_assignee = issue.get("assignee")
    if isinstance(raw_assignee, dict) and raw_assignee.get("login"):
        login = str(raw_assignee["login"]).strip()
        if login and login not in assignees:
            assignees.append(login)
    elif isinstance(raw_assignee, str) and raw_assignee.strip():
        login = raw_assignee.strip()
        if login not in assignees:
            assignees.append(login)

    if assignees:
        formatted = ", ".join(f"@{login}" for login in assignees)
        reason = f"Assigned to {formatted}"
        return True, assignees, reason

    return False, [], None


def detect_linked_pr(issue: dict[str, Any]) -> tuple[bool, list[str], str | None]:
    """Detect whether an issue has a linked or open pull request.

    Returns:
        (has_linked_pr, linked_pr_identifiers, reason_or_none)
    """
    linked_prs: list[str] = []

    # 1. GitHub search item `pull_request` key
    pr_meta = issue.get("pull_request")
    if pr_meta:
        if isinstance(pr_meta, dict):
            pr_url = pr_meta.get("html_url") or pr_meta.get("url") or "linked PR"
            linked_prs.append(str(pr_url))
        elif isinstance(pr_meta, str) and pr_meta.strip():
            linked_prs.append(pr_meta.strip())

    # 2. Explicit list of linked PRs if attached
    for key in ("pull_requests", "linked_pull_requests"):
        prs = issue.get(key)
        if isinstance(prs, list):
            for pr in prs:
                val = str(pr).strip()
                if val and val not in linked_prs:
                    linked_prs.append(val)

    # 3. Text inspection of issue body
    body = issue.get("body") or ""
    if isinstance(body, str) and body:
        for match in PR_URL_PATTERN.finditer(body):
            pr_link = match.group(0)
            if pr_link not in linked_prs:
                linked_prs.append(pr_link)
        for pattern in PR_TEXT_PATTERNS:
            for match in pattern.finditer(body):
                pr_ref = f"#{match.group(1)}"
                if pr_ref not in linked_prs:
                    linked_prs.append(pr_ref)

    if linked_prs:
        first = linked_prs[0]
        reason = (
            f"Linked pull request detected ({first})"
            if first.startswith("#") or "github.com" in first
            else "Linked or open pull request detected"
        )
        return True, linked_prs, reason

    return False, [], None


def detect_claim_comment(
    issue: dict[str, Any],
    recent_claim_days: int = 30,
    now: datetime | None = None,
) -> tuple[bool, list[str], str | None]:
    """Detect whether recent comments indicate contributor intent to claim/work on the issue.

    Returns:
        (has_claim_comment, matched_snippets, reason_or_none)
    """
    ref_now = now or datetime.now(UTC)
    snippets: list[str] = []
    reason: str | None = None

    # Inspect comments list if present (e.g., pre-fetched or from fixtures)
    comments = (
        issue.get("comments_data")
        or issue.get("recent_comments")
        or issue.get("comments_list")
        or []
    )

    if isinstance(comments, list):
        for comment in comments:
            comment_body = ""
            author = "contributor"
            comment_dt: datetime | None = None

            if isinstance(comment, dict):
                comment_body = str(comment.get("body") or "")
                user_val = comment.get("user")
                if isinstance(user_val, dict):
                    author = user_val.get("login") or author
                elif isinstance(user_val, str):
                    author = user_val
                comment_dt = _parse_timestamp(
                    comment.get("created_at") or comment.get("updated_at")
                )
            elif isinstance(comment, str):
                comment_body = comment

            # If timestamp is present, ensure comment falls within recent window
            if comment_dt is not None:
                days_ago = max(0, (ref_now - comment_dt).days)
                if days_ago > recent_claim_days:
                    continue
            else:
                days_ago = None

            # Test claim patterns
            for pat in CLAIM_PATTERNS:
                match = pat.search(comment_body)
                if match:
                    phrase = match.group(0).strip()
                    snippets.append(phrase)
                    if not reason:
                        time_text = (
                            f" ({days_ago}d ago)" if days_ago is not None else ""
                        )
                        reason = (
                            f"Recent claim comment: \"{phrase}\" by @{author}{time_text}"
                        )
                    break

    # If no comments_data list was provided, also check if issue body contains a self-claim declaration
    if not snippets:
        body = str(issue.get("body") or "")
        for pat in CLAIM_PATTERNS:
            match = pat.search(body)
            if match:
                phrase = match.group(0).strip()
                snippets.append(phrase)
                if not reason:
                    reason = f"Claim intent detected in description: \"{phrase}\""
                break

    if snippets:
        return True, snippets, reason

    return False, [], None


def detect_stale(
    issue: dict[str, Any],
    stale_days: int = 60,
    now: datetime | None = None,
) -> tuple[bool, int | None, str | None]:
    """Detect whether an issue has been inactive for longer than `stale_days`.

    Returns:
        (is_stale, days_inactive, reason_or_none)
    """
    ref_now = now or datetime.now(UTC)
    updated_str = issue.get("updated_at") or issue.get("created_at")
    dt = _parse_timestamp(updated_str)

    if dt is None:
        return False, None, None

    days_inactive = max(0, (ref_now - dt).days)
    if days_inactive >= stale_days:
        reason = f"No activity for {days_inactive} days (stale threshold: {stale_days} days)"
        return True, days_inactive, reason

    return False, days_inactive, None


def evaluate_issue_flags(
    issue: dict[str, Any],
    stale_days: int = 60,
    recent_claim_days: int = 30,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Evaluate all claimed and stale signals for a given issue.

    Returns a structured dictionary with:
    - is_claimed (bool)
    - is_stale (bool)
    - is_flagged (bool)
    - why_flagged (list[str])
    - claim_details (dict)
    """
    ref_now = now or datetime.now(UTC)

    has_assignee, assignees, assignee_reason = detect_assignee(issue)
    has_linked_pr, linked_prs, pr_reason = detect_linked_pr(issue)
    has_claim_comment, claim_snippets, comment_reason = detect_claim_comment(
        issue, recent_claim_days=recent_claim_days, now=ref_now
    )
    is_stale, days_inactive, stale_reason = detect_stale(
        issue, stale_days=stale_days, now=ref_now
    )

    is_claimed = bool(has_assignee or has_linked_pr or has_claim_comment)
    is_flagged = bool(is_claimed or is_stale)

    why_flagged: list[str] = []
    if assignee_reason:
        why_flagged.append(assignee_reason)
    if pr_reason:
        why_flagged.append(pr_reason)
    if comment_reason:
        why_flagged.append(comment_reason)
    if stale_reason:
        why_flagged.append(stale_reason)

    claim_details = {
        "has_assignee": has_assignee,
        "assignees": assignees,
        "has_linked_pr": has_linked_pr,
        "linked_prs": linked_prs,
        "has_claim_comment": has_claim_comment,
        "claim_comment_snippets": claim_snippets,
        "is_stale": is_stale,
        "days_inactive": days_inactive,
        "stale_threshold_days": stale_days,
        "recent_claim_threshold_days": recent_claim_days,
    }

    return {
        "is_claimed": is_claimed,
        "is_stale": is_stale,
        "is_flagged": is_flagged,
        "why_flagged": why_flagged,
        "claim_details": claim_details,
    }
