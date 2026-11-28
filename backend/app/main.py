from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.friendliness import router as friendliness_router
from app.api.routes.github import router as github_router
from app.api.routes.issues import router as issues_router
from app.api.routes.matching import router as matching_router
from app.api.routes.text_skills import router as text_skills_router
from app.config import get_settings
from app.exceptions import APIException
from app.schemas.openapi_serializers import (
    ApiVersionOverviewSerializer,
)
from app.schemas.serializers import (
    HealthDiagnosticsSerializer,
    HealthResponseSerializer,
    ReadinessResponseSerializer,
)
from app.services.github_service import (
    GitHubRateLimitError,
    GitHubTimeoutError,
    GitHubUpstreamError,
    cache,
    close_client,
    get_github_diagnostics,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_client()


from app.middleware.auth_context import UserTokenContextMiddleware
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.rate_limit import IPRateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.utils.logging import setup_structured_logging

settings = get_settings()
setup_structured_logging(level=settings.log_level)

tags_metadata = [
    {
        "name": "Health",
        "description": "System health monitoring, status indicators, and upstream service diagnostics.",
    },
    {
        "name": "GitHub",
        "description": "GitHub profile analysis, repository ingestion, and technical skill extraction.",
    },
    {
        "name": "Matching",
        "description": "Matching algorithm mapping developer competencies to open-source contribution opportunities.",
    },
    {
        "name": "Issues",
        "description": "Open-source issues search, retrieval, and metadata filters.",
    },
    {
        "name": "AI",
        "description": "Generative AI personalized recommendation explanations.",
    },
]

app = FastAPI(
    title="OpenSourceMate API",
    description="""
# OpenSourceMate REST API

An AI-powered open-source contribution assistant that analyzes developer GitHub profiles
and provides personalized repository and issue recommendations.

## API Versioning
All primary API endpoints are accessible with the `/api/v1/` prefix as well as legacy `/api/` paths
for backward compatibility.

## Interactive Documentation
* **Swagger UI:** [/docs](/docs)
* **ReDoc:** [/redoc](/redoc)
* **OpenAPI Specification:** [/openapi.json](/openapi.json)
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=tags_metadata,
    debug=bool(settings.debug),
    lifespan=lifespan,
    contact={
        "name": "OpenSourceMate Team",
        "url": "https://github.com/Muskankr/OpenSourceMate",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
)

app.add_middleware(UserTokenContextMiddleware)
app.add_middleware(IPRateLimitMiddleware)
app.add_middleware(StructuredLoggingMiddleware)

if settings.allowed_hosts and "*" not in settings.allowed_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Added last so it is the outermost middleware and also covers 429 and CORS responses
if settings.security_headers_enabled:
    app.add_middleware(SecurityHeadersMiddleware, settings=settings)


def format_error_content(
    code: str,
    message: str,
    details: Any = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a unified error payload satisfying the standard {error: {code, message, details}} schema."""
    content: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
        "detail": message,
    }
    if extra:
        content.update(extra)
    return content


# ---------------------------------------------------------
# Exception Handlers
# ---------------------------------------------------------
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_content(
            code=exc.code,
            message=exc.message,
            details=exc.details,
        ),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        408: "REQUEST_TIMEOUT",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
        504: "GATEWAY_TIMEOUT",
    }
    code = code_map.get(exc.status_code, f"HTTP_{exc.status_code}")
    details = getattr(exc, "details", None)
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_content(code=code, message=detail_msg, details=details),
        headers=exc.headers,
    )


def sanitize_validation_errors(obj: Any) -> Any:
    """Recursively sanitize validation error structures, converting non-UTF8 bytes to safe strings."""
    if isinstance(obj, bytes):
        return obj.decode("utf-8", errors="replace")
    if isinstance(obj, dict):
        return {k: sanitize_validation_errors(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_validation_errors(v) for v in obj]
    return obj


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    raw_errors = exc.errors()
    safe_errors = jsonable_encoder(sanitize_validation_errors(raw_errors))
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": safe_errors,
            },
            "detail": safe_errors,
        },
    )


