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

    def __init__(self, username: str, message: str | None = None) -> None:
        default_message = (
            f"Invalid GitHub username '{username}'. GitHub usernames must be 1-39 characters, "
            "contain only alphanumeric characters or single hyphens, and cannot start or end with a hyphen."
        )
        super().__init__(
            status_code=400,
            code="INVALID_USERNAME",
            message=message or default_message,
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

