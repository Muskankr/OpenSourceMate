import json
import logging
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.utils.logging import (
    StructuredJsonFormatter,
    get_logger,
    request_id_ctx,
    sanitize_sensitive_data,
)


@pytest.fixture
def client():
    return TestClient(app)


def test_request_id_generated_and_returned_in_headers(client):
    """Verify that requests without X-Request-ID receive a generated UUID in response header."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    req_id = response.headers["x-request-id"]
    assert len(req_id) >= 16


def test_incoming_request_id_preserved_in_headers(client):
    """Verify that a client-supplied X-Request-ID is preserved and propagated."""
    custom_id = "custom-test-request-id-12345"
    response = client.get("/api/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == custom_id


def test_structured_json_formatter_outputs_valid_json():
    """Verify StructuredJsonFormatter outputs valid JSON containing standard fields."""
    formatter = StructuredJsonFormatter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname=__file__,
        lineno=42,
        msg="Test structured log message",
        args=(),
        exc_info=None,
    )
    token = request_id_ctx.set("ctx-req-abc-999")
    try:
        record.structured_data = {
            "event": "user_action",
            "username": "octocat",
            "github_token": "ghp_secretTokenValue12345678",
        }

        formatted = formatter.format(record)
        parsed = json.loads(formatted)

        assert parsed["level"] == "INFO"
        assert parsed["message"] == "Test structured log message"
        assert parsed["logger"] == "test_logger"
        assert parsed["request_id"] == "ctx-req-abc-999"
        assert parsed["event"] == "user_action"
        assert parsed["username"] == "octocat"
        # Token must be redacted
        assert parsed["github_token"] == "[REDACTED]"
    finally:
        request_id_ctx.reset(token)


def test_sanitize_sensitive_data():
    """Verify token and authorization sanitization across nested structures."""
    payload = {
        "user": "alice",
        "authorization": "Bearer secret_jwt_token_here",
        "nested": {
            "token": "ghp_xyz1234567890abcdef",
            "api_key": "ai-key-secret",
            "safe_field": "visible_value",
        },
        "list_items": [
            {"token": "secret"},
            "Bearer ghp_token_in_string_123456",
            "normal string",
        ],
    }

    sanitized = sanitize_sensitive_data(payload)

    assert sanitized["user"] == "alice"
    assert sanitized["authorization"] == "[REDACTED]"
    assert sanitized["nested"]["token"] == "[REDACTED]"
    assert sanitized["nested"]["api_key"] == "[REDACTED]"
    assert sanitized["nested"]["safe_field"] == "visible_value"
    assert sanitized["list_items"][0]["token"] == "[REDACTED]"
    assert "[REDACTED_TOKEN]" in sanitized["list_items"][1]
    assert sanitized["list_items"][2] == "normal string"


def test_middleware_logs_request_and_response(caplog):
    """Verify StructuredLoggingMiddleware logs request start and completion with request id."""
    with caplog.at_level(logging.INFO):
        client = TestClient(app)
        res = client.get("/api/health", headers={"X-Request-ID": "test-log-flow-id"})
        assert res.status_code == 200

    messages = [rec.message for rec in caplog.records]
    assert any("Incoming request GET /api/health" in m for m in messages)
    assert any("Completed GET /api/health with status 200" in m for m in messages)


def test_request_id_propagated_to_all_log_records_in_request(caplog):
    """Verify each log line for a request carries the exact same request ID."""
    formatter = StructuredJsonFormatter()
    flow_id = "req-id-consistent-test-999"

    with caplog.at_level(logging.INFO):
        client = TestClient(app)
        client.get("/api/health", headers={"X-Request-ID": flow_id})

    matching_records = [
        rec for rec in caplog.records if rec.name == "app.middleware.logging"
    ]
    assert len(matching_records) >= 2

    for rec in matching_records:
        formatted = formatter.format(rec)
        log_json = json.loads(formatted)
        assert log_json.get("request_id") == flow_id


def test_tokens_never_appear_in_formatted_logs():
    """Verify tokens are never printed in formatted log strings or records."""
    formatter = StructuredJsonFormatter()
    raw_token = "ghp_VerySecretGitHubToken12345678"

    record = logging.LogRecord(
        name="test_security",
        level=logging.INFO,
        pathname=__file__,
        lineno=100,
        msg=f"Failed auth for user with token: {raw_token}",
        args=(),
        exc_info=None,
    )
    record.structured_data = {
        "authorization": f"Bearer {raw_token}",
        "access_token": raw_token,
        "details": {"nested_token": raw_token},
    }

    output = formatter.format(record)
    assert raw_token not in output
    assert "[REDACTED_TOKEN]" in output or "[REDACTED]" in output


def test_metrics_endpoint_disabled_by_default(client):
    """Verify /metrics returns 404 when disabled."""
    response = client.get("/metrics")
    assert response.status_code == 404
    body = response.json()
    err_text = str(body.get("detail", body.get("message", ""))).lower()
    assert "disabled" in err_text


def test_metrics_endpoint_enabled_and_tracks_counts(client, monkeypatch):
    """Verify /metrics returns status counts and latencies when enabled."""
    from app.config import get_settings
    from app.services.metrics_service import get_metrics_collector

    collector = get_metrics_collector()
    collector.reset()

    settings = get_settings()
    monkeypatch.setattr(settings, "metrics_enabled", True)

    # Fire two test requests
    client.get("/health")
    client.get("/health")

    # Record a simulated GitHub call with rate limit remaining
    collector.record_github_call(duration_ms=45.2, remaining_rate_limit=4980)
    collector.record_github_call(duration_ms=120.0, error_type="rate_limit")

    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()

    assert "requests" in data
    assert "github" in data
    assert data["requests"]["total"] >= 2
    assert "200" in data["requests"]["by_status"]
    assert data["requests"]["latency_ms"]["average"] > 0

    assert data["github"]["requests_total"] == 2
    assert data["github"]["errors_total"] == 1
    assert data["github"]["rate_limit_errors"] == 1
    assert data["github"]["last_rate_limit_remaining"] == 4980


def test_health_endpoint_returns_status_version_and_uptime(client):
    """Verify health endpoint returns status, version, and uptime (without calling GitHub)."""
    with MagicMock() as mock_github:
        from app.services import github_service
        original_get_client = github_service.get_client
        github_service.get_client = mock_github
        try:
            res = client.get("/health")
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "healthy"
            assert "version" in data
            assert data["version"] == "0.1.0"
            assert "uptime" in data
            assert isinstance(data["uptime"], (int, float))
            assert data["uptime"] >= 0
            mock_github.assert_not_called()
        finally:
            github_service.get_client = original_get_client


def test_every_log_line_in_request_carries_same_request_id(client, caplog):
    """Verify acceptance criterion: Every log line for a request carries the same request ID."""
    formatter = StructuredJsonFormatter()
    test_req_id = "req-tracing-12345-abcdef"

    with caplog.at_level(logging.INFO):
        # Trigger request with client header
        res = client.get("/health", headers={"X-Request-ID": test_req_id})
        assert res.status_code == 200
        assert res.headers.get("x-request-id") == test_req_id

    # Filter records from this request
    matching_records = [
        rec for rec in caplog.records if getattr(rec, "request_id", None) == test_req_id
    ]
    assert len(matching_records) >= 2  # At least request_started and request_completed

    for rec in matching_records:
        formatted = formatter.format(rec)
        parsed = json.loads(formatted)
        assert parsed["request_id"] == test_req_id


def test_secrets_never_logged_in_authorization_headers_or_query_params(client, caplog):
    """Verify acceptance criterion: Tests prove that secrets are not logged."""
    secret_token = "ghp_SuperSecretPatToken12345678"
    bearer_token = "Bearer ghp_BearerSecretToken87654321"
    query_secret = "ghp_QuerySecretParam999888777"
    pat_secret = "github_pat_11AABBCCDDEEFFGGHH12345678901234567890"

    with caplog.at_level(logging.INFO):
        res = client.get(
            f"/health?token={query_secret}&access_token={secret_token}",
            headers={
                "Authorization": bearer_token,
                "Cookie": "session=secret_session_cookie_12345",
                "X-Api-Key": pat_secret,
            },
        )
        assert res.status_code == 200

    # Ensure none of the raw secrets ever appear in the log output or formatted text
    all_logged_text = " ".join(rec.getMessage() for rec in caplog.records)
    assert secret_token not in all_logged_text
    assert bearer_token not in all_logged_text
    assert query_secret not in all_logged_text
    assert pat_secret not in all_logged_text
    assert "secret_session_cookie_12345" not in all_logged_text


def test_request_logging_contains_method_path_status_duration_and_request_id(client, caplog):
    """Verify request logging logs method, path, status, duration, and returns request ID in header."""
    with caplog.at_level(logging.INFO):
        res = client.get("/health")
        assert res.status_code == 200
        req_id = res.headers.get("x-request-id")
        assert req_id is not None
        assert len(req_id) >= 16

    # Verify request_completed entry
    completion_records = [
        rec for rec in caplog.records
        if hasattr(rec, "structured_data") and rec.structured_data.get("event") == "request_completed"
    ]
    assert len(completion_records) >= 1
    entry = completion_records[0].structured_data

    assert entry["method"] == "GET"
    assert entry["path"] == "/health"
    assert entry["status"] == 200
    assert "duration_ms" in entry
    assert entry["duration_ms"] >= 0


def test_configurable_log_level_via_settings(monkeypatch):
    """Verify log level is configurable through LOG_LEVEL setting/environment variable."""
    from app.config import Settings
    from app.utils.logging import setup_structured_logging

    # Test setting via environment variable / settings constructor
    custom_settings = Settings(log_level="DEBUG")
    assert custom_settings.log_level == "DEBUG"

    setup_structured_logging(level=custom_settings.log_level)
    assert logging.getLogger().level == logging.DEBUG

    # Test warning level
    warn_settings = Settings(log_level="WARNING")
    assert warn_settings.log_level == "WARNING"

    setup_structured_logging(level=warn_settings.log_level)
    assert logging.getLogger().level == logging.WARNING

    # Reset back to INFO
    setup_structured_logging(level="INFO")


