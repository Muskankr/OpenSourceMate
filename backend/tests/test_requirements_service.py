"""Unit and route tests for repository contribution requirements service (Issue #417).

Verifies:
- Detection of CONTRIBUTING.md, CODE_OF_CONDUCT.md, licence file, and CLA/DCO signals.
- Links to real files in the repository.
- Missing information strictly shows 'unknown' rather than 'none'.
- Tests cover repositories with all, some, and none of the files using sanitized fixtures.
- Cache TTL and route endpoint /api/v1/repositories/requirements.
"""

from unittest.mock import patch
import pytest
from httpx import Request, Response
from starlette.testclient import TestClient

from app.cache import cache
from app.main import app
from app.services.requirements_service import (
    compute_contribution_requirements,
    evaluate_contribution_requirements,
)
from tests.fixture_loader import load_fixture

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_shared_cache():
    cache.clear()
    yield
    cache.clear()


class TestContributionRequirementsEvaluation:
    def test_repository_with_all_files(self):
        fixture = load_fixture("requirements/requirements_all.json")
        result = compute_contribution_requirements(
            repository=fixture["repository"],
            community_profile=fixture["community_profile"],
            contents=fixture["contents"],
        )

        assert result["repository"] == fixture["repository"]

        # Contributing guide
        assert result["contributing"]["detected"] is True
        assert result["contributing"]["status"] == "present"
        assert result["contributing"]["url"] == (
            "https://github.com/sample-org/full-requirements-repo/blob/main/CONTRIBUTING.md"
        )

        # Code of Conduct
        assert result["code_of_conduct"]["detected"] is True
        assert result["code_of_conduct"]["status"] == "present"
        assert result["code_of_conduct"]["url"] == (
            "https://github.com/sample-org/full-requirements-repo/blob/main/CODE_OF_CONDUCT.md"
        )

        # License
        assert result["license"]["detected"] is True
        assert result["license"]["status"] == "present"
        assert result["license"]["name"] == "MIT"
        assert result["license"]["url"] == (
            "https://github.com/sample-org/full-requirements-repo/blob/main/LICENSE"
        )

        # CLA / DCO
        assert result["cla_dco"]["detected"] is True
        assert result["cla_dco"]["status"] == "present"
        assert result["cla_dco"]["type"] == "CLA"
        assert result["cla_dco"]["url"] == (
            "https://github.com/sample-org/full-requirements-repo/blob/main/CLA.md"
        )

    def test_repository_with_some_files(self):
        fixture = load_fixture("requirements/requirements_some.json")
        result = compute_contribution_requirements(
            repository=fixture["repository"],
            community_profile=fixture["community_profile"],
            contents=fixture["contents"],
        )

        # Present files
        assert result["contributing"]["detected"] is True
        assert result["contributing"]["status"] == "present"
        assert result["contributing"]["url"] is not None

        assert result["license"]["detected"] is True
        assert result["license"]["status"] == "present"
        assert result["license"]["name"] == "Apache-2.0"

        # Missing files - Acceptance criterion: Missing information shows 'unknown' rather than 'none'
        assert result["code_of_conduct"]["detected"] is False
        assert result["code_of_conduct"]["status"] == "unknown"
        assert result["code_of_conduct"]["url"] is None
        assert result["code_of_conduct"]["status"] != "none"

        assert result["cla_dco"]["detected"] is False
        assert result["cla_dco"]["status"] == "unknown"
        assert result["cla_dco"]["status"] != "none"

    def test_repository_with_none_of_the_files(self):
        fixture = load_fixture("requirements/requirements_none.json")
        result = compute_contribution_requirements(
            repository=fixture["repository"],
            community_profile=fixture["community_profile"],
            contents=fixture["contents"],
        )

        # Acceptance criterion: Missing information shows 'unknown' rather than 'none'
        for key in ["contributing", "code_of_conduct", "license", "cla_dco"]:
            assert result[key]["detected"] is False
            assert result[key]["status"] == "unknown"
            assert result[key]["status"] != "none"
            assert result[key]["url"] is None

    def test_dco_detection_via_contents(self):
        contents = [
            {
                "name": "DCO",
                "html_url": "https://github.com/sample-org/dco-repo/blob/main/DCO",
            }
        ]
        result = compute_contribution_requirements(
            repository="sample-org/dco-repo",
            community_profile={},
            contents=contents,
        )

        assert result["cla_dco"]["detected"] is True
        assert result["cla_dco"]["type"] == "DCO"
        assert "Signed-off-by" in result["cla_dco"]["name"]
        assert result["cla_dco"]["url"] == "https://github.com/sample-org/dco-repo/blob/main/DCO"


class TestContributionRequirementsAsyncServiceAndRoute:
    @pytest.mark.asyncio
    async def test_evaluate_contribution_requirements_caching(self):
        fixture = load_fixture("requirements/requirements_all.json")
        req = Request("GET", "https://api.github.com")

        mock_comm_resp = Response(200, json=fixture["community_profile"], request=req)
        mock_contents_resp = Response(200, json=fixture["contents"], request=req)

        call_count = 0

        async def mock_github_get(url: str, params=None):
            nonlocal call_count
            call_count += 1
            if "/community/profile" in url:
                return mock_comm_resp
            if "/contents" in url:
                return mock_contents_resp
            return Response(200, json={}, request=req)

        with patch("app.services.requirements_service.github_get", side_effect=mock_github_get):
            # First call executes GitHub requests
            res1 = await evaluate_contribution_requirements("sample-org/full-requirements-repo")
            assert res1["contributing"]["detected"] is True
            assert call_count >= 2

            calls_after_first = call_count

            # Second call uses cache
            res2 = await evaluate_contribution_requirements("sample-org/full-requirements-repo")
            assert res2["contributing"]["detected"] is True
            assert call_count == calls_after_first

    def test_get_repository_requirements_endpoint(self):
        fixture = load_fixture("requirements/requirements_all.json")
        req = Request("GET", "https://api.github.com")

        async def mock_github_get(url: str, params=None):
            if "/community/profile" in url:
                return Response(200, json=fixture["community_profile"], request=req)
            if "/contents" in url:
                return Response(200, json=fixture["contents"], request=req)
            return Response(200, json={}, request=req)

        with patch("app.services.requirements_service.github_get", side_effect=mock_github_get):
            response = client.get("/api/v1/repositories/requirements?repo=sample-org/full-requirements-repo")
            assert response.status_code == 200
            data = response.json()
            assert data["repository"] == "sample-org/full-requirements-repo"
            assert data["contributing"]["status"] == "present"
            assert data["code_of_conduct"]["status"] == "present"
            assert data["license"]["status"] == "present"
            assert data["cla_dco"]["status"] == "present"

    def test_get_repository_requirements_invalid_slug(self):
        response = client.get("/api/v1/repositories/requirements?repo=invalid-slug")
        assert response.status_code == 400
