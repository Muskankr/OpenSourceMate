"""Embeddable SVG Skill Badge endpoints for GitHub profile READMEs."""

import hashlib
import logging

from fastapi import APIRouter, Query, Response

from app.services.badge_service import generate_skill_badge_svg
from app.services.github_service import (
    GitHubRateLimitError,
    GitHubTimeoutError,
    GitHubUpstreamError,
    get_repository_details,
    get_user_repositories,
)
from app.services.skill_service import analyze_skills
from app.utils.validation import validate_github_username

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/badge",
    tags=["Badge"],
)


@router.get(
    "/{username}.svg",
    response_class=Response,
    summary="Get embeddable SVG skill badge for GitHub profile README",
    responses={
        200: {
            "content": {"image/svg+xml": {}},
            "description": "Compact SVG badge displaying top 3 technical skills.",
        }
    },
)
@router.get(
    "/{username}",
    response_class=Response,
    include_in_schema=False,
)
async def get_skill_badge(
    username: str,
    theme: str = Query(default="dark", pattern="^(dark|light)$", description="Badge background theme"),
    refresh: bool = Query(default=False, description="Bypass cache and re-analyze fresh data"),
) -> Response:
    """Generate and return a compact, embeddable SVG badge with the user's top 3 skills.

    Designed for GitHub Profile READMEs:
    - Escapes all user data to prevent SVG/XML injection.
    - Returns a clean neutral badge on errors or rate-limits instead of breaking image rendering.
    - Sets browser and CDN caching headers.
    """
    # 1. Clean username extension if accessed via route without .svg
    clean_username = username
    if clean_username.endswith(".svg"):
        clean_username = clean_username[:-4]

    # 2. Validate username syntax
    try:
        validated_username = validate_github_username(clean_username)
    except Exception:
        svg = generate_skill_badge_svg(clean_username, error_message="invalid username", theme=theme)
        return Response(
            content=svg,
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=600"},
        )

    # 3. Fetch user repositories and handle rate limits / errors gracefully
    try:
        repositories = await get_user_repositories(validated_username, refresh=refresh)
        if repositories is None:
            svg = generate_skill_badge_svg(validated_username, error_message="user not found", theme=theme)
            return Response(
                content=svg,
                media_type="image/svg+xml",
                headers={"Cache-Control": "public, max-age=600"},
            )

        details = await get_repository_details(repositories, refresh=refresh)
        analysis = analyze_skills(
            repositories,
            repo_details=details,
            ignore_noise=True,
            compute_proficiency=True,
        )

        raw_skills = analysis.get("skills", [])
        # Extract top 3 skills by weight / percentage
        top_skills = [s["name"] for s in raw_skills if isinstance(s, dict) and s.get("name")]
        top_3 = top_skills[:3]

        svg = generate_skill_badge_svg(validated_username, skills=top_3, theme=theme)

        # Generate consistent ETag
        etag = f'"{hashlib.md5(svg.encode("utf-8")).hexdigest()}"'

        return Response(
            content=svg,
            media_type="image/svg+xml",
            headers={
                "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
                "ETag": etag,
                "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
            },
        )

    except GitHubRateLimitError:
        logger.warning(f"Rate limit exceeded while rendering badge for {validated_username}")
        svg = generate_skill_badge_svg(validated_username, error_message="rate limited", theme=theme)
        return Response(
            content=svg,
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=300"},
        )
    except (GitHubUpstreamError, GitHubTimeoutError) as e:
        logger.warning(f"Upstream error rendering badge for {validated_username}: {e}")
        svg = generate_skill_badge_svg(validated_username, error_message="skills unavailable", theme=theme)
        return Response(
            content=svg,
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=300"},
        )
    except Exception as e:
        logger.error(f"Unexpected error rendering badge for {validated_username}: {e}")
        svg = generate_skill_badge_svg(validated_username, error_message="skills unavailable", theme=theme)
        return Response(
            content=svg,
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=300"},
        )
