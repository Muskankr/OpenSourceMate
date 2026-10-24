from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.services import github_service


def fake_client(status_code=200, payload=None):
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = payload
    if status_code >= 400 and status_code != 404:
        response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=response
        )
    client = MagicMock()
    client.get = AsyncMock(return_value=response)
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=False)
    return client


async def test_get_github_user_success():
    client = fake_client(200, {"login": "octocat"})
    with patch.object(github_service.httpx, "AsyncClient", return_value=client):
        user = await github_service.get_github_user("octocat")
    assert user == {"login": "octocat"}
    client.get.assert_awaited_once_with("https://api.github.com/users/octocat")


async def test_get_github_user_404_returns_none():
    client = fake_client(404)
    with patch.object(github_service.httpx, "AsyncClient", return_value=client):
        assert await github_service.get_github_user("nobody") is None


async def test_get_github_user_server_error_raises():
    client = fake_client(500)
    with patch.object(github_service.httpx, "AsyncClient", return_value=client):
        with pytest.raises(httpx.HTTPStatusError):
            await github_service.get_github_user("octocat")


async def test_get_user_repositories_success():
    client = fake_client(200, [{"name": "a"}, {"name": "b"}])
    with patch.object(github_service.httpx, "AsyncClient", return_value=client):
        repos = await github_service.get_user_repositories("octocat")
    assert repos == [{"name": "a"}, {"name": "b"}]
    client.get.assert_awaited_once_with(
        "https://api.github.com/users/octocat/repos",
        params={"per_page": 100, "sort": "updated"},
    )


async def test_get_user_repositories_zero_repos():
    client = fake_client(200, [])
    with patch.object(github_service.httpx, "AsyncClient", return_value=client):
        assert await github_service.get_user_repositories("empty") == []


async def test_get_user_repositories_404_returns_none():
    client = fake_client(404)
    with patch.object(github_service.httpx, "AsyncClient", return_value=client):
        assert await github_service.get_user_repositories("nobody") is None


async def test_get_user_repositories_server_error_raises():
    client = fake_client(503)
    with patch.object(github_service.httpx, "AsyncClient", return_value=client):
        with pytest.raises(httpx.HTTPStatusError):
            await github_service.get_user_repositories("octocat")
