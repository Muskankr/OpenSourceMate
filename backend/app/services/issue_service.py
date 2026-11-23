import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.services.github_service import (
    GITHUB_API_URL,
    get_repository_info,
    github_get,
)

MAX_BODY_LENGTH: int = 1000


def load_issue_filter_config(
    config_path: str | Path | None = None,
) -> dict[str, Any]:
    """Load issue filtering configuration from settings and optional config file.

    Precedence order:
      1. Explicit environment variables (ISSUE_FILTER_*)
      2. Configuration file (data/issue_filters.json or backend/app/data/issue_filters.json)
      3. Application default Settings values
    """
    settings = get_settings()

    config = {
        "skip_assigned": getattr(settings, "issue_filter_skip_assigned", True),
        "skip_archived": getattr(settings, "issue_filter_skip_archived", True),
        "max_repo_inactive_days": getattr(
            settings, "issue_filter_max_repo_inactive_days", 90
        ),
    }

    # Candidate file locations
    search_paths: list[Path] = []
    if config_path:
        search_paths.append(Path(config_path))
    default_config_path = getattr(settings, "issue_filter_config_path", None)
    if default_config_path:
        search_paths.append(Path(default_config_path))

    # Also check standard project locations
    current_dir = Path(__file__).resolve().parent
    search_paths.extend(
        [
            current_dir.parent / "data" / "issue_filters.json",
            current_dir.parent.parent.parent / "data" / "issue_filters.json",
            Path("data/issue_filters.json"),
        ]
    )

    for path in search_paths:
        if path.is_file():
            try:
                with open(path, encoding="utf-8") as f:
                    file_data = json.load(f)
                    if isinstance(file_data, dict):
                        if "skip_assigned" in file_data:
                            config["skip_assigned"] = bool(
                                file_data["skip_assigned"]
                            )
                        if "skip_archived" in file_data:
                            config["skip_archived"] = bool(
                                file_data["skip_archived"]
                            )
                        if "max_repo_inactive_days" in file_data:
                            config["max_repo_inactive_days"] = int(
                                file_data["max_repo_inactive_days"]
                            )
                        break
            except (json.JSONDecodeError, OSError, ValueError):
                continue

    # Explicit environment variables override config file
    env_assigned = os.environ.get("ISSUE_FILTER_SKIP_ASSIGNED")
    if env_assigned is not None:
        config["skip_assigned"] = env_assigned.strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )

    env_archived = os.environ.get("ISSUE_FILTER_SKIP_ARCHIVED")
    if env_archived is not None:
        config["skip_archived"] = env_archived.strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )

    env_inactive = os.environ.get("ISSUE_FILTER_MAX_REPO_INACTIVE_DAYS")
    if env_inactive is not None:
        try:
            config["max_repo_inactive_days"] = int(env_inactive.strip())
        except ValueError:
            pass

    return config


def is_issue_assigned(issue: dict[str, Any]) -> bool:
    """Return True if the issue already has one or more assignees assigned."""
    if issue.get("assignee") is not None:
        return True
    assignees = issue.get("assignees")
    if isinstance(assignees, list) and len(assignees) > 0:
        return True
    return False


def is_repository_archived(
    repo_data: dict[str, Any] | None,
    issue: dict[str, Any] | None = None,
) -> bool:
    """Return True if the repository is marked as archived."""
    if repo_data and repo_data.get("archived") is True:
        return True
    if issue:
        if issue.get("repository_archived") is True or issue.get("archived") is True:
            return True
        embedded_repo = issue.get("repository")
        if isinstance(embedded_repo, dict) and embedded_repo.get("archived") is True:
            return True
    return False


def is_repository_inactive(
    repo_data: dict[str, Any] | None,
    max_inactive_days: int,
    now: datetime | None = None,
) -> bool:
    """Return True if the repository has no push/update activity within max_inactive_days.

    If max_inactive_days <= 0 or repository data is unavailable, returns False.
    Activity is calculated based on the freshest timestamp among `pushed_at` and `updated_at`.
    """
    if max_inactive_days <= 0 or not repo_data:
        return False

    current_time = now or datetime.now(UTC)

    pushed_at_str = repo_data.get("pushed_at")
    updated_at_str = repo_data.get("updated_at")

    timestamps: list[datetime] = []
    for ts_str in (pushed_at_str, updated_at_str):
        if ts_str:
            try:
                dt = datetime.fromisoformat(str(ts_str).replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=UTC)
                timestamps.append(dt)
            except (ValueError, TypeError):
                continue

    if not timestamps:
        return False

    most_recent_activity = max(timestamps)
    days_inactive = max(0, (current_time - most_recent_activity).days)
    return days_inactive > max_inactive_days


