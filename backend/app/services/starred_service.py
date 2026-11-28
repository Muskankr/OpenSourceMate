"""Service to fetch user starred repositories and aggregate topics & languages as interest signals.

Distinguishes between:
- Proven skills (derived from authored repositories).
- Aspirations & interests (derived from starred repositories).
"""

from collections import Counter
from typing import Any
import httpx

from app.config import get_settings
from app.services.github_service import (
    GITHUB_API_URL,
    GitHubRateLimitError,
    GitHubTimeoutError,
    cache,
    github_get,
)
from app.utils.logging import get_logger

logger = get_logger("app.services.starred_interests")

MAX_STARRED_REPOS_CAP = 100


async def get_user_starred_interests(
    username: str,
    limit: int = 50,
    refresh: bool = False,
) -> dict[str, Any]:
    """Fetch public starred repositories for user and aggregate topics and languages as interest signals.

    Caps at `limit` (max 100) to preserve rate limits.
    Cached for `github_cache_ttl` seconds.
    """
    settings = get_settings()
    effective_limit = min(max(1, limit), MAX_STARRED_REPOS_CAP)
    cache_key = f"github:starred-interests:{username.lower()}:{effective_limit}"

    if not refresh:
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

    url = f"{GITHUB_API_URL}/users/{username}/starred"
    params = {"per_page": effective_limit, "page": 1}

    try:
        response = await github_get(url, params=params)
        if response.status_code == 404:
            return {
                "username": username,
                "starred_count": 0,
                "topics": [],
                "languages": [],
                "total_starred_analyzed": 0,
            }
        response.raise_for_status()
        starred_repos = response.json()
    except (GitHubRateLimitError, GitHubTimeoutError, httpx.HTTPError) as exc:
        logger.warning(
            f"Failed to fetch starred repositories for {username}: {exc}",
            extra={"structured_data": {"event": "starred_fetch_failed", "username": username}},
        )
        return {
            "username": username,
            "starred_count": 0,
            "topics": [],
            "languages": [],
            "total_starred_analyzed": 0,
        }

    if not isinstance(starred_repos, list):
        return {
            "username": username,
            "starred_count": 0,
            "topics": [],
            "languages": [],
            "total_starred_analyzed": 0,
        }

    topic_counts: Counter[str] = Counter()
    language_counts: Counter[str] = Counter()

    for repo in starred_repos:
        # Collect languages
        lang = repo.get("language")
        if lang and isinstance(lang, str) and lang.strip():
            language_counts[lang.strip()] += 1

        # Collect topics
        topics = repo.get("topics") or []
        for t in topics:
            if isinstance(t, str) and t.strip():
                topic_counts[t.strip().lower()] += 1

    formatted_topics = [
        {"topic": topic, "count": count}
        for topic, count in topic_counts.most_common(20)
    ]
    formatted_languages = [
        {"language": lang, "count": count}
        for lang, count in language_counts.most_common(10)
    ]

    result = {
        "username": username,
        "starred_count": len(starred_repos),
        "topics": formatted_topics,
        "languages": formatted_languages,
        "total_starred_analyzed": len(starred_repos),
    }

    cache.set(cache_key, result, settings.github_cache_ttl)
    return result
