"""Optional GitHub OAuth sign-in routes (Issue #437).

Provides:
- GET  /auth/github/login     -> Redirects to GitHub OAuth with minimum read-only scope (read:user)
- GET  /auth/github/callback  -> Exchanges code for token, stores token server-side, sets HttpOnly cookie
- GET  /auth/session          -> Returns public sign-in status (never exposes token)
- POST /auth/logout           -> Ends the server-side session and clears the cookie
"""

from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
import httpx

from app.config import get_settings
from app.schemas.serializers import AuthLogoutSerializer, AuthSessionSerializer
from app.services.session_service import SESSION_COOKIE_NAME, session_store
from app.utils.logging import get_logger

logger = get_logger("app.api.auth")

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)

GITHUB_OAUTH_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_API_URL = "https://api.github.com/user"
MINIMUM_READ_ONLY_SCOPE = "read:user"


@router.get(
    "/github/login",
    summary="Start optional GitHub OAuth sign-in (read-only scope)",
)
async def github_oauth_login():
    settings = get_settings()
    if not settings.github_oauth_client_id or not settings.github_oauth_client_secret:
        raise HTTPException(
            status_code=503,
            detail="GitHub OAuth sign-in is not configured on this server.",
        )

    state = session_store.create_oauth_state()
    params = urlencode(
        {
            "client_id": settings.github_oauth_client_id,
            "redirect_uri": settings.github_oauth_redirect_uri,
            "scope": MINIMUM_READ_ONLY_SCOPE,
            "state": state,
        }
    )
    return RedirectResponse(
        url=f"{GITHUB_OAUTH_AUTHORIZE_URL}?{params}",
        status_code=302,
    )


@router.get(
    "/github/callback",
    summary="Handle GitHub OAuth callback and create server-side session",
)
async def github_oauth_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
):
    settings = get_settings()

    if error:
        logger.info("GitHub OAuth sign-in cancelled or denied by user")
        return RedirectResponse(
            url=f"{settings.frontend_url.rstrip('/')}/?auth=cancelled",
            status_code=302,
        )

    if not code or not session_store.consume_oauth_state(state):
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth state.",
        )

    if not settings.github_oauth_client_id or not settings.github_oauth_client_secret:
        raise HTTPException(
            status_code=503,
            detail="GitHub OAuth sign-in is not configured on this server.",
        )

    async with httpx.AsyncClient(timeout=10.0) as client:
        token_resp = await client.post(
            GITHUB_OAUTH_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_oauth_client_id,
                "client_secret": settings.github_oauth_client_secret,
                "code": code,
                "redirect_uri": settings.github_oauth_redirect_uri,
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Failed to exchange GitHub OAuth authorization code.",
            )

        token_payload = token_resp.json()
        access_token = token_payload.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="GitHub OAuth response did not include an access token.",
            )

        user_resp = await client.get(
            GITHUB_USER_API_URL,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {access_token}",
            },
        )
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Failed to fetch signed-in GitHub user profile.",
            )
        user_data = user_resp.json()

    username = user_data.get("login")
    if not username:
        raise HTTPException(
            status_code=502,
            detail="GitHub user profile did not include a username.",
        )

    session_id = session_store.create_session(
        access_token=access_token,
        username=username,
        avatar_url=user_data.get("avatar_url"),
        ttl_seconds=settings.oauth_session_ttl_seconds,
    )

    logger.info(
        "Created server-side GitHub OAuth session",
        extra={"structured_data": {"event": "oauth_session_created", "username": username}},
    )

    redirect_response = RedirectResponse(
        url=f"{settings.frontend_url.rstrip('/')}/?auth=signed_in",
        status_code=302,
    )
    redirect_response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=settings.environment.lower() == "production",
        max_age=settings.oauth_session_ttl_seconds,
        path="/",
    )
    return redirect_response


@router.get(
    "/session",
    response_model=AuthSessionSerializer,
    summary="Get current optional GitHub OAuth sign-in status",
)
async def get_auth_session(request: Request):
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get_session(session_id)
    if session is None:
        return {"authenticated": False, "username": None, "avatar_url": None}

    return {
        "authenticated": True,
        "username": session.username,
        "avatar_url": session.avatar_url,
    }


@router.post(
    "/logout",
    response_model=AuthLogoutSerializer,
    summary="Sign out and end server-side OAuth session",
)
async def github_oauth_logout(request: Request, response: Response):
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session_store.delete_session(session_id)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    return {"authenticated": False, "signed_out": True}
