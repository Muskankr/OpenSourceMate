from fastapi import APIRouter, HTTPException, Query

from app.schemas.serializers import IssueSearchResponseSerializer
from app.services.github_service import GitHubRateLimitError
from app.services.issue_service import search_github_issues
from app.utils.validation import validate_query_param

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
):
    clean_lang = validate_query_param(language, name="language", max_length=50)
    clean_lbl = validate_query_param(label, name="label", max_length=50)
    clean_kw = validate_query_param(keyword, name="keyword", max_length=100)

    try:
        data = await search_github_issues(
            language=clean_lang,
            label=clean_lbl,
            keyword=clean_kw,
            per_page=per_page,
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
