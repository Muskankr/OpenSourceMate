"""Exercise real app construction in isolated processes, without cached-settings leakage."""

import copy
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from app.main import app
from app.openapi_validation import validate_document
from app.schemas.serializers import ErrorResponseSerializer, HealthResponseSerializer

BACKEND = Path(__file__).resolve().parents[1]
PROBE = """
import json
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
paths = ['/docs', '/docs/oauth2-redirect', '/redoc', '/openapi.json']
print('PROBE=' + json.dumps({
    'statuses': {path: client.get(path).status_code for path in paths},
    'discovery': client.get('/api/v1').json()['documentation'],
    'legacy_discovery': client.get('/api').json()['documentation'],
    'health': client.get('/api/v1/health').json(),
}))
"""


@pytest.mark.parametrize(
    ("environment", "override", "enabled"),
    [
        ("development", None, True),
        ("test", None, True),
        ("production", None, False),
        (" PROD ", None, False),
        ("production", "true", True),
        ("production", "false", False),
        ("development", "false", False),
        ("development", "true", True),
    ],
)
def test_docs_http_exposure_and_discovery(environment, override, enabled):
    env = dict(os.environ)
    env.update(ENVIRONMENT=environment, SECRET_KEY="synthetic-" * 4, DEBUG="false")
    env.pop("API_DOCS_ENABLED", None)
    if override is not None:
        env["API_DOCS_ENABLED"] = override
    result = subprocess.run(
        [sys.executable, "-c", PROBE],
        cwd=BACKEND,
        env=env,
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    )
    data = json.loads(
        next(
            line[6:] for line in result.stdout.splitlines() if line.startswith("PROBE=")
        )
    )
    assert set(data["statuses"].values()) == {200 if enabled else 404}
    assert data["discovery"] == data["legacy_discovery"]
    assert data["discovery"]["enabled"] is enabled
    for key, path in [
        ("docs_url", "/docs"),
        ("redoc_url", "/redoc"),
        ("openapi_url", "/openapi.json"),
    ]:
        assert data["discovery"][key] == (path if enabled else None)
    assert data["health"]["status"] == "healthy"


def test_generated_schema_is_valid_and_covers_every_registered_api_operation():
    schema = app.openapi()
    validate_document(schema)
    for route in app.routes:
        if isinstance(route, APIRoute) and route.include_in_schema:
            for method in route.methods:
                assert method.lower() in schema["paths"][route.path_format]


@pytest.mark.parametrize(
    "invalid", ["missing_info", "bad_response", "missing_reference", "remote_reference"]
)
def test_invalid_specification_fails_validation(invalid):
    schema = copy.deepcopy(app.openapi())
    if invalid == "missing_info":
        del schema["info"]
    elif invalid == "bad_response":
        schema["paths"]["/api/v1/health"]["get"]["responses"] = "not-an-object"
    else:
        schema["components"]["schemas"]["InvalidReference"] = {
            "$ref": "#/components/schemas/Missing"
            if invalid == "missing_reference"
            else "https://example.invalid/schema.json"
        }
    with pytest.raises(ValueError):
        validate_document(schema)


def test_cli_exits_nonzero_for_an_invalid_document(tmp_path):
    path = tmp_path / "invalid.json"
    path.write_text(json.dumps({"openapi": "3.1.0", "paths": {}}))
    result = subprocess.run(
        [sys.executable, "-m", "app.openapi_validation", str(path)],
        cwd=BACKEND,
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert result.returncode == 1
    assert "OpenAPI check failed" in result.stderr


def test_documented_health_and_error_models_match_real_api_responses():
    client = TestClient(app)
    health = client.get("/api/v1/health")
    assert HealthResponseSerializer.model_validate(health.json()).status == "healthy"
    invalid_query = client.get("/api/v1/github/users/autocomplete", params={"q": "x"})
    assert invalid_query.status_code == 422
    error = ErrorResponseSerializer.model_validate(invalid_query.json())
    assert error.error.code == "VALIDATION_ERROR"
    assert isinstance(error.detail, list)
    assert error.detail == error.error.details
    operation = app.openapi()["paths"]["/api/v1/github/users/autocomplete"]["get"]
    assert operation["responses"]["default"]["content"]["application/json"]["schema"][
        "$ref"
    ].endswith("/ErrorResponseSerializer")


def test_request_parser_errors_use_the_documented_error_envelope():
    response = TestClient(app).post(
        "/api/v1/skills/analyze-text",
        content=b"\xff",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400
    error = ErrorResponseSerializer.model_validate(response.json())
    assert error.error.code == "BAD_REQUEST"
    assert error.detail == error.error.message
