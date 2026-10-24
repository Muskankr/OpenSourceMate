import time
from datetime import datetime, timezone

import httpx

from app.cache import TTLCache
from app.config import get_settings


GITHUB_API_URL = "https://api.github.com"

cache = TTLCache()

_client: httpx.AsyncClient | None = None


class GitHubRateLimitError(Exception):
    """Raised when GitHub says we are out of API requests."""

    def __init__(self, reset_at: datetime | None = None):
        self.reset_at = reset_at
        super().__init__("GitHub API rate limit reached")


def get_client() -> httpx.AsyncClient:
    global _client

    if _client is None:
        headers = {"Accept": "application/vnd.github+json"}
        token = get_settings().github_token

        if token:
            headers["Authorization"] = f"Bearer {token}"

        _client = httpx.AsyncClient(headers=headers, timeout=15.0)

    return _client


async def close_client() -> None:
    global _client

    if _client is not None:
        await _client.aclose()
        _client = None


def _rate_limit_reset(response: httpx.Response) -> datetime | None:
    reset = response.headers.get("X-RateLimit-Reset")

    if reset and reset.isdigit():
        return datetime.fromtimestamp(int(reset), tz=timezone.utc)

    # Secondary rate limits only send Retry-After (in seconds).
    retry_after = response.headers.get("Retry-After")

    if retry_after and retry_after.isdigit():
        return datetime.fromtimestamp(
            time.time() + int(retry_after), tz=timezone.utc
        )

    return None


def _is_rate_limited(response: httpx.Response) -> bool:
    if response.status_code == 429:
        return True

    return (
        response.status_code == 403
        and response.headers.get("X-RateLimit-Remaining") == "0"
    )


async def github_get(url: str, params: dict | None = None) -> httpx.Response:
    """GET a GitHub API url with the shared client.

    Raises GitHubRateLimitError when GitHub reports the rate limit is hit.
    """
    response = await get_client().get(url, params=params)

    if _is_rate_limited(response):
        raise GitHubRateLimitError(_rate_limit_reset(response))

    return response


async def get_github_user(username: str):
    key = f"github:user:{username.lower()}"
    cached = cache.get(key)

    if cached is not None:
        return cached

    response = await github_get(f"{GITHUB_API_URL}/users/{username}")

    if response.status_code == 404:
        return None

    response.raise_for_status()

    user = response.json()
    cache.set(key, user, get_settings().github_cache_ttl)

    return user


async def get_user_repositories(username: str):
    key = f"github:repos:{username.lower()}"
    cached = cache.get(key)

    if cached is not None:
        return cached

    params = {
        "per_page": 100,
        "sort": "updated",
    }

    response = await github_get(
        f"{GITHUB_API_URL}/users/{username}/repos", params=params
    )

    if response.status_code == 404:
        return None

    response.raise_for_status()

    repositories = response.json()
    cache.set(key, repositories, get_settings().github_cache_ttl)

    return repositories
