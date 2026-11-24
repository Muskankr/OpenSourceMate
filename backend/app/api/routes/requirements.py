"""FastAPI Route for repository contribution requirements checks (Issue #417)."""

from fastapi import APIRouter, HTTPException, Query
from app.schemas.serializers import ContributionRequirementsResponseSerializer
from app.services.requirements_service import evaluate_contribution_requirements

router = APIRouter(prefix="/repositories", tags=["Repositories"])


@router.get(
    "/requirements",
    response_model=ContributionRequirementsResponseSerializer,
    summary="Evaluate repository contribution requirements",
    description=(
        "Detects contribution requirements: CONTRIBUTING.md, CODE_OF_CONDUCT.md, "
        "licence file, and CLA/DCO signals, returning real file links or 'unknown'."
    ),
)
async def get_repository_requirements(
    repo: str = Query(..., description="Repository URL or slug, e.g. 'owner/repo' or 'https://github.com/owner/repo'"),
):
    try:
        result = await evaluate_contribution_requirements(repo)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate repository contribution requirements: {str(e)}")
