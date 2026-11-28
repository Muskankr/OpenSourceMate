import asyncio
from pathlib import Path
from unittest.mock import AsyncMock, patch
import httpx
import pytest

from app.main import app


REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def test_root_health_liveness_endpoint():
    """Verify /health returns 200 and healthy status (Issue #425)."""
    async def make_request():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
            return await client.get("/health")

    response = asyncio.run(make_request())
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "OpenSourceMate API"
    assert data["version"] == "0.1.0"


def test_ready_endpoint_healthy_github():
    """Verify /ready returns 200 when GitHub is reachable (Issue #425)."""
    mock_rate_limit = {
        "resources": {
            "core": {"limit": 60, "remaining": 55, "reset": 1700000000},
            "search": {"limit": 10, "remaining": 9, "reset": 1700000000},
        }
    }
    mock_resp = httpx.Response(
        status_code=200,
        json=mock_rate_limit,
        request=httpx.Request("GET", "https://api.github.com/rate_limit"),
    )

    async def make_request():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
            return await client.get("/ready")

    with patch("app.services.github_service.get_client") as mock_get_client:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_get_client.return_value = mock_client

        response = asyncio.run(make_request())

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["github_reachable"] is True


def test_ready_endpoint_unhealthy_github():
    """Verify /ready returns 503 when GitHub is unreachable (Issue #425)."""
    async def make_request():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
            return await client.get("/ready")

    with patch("app.services.github_service.get_client") as mock_get_client:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))
        mock_get_client.return_value = mock_client

        response = asyncio.run(make_request())

    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "not_ready"
    assert data["github_reachable"] is False


def test_api_ready_endpoint_variants():
    """Verify /api/ready and /api/v1/ready aliases."""
    mock_resp = httpx.Response(
        status_code=200,
        json={"resources": {}},
        request=httpx.Request("GET", "https://api.github.com/rate_limit"),
    )

    async def make_request(path: str):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
            return await client.get(path)

    with patch("app.services.github_service.get_client") as mock_get_client:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_get_client.return_value = mock_client

        res_api = asyncio.run(make_request("/api/ready"))
        res_v1 = asyncio.run(make_request("/api/v1/ready"))

    assert res_api.status_code == 200
    assert res_v1.status_code == 200


def test_docker_configuration_files_exist_and_non_root():
    """Verify Dockerfiles and docker-compose exist, do not run as root, and bake no secrets (Issue #425)."""
    backend_dockerfile = REPO_ROOT / "backend" / "Dockerfile"
    frontend_dockerfile = REPO_ROOT / "frontend" / "Dockerfile"
    docker_compose = REPO_ROOT / "docker-compose.yml"

    assert backend_dockerfile.exists(), "backend/Dockerfile missing"
    assert frontend_dockerfile.exists(), "frontend/Dockerfile missing"
    assert docker_compose.exists(), "docker-compose.yml missing"

    # Backend Dockerfile safety checks
    backend_content = backend_dockerfile.read_text(encoding="utf-8")
    assert "USER appuser" in backend_content, "Backend container must run as non-root user"
    assert "HEALTHCHECK" in backend_content, "Backend container must declare HEALTHCHECK"
    assert "ghp_" not in backend_content, "No GitHub secrets baked into backend Dockerfile"

    # Frontend Dockerfile safety checks
    frontend_content = frontend_dockerfile.read_text(encoding="utf-8")
    assert "USER node" in frontend_content, "Frontend container must run as non-root user"
    assert "ghp_" not in frontend_content, "No GitHub secrets baked into frontend Dockerfile"

    # Docker Compose safety checks
    compose_content = docker_compose.read_text(encoding="utf-8")
    assert "backend:" in compose_content
    assert "frontend:" in compose_content
    assert "healthcheck:" in compose_content
    assert "ghp_" not in compose_content, "No secrets baked into docker-compose.yml"
