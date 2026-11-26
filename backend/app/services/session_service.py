"""Server-side OAuth session store and per-request token context (Issue #437).

Keeps GitHub OAuth access tokens strictly in server-side memory, keyed by an
opaque HttpOnly session cookie. Tokens are never returned in API responses,
stored in browser storage, or written to logs.
"""

from contextvars import ContextVar, Token
from dataclasses import dataclass
import secrets
import time

SESSION_COOKIE_NAME = "osm_session"

_current_user_token: ContextVar[str | None] = ContextVar(
    "github_user_token", default=None
)


def get_current_user_token() -> str | None:
    """Return the GitHub OAuth token bound to the current request, if any."""
    return _current_user_token.get()


def set_current_user_token(token: str | None) -> Token[str | None]:
    """Bind a GitHub OAuth token to the current request context."""
    return _current_user_token.set(token)


def reset_current_user_token(ctx_token: Token[str | None]) -> None:
    """Reset the request-scoped GitHub OAuth token context."""
    _current_user_token.reset(ctx_token)


@dataclass
class OAuthSession:
    """Server-side representation of a signed-in user's GitHub OAuth session."""

    username: str
    access_token: str
    expires_at: float
    avatar_url: str | None = None

    def __repr__(self) -> str:
        # Ensure the access token can never appear in logs or tracebacks
        return (
            f"OAuthSession(username={self.username!r}, "
            f"access_token='[REDACTED]', expires_at={self.expires_at})"
        )


class ServerSessionStore:
    """In-memory server-side store for OAuth sessions and CSRF state nonces."""

    def __init__(self, max_sessions: int = 5000):
        self._max_sessions = max_sessions
        self._sessions: dict[str, OAuthSession] = {}
        self._states: dict[str, float] = {}

    def create_oauth_state(self, ttl_seconds: int = 600) -> str:
        """Create a short-lived CSRF state token for OAuth authorization."""
        self._prune_states()
        state = secrets.token_urlsafe(24)
        self._states[state] = time.monotonic() + ttl_seconds
        return state

    def consume_oauth_state(self, state: str | None) -> bool:
        """Validate and consume a one-time OAuth CSRF state token."""
        if not state:
            return False
        expires_at = self._states.pop(state, None)
        if expires_at is None:
            return False
        return expires_at > time.monotonic()

    def create_session(
        self,
        access_token: str,
        username: str,
        avatar_url: str | None = None,
        ttl_seconds: int = 86400,
    ) -> str:
        """Create a new server-side session and return its opaque session ID."""
        self._prune_sessions()
        if len(self._sessions) >= self._max_sessions:
            oldest_key = min(self._sessions, key=lambda k: self._sessions[k].expires_at)
            del self._sessions[oldest_key]

        session_id = secrets.token_urlsafe(32)
        self._sessions[session_id] = OAuthSession(
            username=username,
            access_token=access_token,
            avatar_url=avatar_url,
            expires_at=time.monotonic() + max(60, ttl_seconds),
        )
        return session_id

    def get_session(self, session_id: str | None) -> OAuthSession | None:
        """Retrieve an active session by ID, or None if missing/expired."""
        if not session_id:
            return None
        session = self._sessions.get(session_id)
        if session is None:
            return None
        if session.expires_at <= time.monotonic():
            del self._sessions[session_id]
            return None
        return session

    def delete_session(self, session_id: str | None) -> bool:
        """End a server-side session."""
        if not session_id:
            return False
        return self._sessions.pop(session_id, None) is not None

    def clear(self) -> None:
        self._sessions.clear()
        self._states.clear()

    def _prune_sessions(self) -> None:
        now = time.monotonic()
        expired = [k for k, v in self._sessions.items() if v.expires_at <= now]
        for k in expired:
            del self._sessions[k]

    def _prune_states(self) -> None:
        now = time.monotonic()
        expired = [k for k, exp in self._states.items() if exp <= now]
        for k in expired:
            del self._states[k]


session_store = ServerSessionStore()