async def filter_issue_item(
    issue: dict[str, Any],
    skip_assigned: bool,
    skip_archived: bool,
    max_repo_inactive_days: int,
    now: datetime | None = None,
) -> bool:
    """Determine if a single issue should be included (returns True) or filtered out (returns False)."""
    # 1. Skip issues with assignees
    if skip_assigned and is_issue_assigned(issue):
        return False

    # Resolve repository identifier
    repo_slug = ""
    if issue.get("repository_url"):
        repo_slug = issue["repository_url"].split("/repos/")[-1]
    elif isinstance(issue.get("repository"), str):
        repo_slug = issue["repository"]

    # Resolve repository details
    repo_info: dict[str, Any] | None = None
    if isinstance(issue.get("repository_data"), dict):
        repo_info = issue["repository_data"]
    elif isinstance(issue.get("repository"), dict):
        repo_info = issue["repository"]
    elif repo_slug:
        repo_info = await get_repository_info(repo_slug)

    # 2. Skip archived repositories
    if skip_archived and is_repository_archived(repo_info, issue):
        return False

    # 3. Skip inactive repositories
    if max_repo_inactive_days > 0 and is_repository_inactive(
        repo_info, max_repo_inactive_days, now=now
    ):
        return False

    return True


async def search_github_issues(
    language: str | None = None,
    label: str | None = None,
    keyword: str | None = None,
    per_page: int = 20,
    skip_assigned: bool | None = None,
    skip_archived: bool | None = None,
    max_repo_inactive_days: int | None = None,
) -> dict[str, Any]:
    """Search GitHub issues with configurable filters for assigned, archived, and inactive repositories."""
    filter_config = load_issue_filter_config()
    effective_skip_assigned = (
        skip_assigned
        if skip_assigned is not None
        else filter_config["skip_assigned"]
    )
    effective_skip_archived = (
        skip_archived
        if skip_archived is not None
        else filter_config["skip_archived"]
    )
    effective_max_inactive_days = (
        max_repo_inactive_days
        if max_repo_inactive_days is not None
        else filter_config["max_repo_inactive_days"]
    )

    query_parts: list[str] = [
        "is:issue",
        "is:open",
    ]

    # Use native GitHub search qualifiers where supported to conserve rate limits
    if effective_skip_assigned:
        query_parts.append("no:assignee")

    if effective_skip_archived:
        query_parts.append("archived:false")

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
    items = data.get("items", [])

    issues: list[dict[str, Any]] = []

    for issue in items:
        # Check all filtering rules
        keep = await filter_issue_item(
            issue=issue,
            skip_assigned=effective_skip_assigned,
            skip_archived=effective_skip_archived,
            max_repo_inactive_days=effective_max_inactive_days,
        )
        if not keep:
            continue

        repo_name = (
            issue.get("repository_url", "").split("/repos/")[-1]
            if issue.get("repository_url")
            else str(issue.get("repository", ""))
        )
        raw_labels = issue.get("labels", [])
        labels = [
            lbl["name"] if isinstance(lbl, dict) else str(lbl)
            for lbl in raw_labels
        ]
        user_login = (
            issue.get("user", {}).get("login", "unknown")
            if isinstance(issue.get("user"), dict)
            else str(issue.get("user", "unknown"))
        )

        issues.append(
            {
                "id": issue["id"],
                "title": issue["title"],
                "repository": repo_name,
                "url": issue.get("html_url", ""),
                "state": issue.get("state", "open"),
                "labels": labels,
                "comments": issue.get("comments", 0),
                "created_at": issue.get("created_at", ""),
                "updated_at": issue.get("updated_at", ""),
                "user": user_login,
                "body": (issue.get("body") or "")[:MAX_BODY_LENGTH],
                "language": language,
                "assignee": issue.get("assignee"),
                "assignees": issue.get("assignees", []),
            }
        )

    return {
        "total_count": len(issues),
        "issues": issues,
    }
