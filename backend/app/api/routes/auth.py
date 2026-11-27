import secrets
from urllib.parse import urlencode
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
import httpx

from app.config import get_settings
from app.services.auth_service import (
    COOKIE_NAME,
    create_session_token,
    read_session_token,
    get_current_user_token,
)
from app.utils.logging import get_logger

logger = get_logger("app.api.routes.auth")

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login", summary="Initiate GitHub OAuth sign-in with public_repo / minimal read-only scope (Issue #482)")
async def github_login(request: Request):
    """Redirects user to GitHub's OAuth authorization page.
    Uses empty or read-only public scope to protect user privacy.
    """
    settings = get_settings()
    client_id = settings.github_client_id

    if not client_id:
        raise HTTPException(
            status_code=503,
            detail="GitHub OAuth is not configured on this server.",
        )

    # Generate a random state for CSRF protection
    state = secrets.token_urlsafe(16)
    redirect_uri = settings.oauth_redirect_uri

    params = {
        "client_id": client_id,
        "state": state,
        "scope": "read:user",  # Minimal scope: public user data only, NO repository or private data access
    }
    if redirect_uri:
        params["redirect_uri"] = redirect_uri

    github_auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    response = RedirectResponse(url=github_auth_url, status_code=307)
    # Store state in short-lived cookie for verification
    response.set_cookie(
        key="osm_oauth_state",
        value=state,
        max_age=600,
        httponly=True,
        samesite="lax",
        secure=settings.environment == "production",
    )
    return response


@router.get("/callback", summary="GitHub OAuth callback handler (Issue #482)")
async def github_callback(
    request: Request,
    response: Response,
    code: str = Query(..., description="OAuth code from GitHub"),
    state: str = Query(..., description="OAuth state from GitHub"),
    osm_oauth_state: str | None = Cookie(default=None),
):
    """Exchanges OAuth code for user access token and sets an encrypted HttpOnly session cookie."""
    settings = get_settings()
    client_id = settings.github_client_id
    client_secret = settings.github_client_secret

    if not client_id or not client_secret:
        raise HTTPException(status_code=503, detail="OAuth credentials not configured.")

    if not osm_oauth_state or state != osm_oauth_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state parameter.")

    # Exchange code for GitHub access token
    token_url = "https://github.com/login/oauth/access_token"
    token_data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
    }
    headers = {"Accept": "application/json"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        token_res = await client.post(token_url, data=token_data, headers=headers)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange OAuth code.")
        token_json = token_res.json()

    access_token = token_json.get("access_token")
    if not access_token:
        error_msg = token_json.get("error_description") or "Access token not received from GitHub."
        raise HTTPException(status_code=400, detail=error_msg)

    # Fetch basic user info using the token (never log token)
    user_info = {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        user_res = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        if user_res.status_code == 200:
            user_info = user_res.json()

    username = user_info.get("login") or "anonymous"
    avatar_url = user_info.get("avatar_url") or ""

    # Build encrypted session cookie
    session_data = {
        "token": access_token,
        "username": username,
        "avatar_url": avatar_url,
    }
    session_token = create_session_token(session_data, max_age_seconds=settings.oauth_session_max_age_seconds)

    frontend_redirect = f"{settings.frontend_url}/?signed_in=true"
    redirect_resp = RedirectResponse(url=frontend_redirect, status_code=303)
    redirect_resp.delete_cookie("osm_oauth_state")
    redirect_resp.set_cookie(
        key=COOKIE_NAME,
        value=session_token,
        max_age=settings.oauth_session_max_age_seconds,
        httponly=True,
        samesite="lax",
        secure=settings.environment == "production",
        path="/",
    )
    return redirect_resp


@router.get("/me", summary="Get current signed-in user status (Issue #482)")
async def get_current_user_status(request: Request):
    """Returns whether visitor is signed in and non-sensitive profile info.
    Access token is NEVER returned.
    """
    raw_cookie = request.cookies.get(COOKIE_NAME)
    session = read_session_token(raw_cookie) if raw_cookie else None

    if not session or not session.get("token"):
        return {
            "authenticated": False,
            "username": None,
            "avatar_url": None,
            "using_visitor_token": False,
        }

    return {
        "authenticated": True,
        "username": session.get("username"),
        "avatar_url": session.get("avatar_url"),
        "using_visitor_token": True,
    }


@router.post("/logout", summary="Sign out and clear session cookie (Issue #482)")
async def logout(response: Response):
    """Clears the HttpOnly session cookie to revoke local authentication."""
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"message": "Signed out successfully", "authenticated": False}
