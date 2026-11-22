from fastapi import APIRouter, HTTPException, Query

from app.schemas.serializers import IssueSearchResponseSerializer
from app.services.github_service import GitHubRateLimitError
from app.services.issue_service import search_github_issues

router = APIRouter(
    prefix="/issues",
    tags=["Issues"],
)


@router.get(
    "/search",
    response_model=IssueSearchResponseSerializer,
    summary="Search good first issues on GitHub",
)
async def search_issues(
    language: str | None = Query(default=None),
    label: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    per_page: int = Query(default=20, ge=1, le=100),
    exclude_claimed: bool = Query(
        default=False,
        description="Exclude issues that are assigned, have an open PR, or have a claim comment",
    ),
    exclude_stale: bool = Query(
        default=False,
        description="Exclude issues with no activity beyond the stale threshold",
    ),
    stale_days: int = Query(
        default=60,
        ge=1,
        le=365,
        description="Number of inactive days before an issue is flagged as stale",
    ),
):
    try:
        data = await search_github_issues(
            language=language,
            label=label,
            keyword=keyword,
            per_page=per_page,
            exclude_claimed=exclude_claimed,
            exclude_stale=exclude_stale,
            stale_days=stale_days,
        )

        return {
            "total_count": data["total_count"],
            "issues": data["issues"],
        }

    except GitHubRateLimitError:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search GitHub issues: {exc}",
        )
