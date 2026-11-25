"""FastAPI Route for repository contributor-friendliness checks and welcoming project discovery (Issues #270, #447)."""

from fastapi import APIRouter, HTTPException, Query
from app.schemas.serializers import DiscoveredRepositoriesResponseSerializer
from app.services.discover_service import discover_repositories
from app.services.friendliness_service import evaluate_contributor_friendliness
from app.services.github_service import GitHubRateLimitError

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
    try:
        result = await evaluate_contributor_friendliness(repo)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate repository friendliness: {str(e)}")


@router.get(
    "/discover",
    response_model=DiscoveredRepositoriesResponseSerializer,
    summary="Discover welcoming repositories ranked by newcomer-friendliness (Issue #447)",
    description=(
        "Discovers active repositories matching the user's top languages, ranked deterministically "
        "by newcomer-friendliness: open beginner issues, recent activity, CONTRIBUTING guide, and Code of Conduct."
    ),
)
async def discover_welcoming_repositories(
    language: str | None = Query(default=None, description="Filter repositories by a specific programming language"),
    languages: str | None = Query(default=None, description="Comma-separated list of target languages"),
    username: str | None = Query(default=None, description="GitHub username to match top languages from"),
    min_stars: int = Query(default=0, ge=0, description="Minimum star count filter"),
    max_stars: int | None = Query(default=None, ge=0, description="Maximum star count filter"),
    limit: int = Query(default=20, ge=1, le=50, description="Maximum number of repositories to return"),
):
    try:
        data = await discover_repositories(
            language=language,
            languages=languages,
            username=username,
            min_stars=min_stars,
            max_stars=max_stars,
            limit=limit,
        )
        return data
    except GitHubRateLimitError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to discover repositories: {str(e)}",
        )

