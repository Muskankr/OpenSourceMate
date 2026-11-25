"""Discover welcoming repositories ranked by newcomer-friendliness (Issue #447).

Evaluates candidate open source projects matching target languages on:
1. Number of open beginner issues (good first issue, beginner labels) (30 pts)
2. Recent activity (commits / pushes / updates within 30/90/180 days) (25 pts)
3. Presence of CONTRIBUTING guide (25 pts)
4. Presence of Code of Conduct (20 pts)

Total score is deterministic on a 100-point scale.
Search queries and repository signals are cached in memory to respect GitHub rate limits.
"""

from datetime import UTC, datetime
from typing import Any
import re

from app.cache import cache
from app.services.github_service import GITHUB_API_URL, github_get
from app.utils.logging import get_logger

logger = get_logger("app.services.discover")

DEFAULT_DISCOVER_LANGUAGES = ["Python", "TypeScript", "JavaScript", "Go", "Rust"]
DEFAULT_CACHE_TTL = 3600  # 1 hour


def calculate_newcomer_friendliness_score(
    good_first_issues: int = 0,
    last_activity_iso: str | None = None,
    has_contributing: bool = False,
    has_code_of_conduct: bool = False,
) -> tuple[int, str, dict[str, int]]:
    """Deterministically computes newcomer-friendliness score (0-100), tier, and point breakdown.

    Signals:
    - Open Beginner Issues (max 30 pts):
        >= 5: 30 pts
        3 - 4: 22 pts
        1 - 2: 15 pts
        0: 0 pts
    - Recent Activity (max 25 pts):
        <= 30 days: 25 pts
        31 - 90 days: 15 pts
        91 - 180 days: 8 pts
        > 180 days or missing: 0 pts
    - CONTRIBUTING Guide (max 25 pts):
        Present: 25 pts
        Missing: 0 pts
    - Code of Conduct (max 20 pts):
        Present: 20 pts
        Missing: 0 pts
    """
    # 1. Open Beginner Issues (30 pts)
    safe_issues = max(0, good_first_issues or 0)
    if safe_issues >= 5:
        beginner_points = 30
    elif safe_issues >= 3:
        beginner_points = 22
    elif safe_issues >= 1:
        beginner_points = 15
    else:
        beginner_points = 0

    # 2. Recent Activity (25 pts)
    activity_points = 0
    if last_activity_iso:
        try:
            clean_iso = last_activity_iso.replace("Z", "+00:00")
            activity_dt = datetime.fromisoformat(clean_iso)
            now_dt = datetime.now(UTC)
            diff_days = max(0, (now_dt - activity_dt).days)
            if diff_days <= 30:
                activity_points = 25
            elif diff_days <= 90:
                activity_points = 15
            elif diff_days <= 180:
                activity_points = 8
            else:
                activity_points = 0
        except Exception:
            activity_points = 0

    # 3. CONTRIBUTING Guide (25 pts)
    contributing_points = 25 if has_contributing else 0

    # 4. Code of Conduct (20 pts)
    coc_points = 20 if has_code_of_conduct else 0

    total_score = max(0, min(100, beginner_points + activity_points + contributing_points + coc_points))

    # Determine Tier
    if total_score >= 80:
        tier = "Very Welcoming"
    elif total_score >= 60:
        tier = "Welcoming"
    elif total_score >= 40:
        tier = "Moderate"
    else:
        tier = "Challenging"

    breakdown = {
        "beginner_issues_points": beginner_points,
        "recent_activity_points": activity_points,
        "contributing_points": contributing_points,
        "code_of_conduct_points": coc_points,
        "total_score": total_score,
    }

    return total_score, tier, breakdown


async def _fetch_repo_community_signals(full_name: str) -> dict[str, Any]:
    """Fetches or retrieves cached community signals (contributing, code of conduct, beginner issues)."""
    cache_key = f"signals:{full_name.lower()}"
    cached = cache.get(cache_key)
    if cached is not None and isinstance(cached, dict):
        return cached

    has_contributing = False
    has_code_of_conduct = False
    good_first_issues_count = 0

    # Community Profile
    try:
        comm_resp = await github_get(f"{GITHUB_API_URL}/repos/{full_name}/community/profile")
        if comm_resp.status_code == 200:
            files = comm_resp.json().get("files", {})
            has_contributing = bool(files.get("contributing"))
            has_code_of_conduct = bool(files.get("code_of_conduct"))
    except Exception:
        pass

    # Open beginner issues count
    try:
        issues_resp = await github_get(
            f"{GITHUB_API_URL}/search/issues",
            params={
                "q": f'repo:{full_name} is:issue is:open label:"good first issue"',
                "per_page": 1,
            },
        )
        if issues_resp.status_code == 200:
            good_first_issues_count = issues_resp.json().get("total_count", 0)
    except Exception:
        pass

    signals = {
        "has_contributing": has_contributing,
        "has_code_of_conduct": has_code_of_conduct,
        "good_first_issues_count": good_first_issues_count,
    }
    cache.set(cache_key, signals, ttl=DEFAULT_CACHE_TTL)
    return signals


