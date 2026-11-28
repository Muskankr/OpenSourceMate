# OpenAPI Documentation & /api/v1/ Prefix (Issue #138)

## Overview

Issue #138 establishes formal API versioning via the `/api/v1/` route prefix and comprehensive interactive OpenAPI documentation for developers and consumers.

## API Versioning Strategy

All primary API operations are hosted under the `/api/v1/` prefix:

- **API Discovery Directory**: `GET /api/v1` and `GET /api`
- **Health Check**: `GET /api/v1/health`
- **Health Diagnostics**: `GET /api/v1/health/diagnostics`
- **User Profile**: `GET /api/v1/github/users/{username}`
- **User Repositories**: `GET /api/v1/github/users/{username}/repositories`
- **User Skills Analysis**: `GET /api/v1/github/users/{username}/skills`
- **Matched Recommendations**: `GET /api/v1/matching/users/{username}/issues`
- **Good First Issues Search**: `GET /api/v1/issues/search`
- **AI Suitability Explanation**: `POST /api/v1/ai/analyze-issue`

### Backward Compatibility
Legacy endpoints under `/api/` continue to function without disruption, ensuring existing integrations and client requests remain backward-compatible.

Request examples in curl, Python and JavaScript, with sample responses and a Bruno collection, are in [API Usage Examples](api-usage-examples.md).

## Interactive Documentation

OpenSourceMate ships with built-in interactive OpenAPI 3.0+ documentation.
It is enabled by default outside production. In `ENVIRONMENT=production` or
`prod` (case/whitespace normalized), it is disabled unless `API_DOCS_ENABLED=true`
is explicitly configured. `API_DOCS_ENABLED=false` also disables it in development.
Restart the application after changing settings.

- **Swagger UI**: Accessible at `http://localhost:8000/docs` for testing API operations directly from your browser.
- **ReDoc UI**: Accessible at `http://localhost:8000/redoc` for clean, publication-ready API reference documentation.
- **Raw OpenAPI Schema**: Downloadable JSON specification at `http://localhost:8000/openapi.json`.

## Categorized Tags

Endpoints are logically organized under documented tags:
1. `Health`: System uptime, diagnostics, and version directory.
2. `GitHub`: User profile retrieval, repository scanning, and skill detection.
3. `Matching`: Multi-factor issue recommendation algorithm.
4. `Issues`: GitHub open-source issue querying and filtering.
5. `AI`: Generative AI personal contribution fit analysis.

## API Directory & Discovery Payload

Clients can query `GET /api/v1` to inspect:
- Currently active API version (`/api/v1`).
- Supported sub-resources and lifecycle status.
- `documentation.enabled` and nullable documentation links. When disabled,
  `docs_url`, `redoc_url` and `openapi_url` are `null`, and the documentation routes
  (including the Swagger OAuth redirect) return 404. Functional API routes remain
  available. Disabling documentation is an exposure policy, not API authentication.

## Verification & Testing

The implementation is verified via comprehensive unit tests in `backend/tests/test_openapi_and_v1.py` covering:
- OpenAPI schema validation and tag presence.
- Swagger UI (`/docs`) and ReDoc (`/redoc`) rendering.
- API directory discovery endpoints (`/api` and `/api/v1`).
- `/api/v1/` route invocation alongside legacy `/api/` backwards compatibility.

The [Schemathesis contract tests](schemathesis-api-contract-testing.md) also exercise documented operations and check that response bodies conform to the generated schema.

## Offline schema validation (#440)

The schema comes from the real FastAPI routes and response models; there is no
second hand-maintained specification to drift. Default non-success responses use
the existing unified error-envelope model instead of FastAPI's incompatible
built-in validation-error body. Existing request/response examples remain in the
response serializers and linked API Usage Examples.

From `backend`, run:

```sh
python -m app.openapi_validation
python -m app.openapi_validation path/to/document.json
```

The check uses FastAPI's installed OpenAPI models to validate structure and checks
all generated local references without network access. An invalid document exits
nonzero. It is intentionally a structural/local-reference check for this app's
generated schema, not a complete implementation of every OpenAPI/JSON-Schema
semantic rule. No new dependency or runtime network lookup is added.

The normal backend pytest/CI run validates the generated schema, rejects malformed
structure and missing/remote references, checks every registered API operation,
and tests real health/error payloads against their documented models. A fresh-app
process matrix covers production/development defaults and explicit enable/disable,
including inaccessible docs/schema endpoints and matching discovery metadata.
The in-process `app.openapi()` generator remains available for offline checks even
when the HTTP schema route is disabled.
