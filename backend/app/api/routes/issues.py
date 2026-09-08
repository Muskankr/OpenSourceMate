from fastapi import APIRouter, Query, HTTPException

from app.services.issue_service import search_github_issues


router = APIRouter(
    prefix="/api/issues",
    tags=["Issues"],
)


@router.get("/search")
async def search_issues(
    language: str | None = Query(default=None),
    label: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    per_page: int = Query(default=20, ge=1, le=100),
):
    try:
        data = await search_github_issues(
            language=language,
            label=label,
            keyword=keyword,
            per_page=per_page,
        )

        return {
            "total_count": data["total_count"],
            "issues": [
                {
                    "id": issue["id"],
                    "title": issue["title"],
                    "repository": issue["repository_url"].split(
                        "/repos/"
                    )[-1],
                    "url": issue["html_url"],
                    "state": issue["state"],
                    "labels": [
                        label["name"]
                        for label in issue["labels"]
                    ],
                    "comments": issue["comments"],
                    "created_at": issue["created_at"],
                    "updated_at": issue["updated_at"],
                    "user": issue["user"]["login"],
                }
                for issue in data["items"]
            ],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search GitHub issues: {exc}",
        )