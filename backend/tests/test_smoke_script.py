"""Tests for scripts/smoke_test.py (the post-deployment smoke test, Issue #199).

The script is run against a throwaway HTTP server on 127.0.0.1 that answers
like the real backend, so no network access or GitHub token is needed.
"""

import importlib.util
import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent.parent / "scripts" / "smoke_test.py"
spec = importlib.util.spec_from_file_location("smoke_test", SCRIPT)
smoke_test = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke_test)

GOOD = {
    "/api/health": (
        200,
        {"status": "healthy", "service": "OpenSourceMate API", "version": "0.1.0"},
    ),
    "/api/github/users/octocat": (
        200,
        {
            "username": "octocat",
            "avatar_url": "https://avatars.githubusercontent.com/u/583231",
            "profile_url": "https://github.com/octocat",
            "public_repositories": 8,
            "followers": 10,
            "following": 1,
        },
    ),
    "/api/github/users/octocat/skills": (
        200,
        {
            "username": "octocat",
            "skills": [{"name": "Ruby"}],
            "total_repositories_analyzed": 8,
        },
    ),
}


@pytest.fixture
def serve():
    servers = []

    def start(routes):
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                status, body = routes.get(self.path, (404, {"detail": "not found"}))
                payload = body if isinstance(body, bytes) else json.dumps(body).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(payload)

            def log_message(self, *args):
                pass

        server = HTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        servers.append(server)
        return f"http://127.0.0.1:{server.server_address[1]}"

    yield start
    for server in servers:
        server.shutdown()
        server.server_close()


def run(url, *extra):
    return smoke_test.main(
        ["--api-url", url, "--retries", "1", "--retry-wait", "0", *extra]
    )


def test_passes_against_a_healthy_backend(serve, capsys):
    assert run(serve(GOOD)) == 0
    assert "All smoke checks passed." in capsys.readouterr().out


def test_trailing_slash_in_url_is_fine(serve):
    assert run(serve(GOOD) + "/") == 0


def test_wrong_api_url_fails():
    # Nothing listens on port 9, like a mistyped or dead deployment URL.
    assert run("http://127.0.0.1:9") == 1


def test_wrong_path_on_a_real_server_fails(serve):
    assert run(serve({})) == 1


def test_unhealthy_status_fails(serve, capsys):
    routes = {
        **GOOD,
        "/api/health": (200, {"status": "degraded", "service": "OpenSourceMate API"}),
    }
    assert run(serve(routes)) == 1
    assert "healthy" in capsys.readouterr().out


def test_server_error_fails(serve):
    routes = {**GOOD, "/api/health": (503, {"detail": "starting"})}
    assert run(serve(routes)) == 1


def test_non_json_body_fails(serve, capsys):
    routes = {**GOOD, "/api/health": (200, b"<html>Bad gateway</html>")}
    assert run(serve(routes)) == 1
    assert "not JSON" in capsys.readouterr().out


def test_profile_shape_is_checked(serve, capsys):
    profile = dict(GOOD["/api/github/users/octocat"][1])
    del profile["avatar_url"]
    profile["followers"] = "10"
    routes = {**GOOD, "/api/github/users/octocat": (200, profile)}
    assert run(serve(routes)) == 1
    out = capsys.readouterr().out
    assert "avatar_url" in out and "followers" in out


def test_empty_skills_fail(serve):
    routes = {
        **GOOD,
        "/api/github/users/octocat/skills": (
            200,
            {"username": "octocat", "skills": [], "total_repositories_analyzed": 0},
        ),
    }
    assert run(serve(routes)) == 1


def test_rate_limit_is_reported(serve, capsys):
    routes = {
        **GOOD,
        "/api/github/users/octocat": (429, {"detail": "GitHub rate limit reached."}),
    }
    assert run(serve(routes)) == 1
    assert "rate limited" in capsys.readouterr().out


def test_username_can_be_changed(serve):
    routes = {
        "/api/health": GOOD["/api/health"],
        "/api/github/users/torvalds": (
            200,
            {**GOOD["/api/github/users/octocat"][1], "username": "torvalds"},
        ),
        "/api/github/users/torvalds/skills": GOOD["/api/github/users/octocat/skills"],
    }
    assert run(serve(routes), "--username", "torvalds") == 0


def test_missing_url_is_a_config_error(monkeypatch):
    monkeypatch.delenv("SMOKE_API_URL", raising=False)
    assert smoke_test.main([]) == 2


def test_missing_url_can_be_skipped(monkeypatch):
    monkeypatch.delenv("SMOKE_API_URL", raising=False)
    assert smoke_test.main(["--skip-if-unconfigured"]) == 0


@pytest.mark.parametrize("url", ["api.example.com", "ftp://example.com", "http://"])
def test_bad_url_is_a_config_error(url):
    assert smoke_test.main(["--api-url", url]) == 2


def test_bad_username_is_a_config_error():
    assert smoke_test.main(["--api-url", "http://127.0.0.1:9", "--username=-bad-"]) == 2
