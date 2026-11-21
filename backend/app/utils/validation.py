import re
from urllib.parse import urlparse
from app.exceptions import InvalidUsernameError

GITHUB_USERNAME_REGEX = re.compile(
    r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$"
)

RESERVED_GITHUB_PATHS = {
    "about",
    "account",
    "collections",
    "contact",
    "customer-stories",
    "enterprise",
    "events",
    "explore",
    "features",
    "issues",
    "join",
    "login",
    "marketplace",
    "notifications",
    "organizations",
    "orgs",
    "pricing",
    "pulls",
    "readme",
    "search",
    "security",
    "session",
    "sessions",
    "settings",
    "site",
    "sponsors",
    "team",
    "topics",
    "trending",
}


def parse_github_profile_url(raw_input: str | None) -> tuple[str | None, str | None]:
    """Parse a raw input that may be a plain username or a GitHub profile URL.

    Returns:
        (extracted_username, error_message):
        - If input is a valid profile URL or plain username: (username, None)
        - If input is a repository URL or invalid non-profile URL: (None, error_message)
    """
    if not raw_input:
        return None, "Please enter a GitHub username."

    clean = raw_input.strip()
    if not clean:
        return None, "Please enter a GitHub username."

    lower = clean.lower()
    is_url_like = (
        bool(re.match(r"^https?://", clean, re.I))
        or lower.startswith("www.")
        or "github.com" in lower
    )

    if not is_url_like:
        return clean.lstrip("@"), None

    url_str = clean
    if not re.match(r"^https?://", url_str, re.I):
        url_str = f"https://{url_str}"

    try:
        parsed = urlparse(url_str)
    except Exception:
        return None, "Invalid URL format. Please enter a valid GitHub profile URL or username."

    hostname = (parsed.hostname or "").lower()
    if hostname not in ("github.com", "www.github.com"):
        return None, "Only GitHub profile URLs (github.com/<username>) are supported."

    segments = [s.strip() for s in parsed.path.split("/") if s.strip()]

    if not segments:
        return None, "Please enter a GitHub username or profile URL."

    first_segment = segments[0]
    if first_segment.lower() in RESERVED_GITHUB_PATHS:
        return None, f"The URL path '/{first_segment}' is a reserved GitHub page, not a user profile."

    if len(segments) > 1:
        return None, "Please enter a user profile URL, not a repository URL (e.g. 'github.com/torvalds')."

    return first_segment.lower(), None


def is_valid_github_username(username: str | None) -> bool:
    """Check if a username satisfies GitHub username conventions.

    GitHub username requirements:
    - 1 to 39 characters long.
    - May contain alphanumeric characters or single hyphens.
    - Cannot begin or end with a hyphen.
    - Cannot contain consecutive hyphens.
    """
    if not username:
        return False
    clean = username.strip()
    return bool(GITHUB_USERNAME_REGEX.fullmatch(clean))


def normalize_github_username(username: str | None) -> str:
    """Normalize a GitHub username to its canonical lowercase form, stripping leading @ and whitespace."""
    if not username:
        return ""
    clean = username.strip().lstrip("@")
    return clean.lower()


def validate_github_username(username: str | None) -> str:
    """Validate and return normalized canonical lowercase GitHub username, raising InvalidUsernameError if invalid."""
    if not username:
        raise InvalidUsernameError(username="")

    extracted, error = parse_github_profile_url(username)
    if error:
        raise InvalidUsernameError(username=username, message=error)

    clean = normalize_github_username(extracted)
    if not is_valid_github_username(clean):
        raise InvalidUsernameError(username=clean)
    return clean
