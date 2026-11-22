"""HTTP API Client for OpenSourceMate backend."""

import json
import re
import socket
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$")


class OsmCliError(Exception):
    """Base exception for OpenSourceMate CLI errors."""
    pass


class UserNotFoundError(OsmCliError):
    """Raised when the target GitHub user does not exist."""
    pass


class ApiConnectionError(OsmCliError):
    """Raised when unable to reach the OpenSourceMate API server."""
    pass


class ApiRequestError(OsmCliError):
    """Raised when the OpenSourceMate API returns an error response."""
    pass


def validate_username(username: str) -> str:
    """Validate GitHub username syntax according to GitHub constraints.

    - 1 to 39 characters.
    - Alphanumeric characters or single hyphens.
    - Cannot begin or end with a hyphen.
    """
    clean = username.strip()
    if not clean:
        raise ValueError("GitHub username cannot be empty.")
    if not USERNAME_REGEX.match(clean):
        raise ValueError(
            f"Invalid GitHub username '{clean}'. "
            "Usernames must be 1-39 characters, contain only alphanumeric characters or single hyphens, "
            "and cannot begin or end with a hyphen."
        )
    return clean


def fetch_user_skills(
    username: str,
    api_url: str = "http://localhost:8000",
    refresh: bool = False,
    timeout: float = 15.0,
) -> dict[str, Any]:
    """Fetch user technical skills from the OpenSourceMate API.

    Args:
        username: Target GitHub username.
        api_url: OpenSourceMate backend base URL.
        refresh: Whether to force cache bypass.
        timeout: Network timeout in seconds.

    Returns:
        Dict containing analyzed technical skills and metadata.

    Raises:
        ValueError: If username is invalid.
        UserNotFoundError: If user not found (HTTP 404).
        ApiConnectionError: If server is unreachable.
        ApiRequestError: On HTTP error codes (e.g. 500, 429).
    """
    valid_user = validate_username(username)
    base = api_url.rstrip("/")

    # Construct request URL with query parameters
    params = urllib.parse.urlencode({
        "refresh": str(refresh).lower(),
        "include_proficiency": "true",
        "ignore_noise": "true",
    })

    # Try standard /api/v1 prefix, fallback to /github if not under /api/v1
    endpoints = [
        f"{base}/api/v1/github/users/{valid_user}/skills?{params}",
        f"{base}/github/users/{valid_user}/skills?{params}",
    ]

    last_error = None

    for url in endpoints:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "OpenSourceMate-CLI/0.1.0",
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                payload = response.read().decode("utf-8")
                return json.loads(payload)
        except urllib.error.HTTPError as e:
            last_error = e
            if e.code == 404:
                # If /api/v1/ was 404, we try the second endpoint
                if url == endpoints[0]:
                    continue
                # Both returned 404 -> User not found
                detail = extract_error_detail(e)
                raise UserNotFoundError(f"GitHub user '{valid_user}' was not found. ({detail})") from e
            elif e.code == 429:
                raise ApiRequestError(
                    "GitHub API rate limit exceeded. "
                    "Set GITHUB_TOKEN on the backend server or wait before querying again."
                ) from e
            else:
                detail = extract_error_detail(e)
                raise ApiRequestError(f"API request failed with HTTP {e.code}: {detail}") from e
        except (urllib.error.URLError, socket.gaierror, ConnectionRefusedError, OSError) as e:
            raise ApiConnectionError(
                f"Could not connect to OpenSourceMate API at '{base}'.\n"
                "Troubleshooting:\n"
                "  1. Verify that the backend server is running (e.g. 'uvicorn app.main:app --port 8000').\n"
                "  2. If using a custom URL, pass '--api-url <url>' or set the OSM_API_URL environment variable."
            ) from e
        except (socket.timeout, TimeoutError) as e:
            raise ApiConnectionError(
                f"Request to OpenSourceMate API at '{base}' timed out after {timeout} seconds."
            ) from e

    if last_error:
        detail = extract_error_detail(last_error)
        raise UserNotFoundError(f"GitHub user '{valid_user}' was not found. ({detail})")

    raise ApiRequestError("Failed to retrieve skills from OpenSourceMate API.")


def extract_error_detail(http_error: urllib.error.HTTPError) -> str:
    """Safely extract error message detail from HTTP error body."""
    try:
        raw = http_error.read().decode("utf-8")
        data = json.loads(raw)
        if isinstance(data, dict):
            return data.get("detail") or data.get("message") or raw[:200]
        return str(data)
    except Exception:
        return http_error.reason or f"HTTP {http_error.code}"
