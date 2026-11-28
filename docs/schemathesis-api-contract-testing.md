# Schema-Based API Contract Testing with Schemathesis

## Overview

OpenSourceMate uses **[Schemathesis](https://schemathesis.readthedocs.io/)** for automated property-based API contract testing against the OpenAPI 3.0 specification.

Manual and example-based tests often test only the "happy path" or known edge cases. Schemathesis uses Hypothesis under the hood to generate hundreds of diverse, unusual, and boundary inputs against all documented endpoints to ensure that:

1. **No 5xx Server Errors**: Unusual or malformed inputs must never crash the backend with an unhandled 500 Internal Server Error.
2. **Strict Schema Conformance**: Every response (both success and error responses) must conform strictly to the schemas documented in the OpenAPI specification (`/openapi.json`).
3. **Offline & CI Resilient**: All upstream dependencies (such as the GitHub REST API) are completely mocked, guaranteeing tests run reliably without network access in CI and local developer machines.

---

## Checks Enforced

During contract test runs, Schemathesis asserts the following checks:

| Check | Description | Failure Condition |
| :--- | :--- | :--- |
| `not_a_server_error` | Verifies the server handles every request gracefully | Any HTTP response status code in the 5xx range (500, 502, 503, 504) |
| `response_schema_conformance` | Validates response payloads against OpenAPI definitions | Missing required fields, unexpected types, or structural deviations |

---

## Bugs Discovered & Resolved by Contract Testing

During the initial implementation of Schemathesis contract testing (Issue #455), the following subtle defects were surfaced and resolved:

### 1. HTTP 422 Response Schema Drift
- **Issue**: FastAPI's standard OpenAPI schema defines the 422 `HTTPValidationError` payload with `detail` as an array of validation error items (`list[ValidationError]`). The custom exception handler was returning `detail` as a plain string (`"Request validation failed."`), causing a contract violation.
- **Resolution**: Updated `validation_exception_handler` in `app/main.py` to ensure `detail` is an array of sanitized error objects while retaining the top-level structured `{error: {code, message, details}}` envelope.

### 2. Unhandled 500 Server Crashes on Non-UTF8 Binary Input
- **Issue**: When callers submitted binary payloads or malformed byte sequences, Pydantic stored raw `bytes` in `error["input"]`. Attempting to serialize `exc.errors()` via Starlette's `JSONResponse` threw a fatal `TypeError: Object of type bytes is not JSON serializable` / `UnicodeDecodeError`, triggering an internal server crash (HTTP 500).
- **Resolution**: Implemented `sanitize_validation_errors()` in `app/main.py` which safely decodes arbitrary bytes with character replacement before JSON serialization.

---

## Running Contract Tests Locally

### Option 1: Via Pytest (Recommended)

Contract tests are integrated into the pytest test suite in `tests/test_schemathesis_contract.py`:

```bash
# From the backend directory:
cd backend

# Run contract tests
pytest tests/test_schemathesis_contract.py -v
```

This tests every documented endpoint in the ASGI application with mocked GitHub calls and includes negative tests verifying that deliberately wrong schemas fail.

### Option 2: Via Schemathesis CLI (Standalone ASGI)

You can run Schemathesis directly against the application without starting a web server:

```bash
# Run property-based tests via ASGI
python -m schemathesis.cli run --app app.main:app /openapi.json \
  --checks not_a_server_error,response_schema_conformance \
  --max-examples 5
```

### Option 3: Against a Running Local Server

To test against an active server instance:

```bash
# 1. Start the backend in one terminal
uvicorn app.main:app --port 8000

# 2. In another terminal, run Schemathesis
python -m schemathesis.cli run http://localhost:8000/openapi.json \
  --checks not_a_server_error,response_schema_conformance \
  --max-examples 10
```

---

## How to Fix Contract Test Failures

When a contract test fails, Schemathesis generates a reproducible curl command and explains the discrepancy:

1. **If status is 500 (ST101 Server error)**:
   - Identify the unhandled exception in the server traceback.
   - Add input validation or handle the edge case inside an exception handler or Pydantic serializer.
   - Re-run the tests to confirm the fix.

2. **If response violates schema (ST108 Response violates schema)**:
   - Compare the payload with the Pydantic serializer in `app/schemas/serializers.py` or route `response_model`.
   - Update the serializer definition or adjust the response structure to maintain schema synchronization.
