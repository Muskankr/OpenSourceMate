import re
from datetime import UTC, datetime

VALID_EXPECTED_TIMES = {"quick", "weekend", "ongoing"}
REPO_PATTERN = re.compile(r"^[a-zA-Z0-9._-]+(/[a-zA-Z0-9._-]+)?$")


def validate_preference_languages(languages: list[str] | None) -> list[str]:
    """Validate and clean preferred languages list."""
    if not languages:
        return []
    cleaned = []
    for lang in languages:
        parts = [p.strip() for p in lang.split(",") if p.strip()]
        for p in parts:
            if len(p) > 50 or not re.match(r"^[a-zA-Z0-9+#.\- ]+$", p):
                raise ValueError(
                    f"Invalid preferred language: '{p}'. Must be 1-50 alphanumeric characters or standard symbols (+, #, ., -, space)."
                )
            if p not in cleaned:
                cleaned.append(p)
    return cleaned


def validate_excluded_orgs_or_repos(excluded: list[str] | None) -> list[str]:
    """Validate and clean excluded organizations or repositories list."""
    if not excluded:
        return []
    cleaned = []
    for item in excluded:
        parts = [p.strip() for p in item.split(",") if p.strip()]
        for p in parts:
            if len(p) > 100 or not REPO_PATTERN.match(p):
                raise ValueError(
                    f"Invalid excluded organization or repository: '{p}'. Must be in 'owner' or 'owner/repo' format."
                )
            # Store lower-case for case-insensitive matching
            norm = p.lower()
            if norm not in cleaned:
                cleaned.append(norm)
    return cleaned


def validate_max_age_days(max_age_days: int | None) -> int | None:
    """Validate max issue age in days (between 1 and 3650 days)."""
    if max_age_days is None:
        return None
    if max_age_days <= 0 or max_age_days > 3650:
        raise ValueError(
            f"Invalid max_age_days: {max_age_days}. Must be between 1 and 3650 days."
        )
    return max_age_days


def validate_expected_time(expected_time: str | None) -> str | None:
    """Validate expected time commitment ('quick', 'weekend', 'ongoing')."""
    if not expected_time:
        return None
    cleaned = expected_time.strip().lower()
    if cleaned not in VALID_EXPECTED_TIMES:
        raise ValueError(
            f"Invalid expected_time: '{expected_time}'. Allowed values are: {', '.join(sorted(VALID_EXPECTED_TIMES))}."
        )
    return cleaned


def filter_by_preferences(
    issues: list[dict],
    preferred_languages: list[str] | None = None,
    excluded_orgs_or_repos: list[str] | None = None,
    max_age_days: int | None = None,
    expected_time: str | None = None,
    now: datetime | None = None,
) -> list[dict]:
    """Filter issues list based on user preferences.

    Criteria:
    - Excluded organizations or repositories: Excluded orgs/repos NEVER appear in results.
    - Preferred languages: If provided, issues must match one of the preferred languages
      (via language field, labels, or title).
    - Maximum issue age: Issue must have been created within max_age_days.
    - Expected time commitment:
      - 'quick': Small scope issues (comments <= 2, body <= 400 chars, or beginner/good-first labels)
      - 'weekend': Moderate scope (comments <= 6, body <= 800 chars)
      - 'ongoing': Larger scope (complex, epic, or comments > 5)
    """
    current_time = now or datetime.now(UTC)
    results = []

    preferred_langs_lower = {l.lower() for l in (preferred_languages or [])}
    excluded_set = {x.lower() for x in (excluded_orgs_or_repos or [])}

    for issue in issues:
        repo = (issue.get("repository") or "").strip().lower()
        repo_owner = repo.split("/")[0] if "/" in repo else repo

        # 1. Excluded orgs or repos check (Exact repo or org match)
        if repo in excluded_set or repo_owner in excluded_set:
            continue

        # 2. Preferred languages check (if specified)
        if preferred_langs_lower:
            issue_lang = (issue.get("language") or "").strip().lower()
            issue_labels = [
                (lbl.get("name", "").lower() if isinstance(lbl, dict) else str(lbl).lower())
                for lbl in issue.get("labels", [])
            ]
            title_lower = (issue.get("title") or "").lower()

            matches_lang = (
                issue_lang in preferred_langs_lower
                or any(pl in issue_labels for pl in preferred_langs_lower)
                or any(pl in title_lower for pl in preferred_langs_lower)
            )
            if not matches_lang:
                continue

        # 3. Maximum issue age check
        if max_age_days is not None:
            created_at_str = issue.get("created_at")
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    age_days = (current_time - created_at).days
                    if age_days > max_age_days:
                        continue
                except (ValueError, TypeError):
                    pass

        # 4. Expected time commitment check
        if expected_time:
            comments = issue.get("comments", 0)
            body_length = len(issue.get("body") or "")
            labels_lower = [
                (lbl.get("name", "").lower() if isinstance(lbl, dict) else str(lbl).lower())
                for lbl in issue.get("labels", [])
            ]
            has_beginner_label = any(
                "good first" in l or "beginner" in l or "easy" in l or "starter" in l
                for l in labels_lower
            )

            if expected_time == "quick":
                # Quick issue: small scope, few comments, or beginner label
                is_quick = (comments <= 2 and body_length <= 600) or has_beginner_label
                if not is_quick:
                    continue
            elif expected_time == "weekend":
                # Weekend issue: reasonable scope (<= 6 comments, <= 1000 chars)
                is_weekend = comments <= 6 and body_length <= 1000
                if not is_weekend:
                    continue
            elif expected_time == "ongoing":
                # Ongoing issue: larger scope or active ongoing discussion
                is_ongoing = comments >= 3 or body_length >= 500 or any(
                    "help wanted" in l or "epic" in l or "feature" in l for l in labels_lower
                )
                if not is_ongoing:
                    continue

        results.append(issue)

    return results