async def discover_repositories(
    language: str | None = None,
    languages: list[str] | str | None = None,
    username: str | None = None,
    min_stars: int = 0,
    max_stars: int | None = None,
    limit: int = 20,
) -> dict[str, Any]:
    """Search and rank repositories matching user's top languages by newcomer-friendliness."""
    # Normalize language list
    target_languages: list[str] = []
    if isinstance(languages, str):
        target_languages = [lang.strip() for lang in languages.split(",") if lang.strip()]
    elif isinstance(languages, list):
        target_languages = [str(l).strip() for l in languages if str(l).strip()]

    # If username provided and no languages specified, infer from user's detected skills
    if username and not language and not target_languages:
        try:
            from app.services.skill_service import get_user_skills
            user_skills = await get_user_skills(username)
            if user_skills and user_skills.get("skills"):
                target_languages = [s["name"] for s in user_skills["skills"][:3]]
        except Exception as e:
            logger.debug(f"Failed to infer skills for user {username}: {e}")

    if language:
        target_languages = [language.strip()]
    elif not target_languages:
        target_languages = DEFAULT_DISCOVER_LANGUAGES

    # Check query cache
    sorted_langs = ",".join(sorted(l.lower() for l in target_languages))
    query_cache_key = f"discover:{sorted_langs}:{language or ''}:{min_stars}:{max_stars}:{limit}"
    cached_result = cache.get(query_cache_key)
    if cached_result is not None and isinstance(cached_result, dict):
        return cached_result

    # Build GitHub repository search query
    query_parts = ["is:public", "archived:false", "fork:false"]

    # Language query
    if language:
        query_parts.append(f'language:"{language.strip()}"')
    elif len(target_languages) == 1:
        query_parts.append(f'language:"{target_languages[0]}"')

    # Stars range
    if max_stars is not None and max_stars >= 0:
        query_parts.append(f"stars:{min_stars}..{max_stars}")
    elif min_stars > 0:
        query_parts.append(f"stars:>={min_stars}")
    else:
        query_parts.append("stars:>=10")

    search_query = " ".join(query_parts)
    search_url = f"{GITHUB_API_URL}/search/repositories"
    search_params = {
        "q": search_query,
        "sort": "stars",
        "order": "desc",
        "per_page": min(max(limit * 2, 10), 50),
    }

    resp = await github_get(search_url, params=search_params)
    resp.raise_for_status()
    search_data = resp.json()
    items = search_data.get("items", [])

    discovered: list[dict[str, Any]] = []

    # Map candidate languages for filtering if multi-language
    target_langs_lower = {l.lower() for l in target_languages}

    for item in items:
        repo_lang = item.get("language")
        # If multi-language search without single language constraint, ensure repository language matches
        if not language and target_langs_lower and repo_lang and repo_lang.lower() not in target_langs_lower:
            continue

        stars = item.get("stargazers_count", 0)
        if stars < min_stars:
            continue
        if max_stars is not None and stars > max_stars:
            continue

        full_name = item.get("full_name") or f"{item.get('owner', {}).get('login')}/{item.get('name')}"
        last_activity = item.get("pushed_at") or item.get("updated_at")

        signals = await _fetch_repo_community_signals(full_name)
        good_first_issues = signals.get("good_first_issues_count", 0)
        has_contributing = signals.get("has_contributing", False)
        has_coc = signals.get("has_code_of_conduct", False)

        score, tier, breakdown = calculate_newcomer_friendliness_score(
            good_first_issues=good_first_issues,
            last_activity_iso=last_activity,
            has_contributing=has_contributing,
            has_code_of_conduct=has_coc,
        )

        discovered.append({
            "name": item.get("name"),
            "full_name": full_name,
            "html_url": item.get("html_url") or f"https://github.com/{full_name}",
            "description": item.get("description"),
            "stars": stars,
            "forks": item.get("forks_count", 0),
            "language": repo_lang,
            "open_issues_count": item.get("open_issues_count", 0),
            "good_first_issues_count": good_first_issues,
            "has_contributing": has_contributing,
            "has_code_of_conduct": has_coc,
            "last_activity_at": last_activity,
            "newcomer_friendliness_score": score,
            "newcomer_friendliness_tier": tier,
            "score_breakdown": breakdown,
        })

    # Sort descending by newcomer_friendliness_score; use stars and beginner issues as tiebreaker
    discovered.sort(
        key=lambda r: (
            r["newcomer_friendliness_score"],
            r["good_first_issues_count"],
            r["stars"],
        ),
        reverse=True,
    )

    ranked_repositories = discovered[:limit]

    result = {
        "repositories": ranked_repositories,
        "total_count": len(ranked_repositories),
        "languages": target_languages,
        "selected_language": language,
        "stars_filter": {
            "min_stars": min_stars,
            "max_stars": max_stars,
        },
    }

    cache.set(query_cache_key, result, ttl=DEFAULT_CACHE_TTL)
    return result
