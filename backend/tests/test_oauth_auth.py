import os
import json
import base64
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.config import get_settings
from app.services.auth_service import (
    create_session_token,
    read_session_token,
    get_current_user_token,
    set_current_user_token,
)


class TestOAuthAuth(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_session_token_encryption_and_decryption(self):
        token = "gho_test_user_token_123456789"
        username = "octocat"
        avatar = "https://avatars.githubusercontent.com/u/583231"

        payload = {"token": token, "username": username, "avatar_url": avatar}
        session_str = create_session_token(payload, max_age_seconds=3600)
        self.assertIsInstance(session_str, str)
        # Verify raw token is not visible in plaintext
        self.assertNotIn(token, session_str)

        decrypted = read_session_token(session_str)
        self.assertIsNotNone(decrypted)
        self.assertEqual(decrypted["token"], token)
        self.assertEqual(decrypted["username"], username)
        self.assertEqual(decrypted["avatar_url"], avatar)

    def test_session_token_tampered_fails(self):
        payload = {"token": "gho_test_token", "username": "alice"}
        session_str = create_session_token(payload)
        # Tamper session string
        tampered = session_str[:-4] + "abcd"
        decrypted = read_session_token(tampered)
        self.assertIsNone(decrypted)

    def test_session_token_expired_fails(self):
        payload = {"token": "gho_test_token", "username": "bob"}
        # Negative max age means it's expired immediately
        session_str = create_session_token(payload, max_age_seconds=-10)
        decrypted = read_session_token(session_str)
        self.assertIsNone(decrypted)

    def test_login_redirect_generates_state(self):
        settings = get_settings()
        with patch.object(settings, "github_client_id", "test_client_id"):
            response = self.client.get("/api/v1/auth/login", follow_redirects=False)
            self.assertEqual(response.status_code, 307)
            location = response.headers.get("location", "")
            self.assertIn("github.com/login/oauth/authorize", location)
            self.assertIn("client_id=test_client_id", location)
            self.assertIn("scope=read%3Auser", location)
            # Check state cookie is set
            self.assertIn("osm_oauth_state", response.headers.get("set-cookie", ""))

    def test_callback_invalid_state_rejected(self):
        settings = get_settings()
        with patch.object(settings, "github_client_id", "test_id"), patch.object(
            settings, "github_client_secret", "test_secret"
        ):
            response = self.client.get("/api/v1/auth/callback?code=foo&state=invalid", follow_redirects=False)
            self.assertEqual(response.status_code, 400)
            self.assertIn("Invalid OAuth state parameter", response.json().get("detail", ""))

    @patch("httpx.AsyncClient.post")
    @patch("httpx.AsyncClient.get")
    def test_callback_successful_exchange_sets_cookie(self, mock_get, mock_post):
        settings = get_settings()
        # Mock token exchange
        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = {
            "access_token": "gho_visitor_token_abc123",
            "token_type": "bearer",
            "scope": "read:user",
        }
        mock_post.return_value = mock_post_resp

        # Mock user profile fetch
        mock_get_resp = MagicMock()
        mock_get_resp.status_code = 200
        mock_get_resp.json.return_value = {
            "login": "octocat",
            "avatar_url": "https://avatars.githubusercontent.com/u/583231",
        }
        mock_get.return_value = mock_get_resp

        # Set valid state cookie
        state_val = "valid_state_test_xyz"
        self.client.cookies.set("osm_oauth_state", state_val)

        with patch.object(settings, "github_client_id", "test_id"), patch.object(
            settings, "github_client_secret", "test_secret"
        ):
            response = self.client.get(
                f"/api/v1/auth/callback?code=good_code&state={state_val}",
                follow_redirects=False,
            )
            self.assertEqual(response.status_code, 303)
            set_cookie = response.headers.get("set-cookie", "")
            self.assertIn("osm_session=", set_cookie)
            self.assertIn("HttpOnly", set_cookie)
            # Token must NOT be in url or plaintext header
            self.assertNotIn("gho_visitor_token_abc123", response.headers.get("location", ""))

    def test_auth_me_unauthenticated(self):
        response = self.client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["authenticated"])
        self.assertFalse(data["using_visitor_token"])
        self.assertIsNone(data.get("username"))
        self.assertNotIn("token", data)

    def test_auth_me_authenticated(self):
        user_token = "gho_secret_user_token_999"
        payload = {"token": user_token, "username": "monalisa", "avatar_url": "https://avatar.png"}
        session_cookie = create_session_token(payload)
        self.client.cookies.set("osm_session", session_cookie)

        response = self.client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["authenticated"])
        self.assertTrue(data["using_visitor_token"])
        self.assertEqual(data["username"], "monalisa")
        self.assertEqual(data["avatar_url"], "https://avatar.png")
        # Ensure access token is NEVER returned
        self.assertNotIn("token", data)
        self.assertNotIn("gho_secret_user_token_999", json.dumps(data))

    def test_logout_clears_cookie(self):
        self.client.cookies.set("osm_session", "dummy_session")
        response = self.client.post("/api/v1/auth/logout")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["authenticated"])
        set_cookie = response.headers.get("set-cookie", "")
        self.assertIn("osm_session=", set_cookie)
        self.assertTrue("Max-Age=0" in set_cookie or "max-age=0" in set_cookie or "expires=" in set_cookie.lower())

    @patch("app.services.github_service.get_client")
    def test_github_service_uses_visitor_token_when_present(self, mock_get_client):
        from unittest.mock import AsyncMock
        from app.services.github_service import github_get

        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"id": 1}
        mock_resp.headers = {"X-RateLimit-Remaining": "4999"}
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_get_client.return_value = mock_client

        # With user token context set
        user_token = "gho_custom_visitor_token_777"
        set_current_user_token(user_token)
        try:
            import asyncio
            result = asyncio.run(github_get("https://api.github.com/user"))
            self.assertEqual(result, mock_resp)
            args, kwargs = mock_client.get.call_args
            headers = kwargs.get("headers", {})
            self.assertEqual(headers.get("Authorization"), f"Bearer {user_token}")
        finally:
            set_current_user_token(None)

    @patch("app.services.github_service.get_client")
    def test_github_service_falls_back_to_shared_token_when_anonymous(self, mock_get_client):
        from unittest.mock import AsyncMock
        from app.services.github_service import github_get

        mock_client = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"id": 2}
        mock_resp.headers = {"X-RateLimit-Remaining": "59"}
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_get_client.return_value = mock_client

        set_current_user_token(None)
        try:
            import asyncio
            result = asyncio.run(github_get("https://api.github.com/user"))
            self.assertEqual(result, mock_resp)
            args, kwargs = mock_client.get.call_args
            headers = kwargs.get("headers") or {}
            # Without visitor token, Authorization header is not overridden in request_headers
            self.assertNotIn("Authorization", headers)
        finally:
            set_current_user_token(None)


if __name__ == "__main__":
    unittest.main()