@app.exception_handler(GitHubRateLimitError)
async def github_rate_limit_handler(request: Request, exc: GitHubRateLimitError):
    reset_at = exc.reset_at.isoformat() if exc.reset_at else None
    return JSONResponse(
        status_code=429,
        content=format_error_content(
            code="RATE_LIMIT_EXCEEDED",
            message="GitHub rate limit reached. Please try again later.",
            details={"reset_at": reset_at},
            extra={"reset_at": reset_at},
        ),
    )


@app.exception_handler(GitHubTimeoutError)
async def github_timeout_handler(request: Request, exc: GitHubTimeoutError):
    return JSONResponse(
        status_code=504,
        content=format_error_content(
            code="UPSTREAM_TIMEOUT",
            message="GitHub API request timed out. Please try again in a moment.",
            details={"timeout_seconds": exc.timeout_seconds, "url": exc.url},
        ),
    )


@app.exception_handler(GitHubUpstreamError)
async def github_upstream_handler(request: Request, exc: GitHubUpstreamError):
    return JSONResponse(
        status_code=502,
        content=format_error_content(
            code="UPSTREAM_SERVICE_ERROR",
            message="Upstream GitHub service is temporarily unavailable or returned a server error.",
            details={"status_code": exc.status_code, "url": exc.url},
        ),
    )


# ---------------------------------------------------------
# Health Endpoints
# ---------------------------------------------------------
@app.get(
    "/api",
    response_model=ApiVersionOverviewSerializer,
    tags=["Health"],
    summary="API discovery and version overview",
)
@app.get(
    "/api/v1",
    response_model=ApiVersionOverviewSerializer,
    tags=["Health"],
    summary="API v1 discovery and endpoint directory",
)
async def api_version_directory():
    """Discover available API versions, endpoints, and links to documentation."""
    return {
        "service": "OpenSourceMate API",
        "current_version": "/api/v1",
        "available_versions": [
            {
                "prefix": "/api/v1",
                "status": "stable",
                "is_default": True,
                "resources": [
                    "/api/v1/health",
                    "/api/v1/health/diagnostics",
                    "/api/v1/github/users/{username}",
                    "/api/v1/github/users/{username}/skills",
                    "/api/v1/github/users/{username}/repositories",
                    "/api/v1/matching/users/{username}/issues",
                    "/api/v1/issues/search",
                    "/api/v1/ai/analyze-issue",
                ],
            },
            {
                "prefix": "/api",
                "status": "legacy-compatible",
                "is_default": False,
                "resources": [
                    "/api/health",
                    "/api/health/diagnostics",
                    "/api/github/users/{username}",
                    "/api/github/users/{username}/skills",
                    "/api/github/users/{username}/repositories",
                    "/api/matching/users/{username}/issues",
                    "/api/issues/search",
                    "/api/ai/analyze-issue",
                ],
            },
        ],
        "documentation": {
            "title": "OpenSourceMate API",
            "version": "1.0.0",
            "docs_url": "/docs",
            "redoc_url": "/redoc",
            "openapi_url": "/openapi.json",
            "tags": [t["name"] for t in tags_metadata],
        },
    }


@app.get(
    "/health",
    response_model=HealthResponseSerializer,
    tags=["Health"],
    summary="Liveness check (root)",
)
@app.get(
    "/api/health",
    response_model=HealthResponseSerializer,
    tags=["Health"],
    summary="Health check",
)
@app.get(
    "/api/v1/health",
    response_model=HealthResponseSerializer,
    tags=["Health"],
    summary="Health check (v1)",
)
@app.get(
    "/api/health/",
    response_model=HealthResponseSerializer,
    tags=["Health"],
    include_in_schema=False,
)
@app.get(
    "/api/v1/health/",
    response_model=HealthResponseSerializer,
    tags=["Health"],
    include_in_schema=False,
)
async def health_check():
    """Health check endpoint returning service status, name and version."""
    return {
        "status": "healthy",
        "service": "OpenSourceMate API",
        "version": "0.1.0",
    }


