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

OpenSourceMate ships with built-in interactive OpenAPI 3.0+ documentation:

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
- Direct links to documentation (`/docs`, `/redoc`, `/openapi.json`).

## Verification & Testing

The implementation is verified via comprehensive unit and contract tests:
- **Unit and Route Tests**: `backend/tests/test_openapi_and_v1.py` covering OpenAPI schema validation, Swagger UI (`/docs`), ReDoc (`/redoc`), and `/api/v1/` backwards compatibility.
- **Property-Based Contract Tests**: `backend/tests/test_schemathesis_contract.py` using [Schemathesis](schemathesis-api-contract-testing.md) to generate inputs across every endpoint, guaranteeing no 5xx errors and strict OpenAPI schema conformance.
