from typing import Any


class APIException(Exception):
    """Base exception for application-specific API errors."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class InvalidUsernameError(APIException):
    """Raised when a GitHub username fails validation rules."""

    def __init__(self, username: str) -> None:
        super().__init__(
            status_code=400,
            code="INVALID_USERNAME",
            message=(
                f"Invalid GitHub username '{username}'. GitHub usernames must be 1-39 characters, "
                "contain only alphanumeric characters or single hyphens, and cannot start or end with a hyphen."
            ),
            details={"username": username},
        )


class NotFoundError(APIException):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found", details: Any = None) -> None:
        super().__init__(
            status_code=404,
            code="NOT_FOUND",
            message=message,
            details=details,
        )


class UserNotFoundError(NotFoundError):
    """Raised when a requested GitHub user does not exist."""

    def __init__(self, username: str = "", message: str | None = None) -> None:
        msg = message or (f"GitHub user '{username}' could not be found." if username else "GitHub user not found")
        super().__init__(
            message=msg,
            details={"username": username, "error_type": "user_not_found"} if username else None,
        )
        self.code = "USER_NOT_FOUND"


class NoPublicRepositoriesError(APIException):
    """Raised when a GitHub user has no public repositories or only forks to analyze."""

    def __init__(self, username: str, only_forks: bool = False) -> None:
        code = "ONLY_FORKS" if only_forks else "NO_PUBLIC_REPOSITORIES"
        message = (
            f"GitHub user '{username}' only has forked repositories."
            if only_forks
            else f"GitHub user '{username}' has no public repositories to analyze."
        )
        super().__init__(
            status_code=422,
            code=code,
            message=message,
            details={
                "username": username,
                "only_forks": only_forks,
                "error_type": "only_forks" if only_forks else "no_public_repositories",
            },
        )


class UpstreamFailureError(APIException):
    """Raised when an upstream external dependency (GitHub API) fails, times out, or returns 5xx."""

    def __init__(
        self,
        message: str = "Upstream GitHub service is temporarily unavailable or returned a server error.",
        details: Any = None,
        status_code: int = 502,
        code: str = "UPSTREAM_FAILURE",
    ) -> None:
        super().__init__(
            status_code=status_code,
            code=code,
            message=message,
            details=details,
        )


class RateLimitExceededError(APIException):
    """Raised when GitHub or internal rate limits are exceeded."""

    def __init__(
        self,
        message: str = "GitHub rate limit reached. Please try again later.",
        reset_at: str | None = None,
    ) -> None:
        super().__init__(
            status_code=429,
            code="RATE_LIMIT_EXCEEDED",
            message=message,
            details={"reset_at": reset_at} if reset_at else None,
        )


class OrganizationAccountError(APIException):
    """Raised when the username belongs to an organization rather than a personal user account."""

    def __init__(self, username: str) -> None:
        super().__init__(
            status_code=422,
            code="ORGANIZATION_ACCOUNT",
            message=f"'{username}' is an organization account. Please enter a personal developer username.",
            details={"username": username, "account_type": "Organization"},
        )


class SuspendedAccountError(APIException):
    """Raised when the account is suspended or blocked by GitHub."""

    def __init__(self, username: str) -> None:
        super().__init__(
            status_code=403,
            code="ACCOUNT_SUSPENDED",
            message=f"The account '{username}' has been suspended or unavailable on GitHub.",
            details={"username": username},
        )


class RenamedAccountError(APIException):
    """Raised when the user account has been renamed on GitHub (moved via 301/302 redirect)."""

    def __init__(self, old_username: str, new_username: str) -> None:
        super().__init__(
            status_code=301,
            code="ACCOUNT_RENAMED",
            message=f"User '{old_username}' has been renamed to '{new_username}'. Please use '{new_username}'.",
            details={"old_username": old_username, "new_username": new_username},
        )

