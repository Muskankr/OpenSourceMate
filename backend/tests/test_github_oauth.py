import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import parse_qs, urlparse

from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

# Ensure backend/ is importable when invoked from repo root
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api.routes.auth import router as auth_router
from app.api.routes.github import router as github_router
from app.cache import cache
from app.config import get_settings
from app.services.session_service import (
    SESSION_COOKIE_NAME,
    OAuthSession,
    reset_current_user_token,
    session_store,
    set_current_user_token,
)

# Minimal FastAPI app mirroring main.py's OAuth middleware and routers
test_app = FastAPI()


@test_app.middleware("http")
async def _oauth_middleware(request: Request, call_next):
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = session_store.get_session(session_id)
    ctx_token = set_current_user_token(session.access_token if session else None)
    try:
        return await call_next(request)
    finally:
        reset_current_user_token(ctx_token)


test_app.include_router(auth_router, prefix="/api")
test_app.include_router(github_router, prefix="/api")


class FakeHttpxResponse:
    def __init__(self, status_code: int, payload: dict, headers: dict | None = None):
        self.status_code = status_code
        self._payload = payload
        self.headers = headers or {}
        self.text = str(payload)

    def json(self):
        return self._payload

    def raise_for_status(self):
        return None


class GitHubOAuthTests(unittest.TestCase):
    def setUp(self):
        session_store.clear()
        cache.clear()
        self.client = TestClient(test_app)

    def tearDown(self):
        session_store.clear()
        cache.clear()

    def test_oauth_session_repr_redacts_access_token(self):
        session = OAuthSession(
            username="octocat",
            access_token="gho_super_secret_token_12345",
            expires_at=9999999999.0,
        )
        rendered = repr(session)
        self.assertNotIn("gho_super_secret_token_12345", rendered)
        self.assertIn("[REDACTED]", rendered)

    def test_unauthenticated_session_works_and_returns_false(self):
        res = self.client.get("/api/auth/session")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            res.json(),
            {"authenticated": False, "username": None, "avatar_url": None},
        )

    def test_login_returns_503_when_oauth_not_configured(self):
        settings = get_settings()
        with patch.object(settings, "github_oauth_client_id", None):
            res = self.client.get("/api/auth/github/login", follow_redirects=False)
            self.assertEqual(res.status_code, 503)

    def test_login_redirects_with_minimum_read_only_scope(self):
        settings = get_settings()
        with (
            patch.object(settings, "github_oauth_client_id", "test-client-id"),
            patch.object(settings, "github_oauth_client_secret", "test-client-secret"),
        ):
            res = self.client.get("/api/auth/github/login", follow_redirects=False)
            self.assertEqual(res.status_code, 302)
            location = res.headers["location"]
            parsed = urlparse(location)
            qs = parse_qs(parsed.query)
            self.assertEqual(parsed.netloc, "github.com")
            self.assertEqual(parsed.path, "/login/oauth/authorize")
            self.assertEqual(qs["scope"], ["read:user"])
            self.assertEqual(qs["client_id"], ["test-client-id"])
            self.assertTrue(qs["state"][0])

    def test_callback_rejects_invalid_state(self):
        res = self.client.get(
            "/api/auth/github/callback?code=abc&state=invalid-state",
            follow_redirects=False,
        )
        self.assertEqual(res.status_code, 400)

    def test_full_oauth_flow_uses_user_token_and_logout_ends_session(self):
        settings = get_settings()
        secret_token = "gho_user_secret_token_999"

        with (
            patch.object(settings, "github_oauth_client_id", "test-client-id"),
            patch.object(settings, "github_oauth_client_secret", "test-client-secret"),
            patch.object(settings, "frontend_url", "http://localhost:3000"),
        ):
            # 1. Start login to obtain valid CSRF state
            login_res = self.client.get("/api/auth/github/login", follow_redirects=False)
            state = parse_qs(urlparse(login_res.headers["location"]).query)["state"][0]

            # 2. Mock token exchange + /user lookup in callback
            mock_async_client = MagicMock()
            mock_async_client.__aenter__ = AsyncMock(return_value=mock_async_client)
            mock_async_client.__aexit__ = AsyncMock(return_value=False)
            mock_async_client.post = AsyncMock(
                return_value=FakeHttpxResponse(200, {"access_token": secret_token})
            )
            mock_async_client.get = AsyncMock(
                return_value=FakeHttpxResponse(
                    200,
                    {"login": "octocat", "avatar_url": "https://avatars.githubusercontent.com/u/1"},
                )
            )

            with patch("app.api.routes.auth.httpx.AsyncClient", return_value=mock_async_client):
                cb_res = self.client.get(
                    f"/api/auth/github/callback?code=valid_code&state={state}",
                    follow_redirects=False,
                )

            self.assertEqual(cb_res.status_code, 302)
            self.assertNotIn(secret_token, cb_res.headers["location"])
            set_cookie_header = cb_res.headers.get("set-cookie", "")
            self.assertIn(f"{SESSION_COOKIE_NAME}=", set_cookie_header)
            self.assertIn("HttpOnly", set_cookie_header)

            # 3. Verify /api/auth/session returns user info WITHOUT exposing any token
            sess_res = self.client.get("/api/auth/session")
            self.assertEqual(sess_res.status_code, 200)
            sess_json = sess_res.json()
            self.assertTrue(sess_json["authenticated"])
            self.assertEqual(sess_json["username"], "octocat")
            self.assertNotIn("access_token", sess_json)
            self.assertNotIn(secret_token, sess_res.text)

            # 4. Verify outgoing GitHub API call uses the signed-in user's token
            captured_headers: list[dict] = []

            async def fake_client_get(url, params=None, headers=None):
                captured_headers.append(dict(headers or {}))
                return FakeHttpxResponse(
                    200,
                    {
                        "login": "torvalds",
                        "avatar_url": "https://avatars.githubusercontent.com/u/1024025",
                        "html_url": "https://github.com/torvalds",
                        "public_repos": 10,
                        "followers": 100,
                        "following": 0,
                    },
                )

            mock_gh_client = MagicMock()
            mock_gh_client.get = AsyncMock(side_effect=fake_client_get)

            with patch("app.services.github_service.get_client", return_value=mock_gh_client):
                user_res = self.client.get("/api/github/users/torvalds")
                self.assertEqual(user_res.status_code, 200)

            self.assertEqual(len(captured_headers), 1)
            self.assertEqual(captured_headers[0].get("Authorization"), f"Bearer {secret_token}")

            # 5. Sign out ends the server-side session
            logout_res = self.client.post("/api/auth/logout")
            self.assertEqual(logout_res.status_code, 200)
            self.assertEqual(
                logout_res.json(),
                {"authenticated": False, "signed_out": True},
            )

            sess_after = self.client.get("/api/auth/session")
            self.assertFalse(sess_after.json()["authenticated"])

            # 6. Subsequent unauthenticated requests still work without user token
            captured_headers.clear()
            cache.clear()
            with patch("app.services.github_service.get_client", return_value=mock_gh_client):
                anon_res = self.client.get("/api/github/users/torvalds")
                self.assertEqual(anon_res.status_code, 200)
            self.assertNotIn("Authorization", captured_headers[0])


if __name__ == "__main__":
    unittest.main()
