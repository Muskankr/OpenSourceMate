"""FastAPI Route for repository health signals (Issue #416)."""

from fastapi import APIRouter, HTTPException, Query
from app.schemas.serializers import RepositoryHealthResponseSerializer
from app.services.health_service import evaluate_repository_health

router = APIRouter(prefix="/repositories", tags=["Repositories"])


@router.get(
    "/health",
    response_model=RepositoryHealthResponseSerializer,
    summary="Evaluate repository health signals",
    description=(
        "Computes repository health signals from public data: days since last commit, "
        "share of recent pull requests merged, median response hours, and classification (Active/Slow/Inactive/Unknown)."
    ),
)
async def get_repository_health(
    repo: str = Query(..., description="Repository URL or slug, e.g. 'owner/repo' or 'https://github.com/owner/repo'"),
):
    try:
        result = await evaluate_repository_health(repo)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate repository health: {str(e)}")
