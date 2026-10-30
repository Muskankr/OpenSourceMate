from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.ai import router as ai_router
from app.api.routes.github import router as github_router
from app.api.routes.issues import router as issues_router
from app.api.routes.matching import router as matching_router
from app.services.github_service import (
    GitHubRateLimitError,
    cache,
    close_client,
    get_github_diagnostics,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_client()


app = FastAPI(
    title="OpenSourceMate API",
    description="AI-powered open-source contribution assistant",
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://open-source-mate-tawny.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(GitHubRateLimitError)
async def github_rate_limit_handler(request: Request, exc: GitHubRateLimitError):
    reset_at = exc.reset_at.isoformat() if exc.reset_at else None

    return JSONResponse(
        status_code=429,
        content={
            "detail": "GitHub rate limit reached. Please try again later.",
            "reset_at": reset_at,
        },
    )


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "OpenSourceMate API",
        "version": "0.1.0",
    }


@app.get("/api/health/diagnostics")
async def health_diagnostics():
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


app.include_router(github_router)
app.include_router(issues_router)
app.include_router(ai_router)
app.include_router(matching_router)
