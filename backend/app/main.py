from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.github import router as github_router
from app.api.routes.issues import router as issues_router
from app.api.routes.ai import router as ai_router
from app.api.routes.matching import router as matching_router


app = FastAPI(
    title="OpenSourceMate API",
    description="AI-powered open-source contribution assistant",
    version="0.1.0",
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


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "OpenSourceMate API",
        "version": "0.1.0",
    }


app.include_router(github_router)
app.include_router(issues_router)
app.include_router(ai_router)
app.include_router(matching_router)
