from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.services.auth_service import COOKIE_NAME, read_session_token, set_current_user_token


class UserTokenContextMiddleware(BaseHTTPMiddleware):
    """Middleware that inspects the HttpOnly session cookie, decrypts the visitor's GitHub OAuth token,
    and binds it to the current request ContextVar so outgoing GitHub calls use the visitor's quota (Issue #482).
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        cookie_val = request.cookies.get(COOKIE_NAME)
        token = None

        if cookie_val:
            session = read_session_token(cookie_val)
            if session and isinstance(session, dict):
                token = session.get("token")

        # Set token in request ContextVar (None if anonymous)
        set_current_user_token(token)

        try:
            response = await call_next(request)
            return response
        finally:
            set_current_user_token(None)
