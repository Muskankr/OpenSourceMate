import re
from urllib.parse import urlparse
from fastapi import HTTPException
from app.exceptions import InvalidUsernameError

GITHUB_USERNAME_REGEX = re.compile(
    r"^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$"
)

SKILL_REGEX = re.compile(r"^[a-zA-Z0-9+#.\- ]{1,50}$")

REPO_SLUG_REGEX = re.compile(r"^[a-zA-Z0-9_.\-]+/[a-zA-Z0-9_.\-]+$")

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


def is_valid_skill(skill: str | None) -> bool:
    """Check if skill string satisfies validation rules (1-50 chars, alphanumeric and + # . - space)."""
    if not skill or not isinstance(skill, str):
        return False
    clean = skill.strip()
    return bool(SKILL_REGEX.fullmatch(clean))


def validate_skill(skill: str | None) -> str:
    """Validate and sanitize a single skill string, raising HTTPException(400) if invalid."""
    if not skill or not isinstance(skill, str):
        raise HTTPException(
            status_code=400,
            detail="Skill name cannot be empty.",
        )
    clean = skill.strip()
    if not is_valid_skill(clean):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid skill '{clean}'. Skills must be 1-50 characters containing letters, numbers, and allowed symbols (+, #, ., -, space).",
        )
    return clean


def sanitize_text_input(text: str | None, max_length: int = 100) -> str | None:
    """Sanitize arbitrary text input, stripping null bytes, control characters, and bounding length."""
    if text is None:
        return None
    # Strip null bytes and control chars except standard whitespace
    cleaned = "".join(c for c in text if ord(c) >= 32 or c in ("\t", "\n", "\r"))
    cleaned = cleaned.strip()
    return cleaned[:max_length]


def validate_query_param(
    value: str | None,
    name: str = "parameter",
    max_length: int = 100,
    allowed_pattern: str | None = None,
) -> str | None:
    """Validate query parameter against maximum length, illegal control characters, and regex pattern.
    
    Raises HTTPException(400) on validation failure.
    """
    if value is None:
        return None
    clean = value.strip()
    if not clean:
        return ""
    if len(clean) > max_length:
        raise HTTPException(
            status_code=400,
            detail=f"Query parameter '{name}' exceeds maximum allowed length of {max_length} characters.",
        )
    # Check for null bytes or illegal control characters
    if any(ord(c) < 32 and c not in ("\t", "\n", "\r") for c in clean):
        raise HTTPException(
            status_code=400,
            detail=f"Query parameter '{name}' contains illegal control characters.",
        )
    if allowed_pattern and not re.match(allowed_pattern, clean):
        raise HTTPException(
            status_code=400,
            detail=f"Query parameter '{name}' contains invalid characters.",
        )
    return clean


def validate_limit(limit: int, min_val: int = 1, max_val: int = 100, name: str = "limit") -> int:
    """Validate integer bounds, raising HTTPException(400) if out of range."""
    if limit < min_val or limit > max_val:
        raise HTTPException(
            status_code=400,
            detail=f"Query parameter '{name}' must be between {min_val} and {max_val}.",
        )
    return limit


def validate_repo_slug(repo: str | None) -> str:
    """Validate and clean repository slug (e.g. 'owner/repo' or GitHub repository URL)."""
    if not repo or not repo.strip():
        raise HTTPException(
            status_code=400,
            detail="Repository parameter cannot be empty.",
        )
    clean = repo.strip()
    if "github.com/" in clean:
        parts = clean.split("github.com/")[-1].strip("/").split("/")
        if len(parts) >= 2:
            clean = f"{parts[0]}/{parts[1]}"
    if not REPO_SLUG_REGEX.fullmatch(clean):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid repository slug '{clean}'. Expected 'owner/repo' format.",
        )
    return clean

