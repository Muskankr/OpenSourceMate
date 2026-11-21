from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.config import get_settings
from app.schemas.serializers import (
    ExtendedGitHubUserProfileSerializer,
    GitHubUserProfileSerializer,
    RepositoryListSerializer,
    TopRepositoriesResponseSerializer,
    UserSkillsSerializer,
)
from app.services.github_service import (
    get_github_user,
    get_repository_details,
    get_user_repositories,
)
from app.services.skill_service import analyze_skills
from app.utils.validation import validate_github_username

router = APIRouter(
    prefix="/github",
    tags=["GitHub"],
)


@router.get(
    "/users/{username}",
    response_model=ExtendedGitHubUserProfileSerializer,
    summary="Get GitHub user profile",
)
async def get_user(
    username: str,
    refresh: bool = Query(default=False, description="Bypass cache and fetch fresh data (Issue #132)"),
):
    validated_username = validate_github_username(username)
    user = await get_github_user(validated_username, refresh=refresh)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    return {
        "username": user["login"],
        "name": user.get("name"),
        "bio": user.get("bio"),
        "avatar_url": user["avatar_url"],
        "public_repositories": user.get("public_repos", 0),
        "followers": user.get("followers", 0),
        "following": user.get("following", 0),
        "profile_url": user["html_url"],
        "location": user.get("location"),
        "company": user.get("company"),
        "blog": user.get("blog"),
        "twitter_username": user.get("twitter_username"),
        "created_at": user.get("created_at"),
        "public_gists": user.get("public_gists", 0),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get(
    "/users/{username}/repositories",
    response_model=RepositoryListSerializer,
    summary="Get GitHub user repositories",
)
async def get_repositories(
    username: str,
    refresh: bool = Query(default=False, description="Bypass cache and fetch fresh data (Issue #132)"),
):
    validated_username = validate_github_username(username)
    repositories = await get_user_repositories(validated_username, refresh=refresh)

    if repositories is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    settings = get_settings()
    per_page = getattr(settings, "github_repos_per_page", 100)
    cap = getattr(settings, "github_max_repos_cap", 300)
    pages = (len(repositories) + per_page - 1) // per_page if repositories else 0
    has_more = len(repositories) >= cap

    return {
        "username": validated_username,
        "repository_count": len(repositories),
        "total_pages_fetched": max(1, pages) if repositories else 0,
        "has_more": has_more,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "repositories": [
            {
                "name": repo["name"],
                "description": repo.get("description"),
                "language": repo.get("language"),
                "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0),
                "is_fork": repo.get("fork", False),
                "url": repo.get("html_url"),
                "updated_at": repo.get("updated_at"),
            }
            for repo in repositories
        ],
    }


@router.get(
    "/users/{username}/top-repositories",
    response_model=TopRepositoriesResponseSerializer,
    summary="Get top 5 starred and 5 most recent repositories (Issue #85)",
)
async def get_top_repositories(
    username: str,
    exclude_forks: bool = Query(default=True, description="Whether to exclude forked repositories"),
    refresh: bool = Query(default=False, description="Bypass cache and fetch fresh repository data"),
):
    """Return top 5 starred repositories and 5 most recently pushed/updated repositories.
    
    Supports fork exclusion and provides language, stars, forks, and updated timestamp.
    """
    validated_username = validate_github_username(username)
    repositories = await get_user_repositories(validated_username, refresh=refresh)

    if repositories is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    # Filter forks if requested
    filtered = [
        r for r in repositories
        if not (exclude_forks and r.get("fork", False))
    ]

    def serialize_repo(r: dict) -> dict:
        return {
            "name": r["name"],
            "description": r.get("description"),
            "language": r.get("language"),
            "stars": r.get("stargazers_count", 0),
            "forks": r.get("forks_count", 0),
            "is_fork": r.get("fork", False),
            "url": r.get("html_url"),
            "updated_at": r.get("pushed_at") or r.get("updated_at"),
        }

    # Top 5 by stars descending
    by_stars = sorted(
        filtered,
        key=lambda r: (r.get("stargazers_count", 0), r.get("forks_count", 0)),
        reverse=True,
    )[:5]

    # Top 5 by pushed_at / updated_at descending
    by_recent = sorted(
        filtered,
        key=lambda r: str(r.get("pushed_at") or r.get("updated_at") or ""),
        reverse=True,
    )[:5]

    return {
        "username": validated_username,
        "exclude_forks": exclude_forks,
        "top_by_stars": [serialize_repo(r) for r in by_stars],
        "most_recent": [serialize_repo(r) for r in by_recent],
    }


@router.get(
    "/users/{username}/skills",
    response_model=UserSkillsSerializer,
    response_model_exclude_none=True,
    summary="Analyze GitHub user technical skills",
)
async def get_user_skills(
    username: str,
    include_forks: bool = False,
    ignore_noise: bool = True,
    group_related: bool = False,
    include_proficiency: bool = True,
    refresh: bool = Query(default=False, description="Bypass cache and re-analyze fresh data (Issue #132)"),
):
    validated_username = validate_github_username(username)
    repositories = await get_user_repositories(validated_username, refresh=refresh)

    if repositories is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    details = await get_repository_details(repositories, refresh=refresh)
    result = analyze_skills(
        repositories,
        include_forks=include_forks,
        repo_details=details,
        ignore_noise=ignore_noise,
        group_related=group_related,
        compute_proficiency=include_proficiency,
    )

    return {
        "username": validated_username,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        **result,
    }



@router.get(
    "/users/{username}/starred-interests",
    summary="Get user interest signals from starred repositories (Issue #344)",
)
async def get_starred_interests(
    username: str,
    limit: int = Query(default=50, ge=1, le=100),
    refresh: bool = Query(default=False),
):
    validated_username = validate_github_username(username)
    from app.services.starred_service import get_user_starred_interests
    data = await get_user_starred_interests(validated_username, limit=limit, refresh=refresh)
    return data


@router.get(
    "/users/{username}/external-prs",
    summary="Get merged PR history for other repositories (Issue #192)",
)
async def get_external_prs(
    username: str,
    limit: int = Query(default=10, ge=1, le=100),
    refresh: bool = Query(default=False),
):
    validated_username = validate_github_username(username)
    try:
        from app.services.github_service import (
            GitHubRateLimitError,
            fetch_merged_external_pull_requests,
        )

        data = await fetch_merged_external_pull_requests(
            validated_username, limit=limit, bypass_cache=refresh
        )
        return data
    except GitHubRateLimitError as exc:
        raise HTTPException(
            status_code=429,
            detail="GitHub API rate limit reached. Please try again later.",
            headers={"X-RateLimit-Reset": exc.reset_at.isoformat()}
            if exc.reset_at
            else {},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch external PR history: {exc}"
        )
