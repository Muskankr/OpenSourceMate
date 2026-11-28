"""Schemathesis property-based API contract tests for OpenSourceMate.

Verifies:
1. Every documented endpoint in the OpenAPI specification can be exercised
   with generated inputs.
2. The application never returns 5xx server errors for valid or invalid inputs.
3. Every response conforms to its documented response schema.
4. All tests execute completely offline without outbound network access by
   mocking all upstream GitHub API calls.
5. A deliberately wrong response schema causes Schemathesis validation to fail.
"""

import copy

import httpx
import hypothesis
import pytest
import schemathesis
from schemathesis.checks import not_a_server_error, response_schema_conformance

from app.config import get_settings
from app.main import app
from app.services import github_service
from tests.fixture_loader import load_fixture

USER_FIXTURE = load_fixture("users/user_standard.json")
REPOS_FIXTURE = load_fixture("repositories/repos_standard.json")

SAMPLE_ISSUE = {
    "id": 1,
    "node_id": "MDU6SXNzdWUx",
    "number": 42,
    "title": "Add beginner friendly feature",
    "user": {"login": "octocat"},
    "labels": [{"name": "good first issue", "color": "7057ff"}],
    "state": "open",
    "comments": 2,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-02T00:00:00Z",
    "body": "Detailed issue description for testing purposes.",
    "html_url": "https://github.com/octocat/Hello-World/issues/42",
    "repository_url": "https://api.github.com/repos/octocat/Hello-World",
}


def fake_github_handler(request: httpx.Request) -> httpx.Response:
    """Mock handler simulating GitHub REST API without network access."""
    url_str = str(request.url)
    if "/search/issues" in url_str:
        return httpx.Response(
            200,
            json={"total_count": 1, "items": [SAMPLE_ISSUE]},
            request=request,
        )
    if "/search/users" in url_str:
        return httpx.Response(
            200,
            json={"total_count": 1, "items": [{"login": "octocat"}]},
            request=request,
        )
    if "/community/profile" in url_str or "/contents" in url_str:
        return httpx.Response(
            200,
            json={
                "health_percentage": 100,
                "files": {
                    "contributing": {
                        "url": "https://github.com/octocat/Hello-World/blob/main/CONTRIBUTING.md"
                    },
                    "code_of_conduct": {
                        "url": "https://github.com/octocat/Hello-World/blob/main/CODE_OF_CONDUCT.md"
                    },
                },
            },
            request=request,
        )
    if "/repos" in url_str and ("/pulls" in url_str or "/issues" in url_str):
        return httpx.Response(200, json=[SAMPLE_ISSUE], request=request)
    if "/repos" in url_str and "/languages" in url_str:
        return httpx.Response(
            200, json={"Python": 5000, "TypeScript": 3000}, request=request
        )
    if "/repos" in url_str:
        return httpx.Response(200, json=REPOS_FIXTURE, request=request)
    if "/starred" in url_str:
        return httpx.Response(200, json=REPOS_FIXTURE, request=request)
    if "/events" in url_str:
        return httpx.Response(200, json=[], request=request)
    if "/users/" in url_str:
        return httpx.Response(200, json=USER_FIXTURE, request=request)
    if "/rate_limit" in url_str:
        return httpx.Response(
            200,
            json={
                "resources": {
                    "core": {"limit": 5000, "remaining": 4999, "reset": 1893456000}
                }
            },
            request=request,
        )
    return httpx.Response(200, json={}, request=request)


@pytest.fixture(autouse=True)
def mock_offline_environment(monkeypatch):
    """Ensure all outgoing network requests are intercepted and rate limiting is relaxed."""
    # Ensure client uses MockTransport
    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(fake_github_handler))
    monkeypatch.setattr(github_service, "_client", mock_client)

    # Disable IP rate limiter for property-based test traffic
    settings = get_settings()
    original_rate_limit = settings.api_rate_limit_enabled
    settings.api_rate_limit_enabled = False

    yield

    settings.api_rate_limit_enabled = original_rate_limit
    github_service.cache.clear()


# Initialize Schemathesis schema from the ASGI application
schema = schemathesis.openapi.from_asgi("/openapi.json", app)


@schema.parametrize()
@hypothesis.settings(
    max_examples=3,
    deadline=None,
    suppress_health_check=[
        hypothesis.HealthCheck.too_slow,
        hypothesis.HealthCheck.filter_too_much,
    ],
)
def test_schemathesis_endpoints_contract(case):
    """Exercise every documented endpoint with generated inputs.

    Verifies:
    - No 5xx server errors occur.
    - Responses strictly match the documented OpenAPI response schema.
    """
    response = case.call()
    case.validate_response(
        response, checks=(not_a_server_error, response_schema_conformance)
    )


@pytest.mark.filterwarnings(
    "ignore:.*The `\\.example\\(\\)` method is good for exploring strategies.*"
)
def test_deliberately_wrong_response_schema_fails():
    """Verify acceptance criterion: A deliberately wrong response schema makes validation fail."""
    op = next(
        o.ok() for o in schema.get_all_operations() if o.ok().path == "/api/v1/health"
    )
    case = op.as_strategy().example()
    response = case.call()

    # Normal response must pass validation
    case.validate_response(response, checks=(response_schema_conformance,))

    # Create a deliberately corrupted schema requiring an impossible field
    raw_schema = copy.deepcopy(schema.raw_schema)
    raw_schema["paths"]["/api/v1/health"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["required"] = ["non_existent_mandatory_field_deliberately_missing"]

    corrupted_schema = schemathesis.openapi.from_dict(raw_schema)
    corrupted_op = next(
        o.ok()
        for o in corrupted_schema.get_all_operations()
        if o.ok().path == "/api/v1/health"
    )
    corrupted_case = corrupted_op.as_strategy().example()

    # Validating the real response against the wrong schema MUST fail
    with pytest.raises(Exception) as exc_info:
        corrupted_case.validate_response(
            response, checks=(response_schema_conformance,)
        )

    assert (
        "non_existent_mandatory_field_deliberately_missing" in str(exc_info.value)
        or "violates schema" in str(exc_info.value).lower()
    )


@pytest.mark.filterwarnings(
    "ignore:.*The `\\.example\\(\\)` method is good for exploring strategies.*"
)
def test_5xx_server_error_check_fails():
    """Verify that a 500 response triggers the not_a_server_error check failure."""
    import datetime

    op = next(
        o.ok() for o in schema.get_all_operations() if o.ok().path == "/api/v1/health"
    )
    case = op.as_strategy().example()

    # Create a mock 500 response and convert to Schemathesis Response
    fake_500_httpx = httpx.Response(
        status_code=500,
        json={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "Simulated error"}},
        request=httpx.Request("GET", "http://testserver/api/v1/health"),
    )
    fake_500_httpx.read()
    fake_500_httpx.elapsed = datetime.timedelta(seconds=0.01)
    fake_500_response = schemathesis.Response.from_httpx(fake_500_httpx, verify=False)

    with pytest.raises(Exception) as exc_info:
        case.validate_response(fake_500_response, checks=(not_a_server_error,))

    assert "500" in str(exc_info.value) or "server error" in str(exc_info.value).lower()
