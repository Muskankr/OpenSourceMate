from fastapi import APIRouter, HTTPException

from app.services.github_service import (
    get_github_user,
    get_user_repositories,
)
from app.services.skill_service import analyze_skills


router = APIRouter(
    prefix="/api/github",
    tags=["GitHub"],
)


@router.get("/users/{username}")
async def get_user(username: str):
    user = await get_github_user(username)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    return {
        "username": user["login"],
        "name": user["name"],
        "bio": user["bio"],
        "avatar_url": user["avatar_url"],
        "public_repositories": user["public_repos"],
        "followers": user["followers"],
        "following": user["following"],
        "profile_url": user["html_url"],
    }


@router.get("/users/{username}/repositories")
async def get_repositories(username: str):
    repositories = await get_user_repositories(username)

    if repositories is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    return {
        "username": username,
        "repository_count": len(repositories),
        "repositories": [
            {
                "name": repo["name"],
                "description": repo["description"],
                "language": repo["language"],
                "stars": repo["stargazers_count"],
                "forks": repo["forks_count"],
                "is_fork": repo["fork"],
                "url": repo["html_url"],
                "updated_at": repo["updated_at"],
            }
            for repo in repositories
        ],
    }


@router.get("/users/{username}/skills")
async def get_user_skills(username: str):
    repositories = await get_user_repositories(username)

    if repositories is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    result = analyze_skills(repositories)

    return {
        "username": username,
        **result,
    }