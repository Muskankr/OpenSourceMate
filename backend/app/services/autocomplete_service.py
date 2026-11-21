"""GitHub User Autocomplete service with strict caching, debouncing limits, and rate-limit safety.

Prevents rate limit abuse by:
- Enforcing minimum 3 characters before querying external API.
- Caching results for quick repeated keystrokes.
- Returning light metadata (username, avatar_url).
"""

from typing import Any
import httpx

from app.cache import TTLCache
from app.config import get_settings
from app.services.github_service import (
    GITHUB_API_URL,
    GitHubRateLimitError,
    GitHubTimeoutError,
    github_get,
)
from app.utils.logging import get_logger

logger = get_logger("app.services.autocomplete")

# In-memory autocomplete cache with short TTL (e.g. 10 minutes)
autocomplete_cache = TTLCache(max_entries=500)


async def autocomplete_github_users(
    query: str,
    limit: int = 5,
    refresh: bool = False,
) -> list[dict[str, Any]]:
    """Search GitHub users matching query string.

    Requires at least 3 characters.
    Caps return items to `limit` (max 10).
    """
    clean_q = (query or "").strip()
    if len(clean_q) < 3:
        return []

    effective_limit = min(max(1, limit), 10)
    cache_key = f"github:autocomplete:{clean_q.lower()}:{effective_limit}"

    if not refresh:
        cached = autocomplete_cache.get(cache_key)
        if cached is not None:
            return cached

    url = f"{GITHUB_API_URL}/search/users"
    params = {"q": f"{clean_q} in:login", "per_page": effective_limit}

    try:
        response = await github_get(url, params=params)
        if response.status_code == 404:
            return []
        response.raise_for_status()
        data = response.json()
        items = data.get("items", []) if isinstance(data, dict) else []
    except (GitHubRateLimitError, GitHubTimeoutError, httpx.HTTPError) as exc:
        logger.warning(
            f"Autocomplete query '{clean_q}' failed: {exc}",
            extra={"structured_data": {"event": "autocomplete_error", "query": clean_q}},
        )
        return []

    results: list[dict[str, Any]] = []
    for item in items[:effective_limit]:
        if isinstance(item, dict) and item.get("login"):
            results.append({
                "username": item["login"],
                "avatar_url": item.get("avatar_url", ""),
                "profile_url": item.get("html_url", ""),
            })

    # Cache response for 10 minutes (600 seconds)
    autocomplete_cache.set(cache_key, results, 600)
    return results
