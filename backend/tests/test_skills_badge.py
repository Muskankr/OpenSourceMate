"""Unit and integration tests for the SVG Skills Badge endpoint."""

from unittest.mock import AsyncMock, patch
from xml.etree import ElementTree

import httpx
import pytest

from app.cache import cache
from app.main import app
from app.services import badge_service


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
async def api():
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_skills_badge_renders_svg_with_top_three_skills(api, monkeypatch):
    mock_repos = [
        {"name": "repo1", "fork": False, "stargazers_count": 10},
        {"name": "repo2", "fork": False, "stargazers_count": 5},
    ]
    mock_details = {
        "repo1": {"languages": {"Python": 1000}, "dependencies": []},
        "repo2": {"languages": {"TypeScript": 800, "Rust": 500, "Go": 200}, "dependencies": []},
    }

    monkeypatch.setattr(
        "app.api.routes.github.get_user_repositories",
        AsyncMock(return_value=mock_repos),
    )
    monkeypatch.setattr(
        "app.api.routes.github.get_repository_details",
        AsyncMock(return_value=mock_details),
    )

    response = await api.get("/api/v1/github/users/octocat/badge.svg")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/svg+xml")
    assert "max-age=14400" in response.headers.get("cache-control", "")
    assert response.headers.get("x-cache-lookup") == "MISS"

    svg_text = response.text
    # Valid XML root
    root = ElementTree.fromstring(svg_text)
    assert root.tag.endswith("svg")
    assert root.attrib["width"]
    assert root.attrib["height"] == "20"

    # Contains label and top 3 skills
    assert "OpenSourceMate" in svg_text
    assert "Python" in svg_text
    assert "TypeScript" in svg_text
    assert "Rust" in svg_text
    # 4th skill should be omitted to keep badge concise
    assert "Go" not in svg_text


@pytest.mark.asyncio
async def test_skills_badge_caches_responses_and_sets_hit_header(api, monkeypatch):
    mock_get_repos = AsyncMock(
        return_value=[{"name": "repo1", "fork": False, "stargazers_count": 10}]
    )
    mock_details = AsyncMock(
        return_value={"repo1": {"languages": {"Python": 1000}, "dependencies": []}}
    )

    monkeypatch.setattr("app.api.routes.github.get_user_repositories", mock_get_repos)
    monkeypatch.setattr("app.api.routes.github.get_repository_details", mock_details)

    # First request: Cache MISS
    resp1 = await api.get("/api/v1/github/users/torvalds/badge.svg")
    assert resp1.status_code == 200
    assert resp1.headers.get("x-cache-lookup") == "MISS"
    assert mock_get_repos.call_count == 1

    # Second request: Cache HIT (no additional GitHub calls)
    resp2 = await api.get("/api/v1/github/users/torvalds/badge.svg")
    assert resp2.status_code == 200
    assert resp2.headers.get("x-cache-lookup") == "HIT"
    assert mock_get_repos.call_count == 1
    assert resp2.content == resp1.content


@pytest.mark.asyncio
async def test_skills_badge_unknown_user_returns_neutral_badge_not_error(api, monkeypatch):
    # GitHub user does not exist
    monkeypatch.setattr(
        "app.api.routes.github.get_user_repositories",
        AsyncMock(return_value=None),
    )

    response = await api.get("/api/v1/github/users/unknown-user/badge.svg")
    # Must NOT return 404 or 500 error page so it renders inside GitHub README
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/svg+xml")

    svg_text = response.text
    root = ElementTree.fromstring(svg_text)
    assert root.tag.endswith("svg")
    assert "User Not Found" in svg_text or "Skills • Not Found" in svg_text


@pytest.mark.asyncio
async def test_skills_badge_invalid_username_returns_neutral_badge_without_injection(api):
    malicious_inputs = [
        '<script>alert("xss")</script>',
        '"><svg onload=alert(1)>',
        "user;drop table users;",
        "-invalid-name-",
    ]

    for evil_user in malicious_inputs:
        response = await api.get(f"/api/v1/github/users/{evil_user}/badge.svg")
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("image/svg+xml")

        # Must parse cleanly without XML syntax errors
        root = ElementTree.fromstring(response.text)
        assert root.tag.endswith("svg")

        # Ensure no unescaped scripts or tags injected
        assert "<script>" not in response.text
        assert "onload=" not in response.text


@pytest.mark.asyncio
async def test_skills_badge_custom_label_and_color(api, monkeypatch):
    monkeypatch.setattr(
        "app.api.routes.github.get_user_repositories",
        AsyncMock(return_value=[{"name": "repo1", "fork": False, "stargazers_count": 10}]),
    )
    monkeypatch.setattr(
        "app.api.routes.github.get_repository_details",
        AsyncMock(return_value={"repo1": {"languages": {"Rust": 500}, "dependencies": []}}),
    )

    response = await api.get("/api/v1/github/users/rustacean/badge.svg?label=Skills&color=%2310b981")
    assert response.status_code == 200
    svg_text = response.text
    assert "Skills" in svg_text
    assert "Rust" in svg_text
    assert "#10b981" in svg_text