@app.get(
    "/ready",
    response_model=ReadinessResponseSerializer,
    tags=["Health"],
    summary="Readiness check (root)",
)
@app.get(
    "/api/ready",
    response_model=ReadinessResponseSerializer,
    tags=["Health"],
    summary="Readiness check (api)",
)
@app.get(
    "/api/v1/ready",
    response_model=ReadinessResponseSerializer,
    tags=["Health"],
    summary="Readiness check (v1)",
)
async def readiness_check():
    """Readiness check endpoint that verifies upstream GitHub API reachability within a short timeout (Issue #425).

    Returns HTTP 200 when ready, or HTTP 503 when upstream dependencies are unreachable.
    """
    github_info = await get_github_diagnostics()
    is_ready = bool(github_info.get("reachable", False))
    payload = {
        "status": "ready" if is_ready else "not_ready",
        "service": "OpenSourceMate API",
        "version": "0.1.0",
        "github_reachable": is_ready,
        "details": github_info,
    }
    status_code = 200 if is_ready else 503
    return JSONResponse(status_code=status_code, content=payload)


@app.get(
    "/api/health/diagnostics",
    response_model=HealthDiagnosticsSerializer,
    tags=["Health"],
    summary="Health diagnostics",
)
@app.get(
    "/api/v1/health/diagnostics",
    response_model=HealthDiagnosticsSerializer,
    tags=["Health"],
    summary="Health diagnostics (v1)",
)
@app.get(
    "/api/health/diagnostics/",
    response_model=HealthDiagnosticsSerializer,
    tags=["Health"],
    include_in_schema=False,
)
@app.get(
    "/api/v1/health/diagnostics/",
    response_model=HealthDiagnosticsSerializer,
    tags=["Health"],
    include_in_schema=False,
)
async def health_diagnostics():
    """Detailed diagnostics of upstream GitHub API connectivity and cache statistics."""
    github_info = await get_github_diagnostics()
    cache_info = cache.stats()
    overall_status = "healthy" if github_info.get("reachable", False) else "degraded"

    return {
        "status": overall_status,
        "service": "OpenSourceMate API",
        "version": "0.1.0",
        "github": github_info,
        "cache": cache_info,
    }


@app.get("/api/programs", tags=["Matching"], summary="List contributor programs")
@app.get(
    "/api/v1/programs", tags=["Matching"], summary="List contributor programs (v1)"
)
async def get_programs_shortcut():
    from app.services.program_service import get_all_programs

    return {"programs": get_all_programs()}


@app.get(
    "/metrics",
    tags=["Health"],
    summary="Application and upstream service metrics (Issue #452)",
)
@app.get(
    "/api/metrics",
    tags=["Health"],
    summary="Application metrics (api)",
)
@app.get(
    "/api/v1/metrics",
    tags=["Health"],
    summary="Application metrics (v1)",
)
async def get_metrics():
    """Optional metrics endpoint providing request counts, latencies, and GitHub error counts.

    Disabled by default. Enabled by setting METRICS_ENABLED=true in the environment.
    """
    settings = get_settings()
    if not settings.metrics_enabled:
        raise HTTPException(
            status_code=404,
            detail="Metrics collection is disabled. Set METRICS_ENABLED=true to enable.",
        )
    from app.services.metrics_service import get_metrics_collector
    return get_metrics_collector().get_metrics_snapshot()


# ---------------------------------------------------------
# Routers (Dual-mounted: /api/ and /api/v1/ for compatibility)
# ---------------------------------------------------------
# v1 Prefix Routers
app.include_router(github_router, prefix="/api/v1", include_in_schema=True)
app.include_router(issues_router, prefix="/api/v1", include_in_schema=True)
app.include_router(ai_router, prefix="/api/v1", include_in_schema=True)
app.include_router(matching_router, prefix="/api/v1", include_in_schema=True)
app.include_router(friendliness_router, prefix="/api/v1", include_in_schema=True)
app.include_router(text_skills_router, prefix="/api/v1", include_in_schema=True)
app.include_router(auth_router, prefix="/api/v1", include_in_schema=True)

# Legacy /api/ Routers (Backward Compatibility)
app.include_router(github_router, prefix="/api", include_in_schema=False)
app.include_router(issues_router, prefix="/api", include_in_schema=False)
app.include_router(ai_router, prefix="/api", include_in_schema=False)
app.include_router(matching_router, prefix="/api", include_in_schema=False)
app.include_router(friendliness_router, prefix="/api", include_in_schema=False)
app.include_router(text_skills_router, prefix="/api", include_in_schema=False)
app.include_router(auth_router, prefix="/api", include_in_schema=False)
