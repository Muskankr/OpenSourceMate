"""FastAPI Route for repository contributor-friendliness checks (Issue #270)."""

from fastapi import APIRouter, HTTPException, Query
from app.services.friendliness_service import evaluate_contributor_friendliness
from app.utils.validation import validate_repo_slug

router = APIRouter(prefix="/repositories", tags=["Repositories"])


@router.get(
    "/friendliness",
    summary="Evaluate repository contributor-friendliness checklist",
    description=(
        "Checks repository community health: contributing guide, code of conduct, "
        "license, recent commits, open good-first-issues, and median response time."
    ),
)
async def get_repository_friendliness(
    repo: str = Query(..., description="Repository URL or slug, e.g. 'owner/repo' or 'https://github.com/owner/repo'"),
):
    clean_repo = validate_repo_slug(repo)
    try:
        result = await evaluate_contributor_friendliness(clean_repo)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate repository friendliness: {str(e)}")
