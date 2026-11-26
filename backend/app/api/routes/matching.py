from datetime import UTC, datetime
import re
from typing import Any
from xml.etree import ElementTree

from fastapi import APIRouter, HTTPException, Query, Request, Response

from app.ai.ai_service import generate_issue_match_explanation
from app.cache import cache
from app.config import get_settings
from app.services.embedding_service import similarities
from app.services.github_service import (
    GitHubRateLimitError,
    get_user_repositories,
)
from app.services.issue_service import search_github_issues
from app.services.matching_service import build_idf, calculate_issue_score
from app.services.program_service import (
    get_all_programs,
    get_program_by_id_or_name,
    issue_matches_program,
)
from app.services.skill_service import analyze_skills
from app.utils.validation import is_valid_skill, validate_github_username

router = APIRouter(
    prefix="/matching",
    tags=["Matching"],
)

ATOM_NS = "http://www.w3.org/2005/Atom"
ElementTree.register_namespace("", ATOM_NS)


@router.get("/programs", summary="List supported contributor programs (NSoC, Hacktoberfest, etc.)")
async def list_contributor_programs():
    """Returns the list of supported contributor programs from config."""
    return {
        "programs": get_all_programs(),
    }


def _clean_xml_text(value: Any) -> str:
    """Ensure value is a string and contains only characters valid in XML 1.0."""
    if value is None:
        return ""
    text = str(value)
    # Strip characters forbidden in XML 1.0:
    # Valid: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
    return re.sub(
        r"[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\U00010000-\U0010FFFF]",
        "",
        text,
    )


def _atom_date(value: str | None) -> str:
    """Return an Atom-compatible UTC timestamp, tolerating incomplete issue data."""
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None
        if parsed is None or parsed.tzinfo is None:
            raise ValueError("Missing timezone")
    except (ValueError, TypeError):
        parsed = datetime.now(UTC)
    return parsed.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _atom_element(
    parent: ElementTree.Element,
    name: str,
    text: str,
    attrib: dict[str, str] | None = None,
) -> ElementTree.Element:
    el = ElementTree.SubElement(parent, f"{{{ATOM_NS}}}{name}", attrib or {})
    el.text = _clean_xml_text(text)
    return el


@router.get("/users/{username}/issues")
async def get_matched_issues(
    username: str,
    exclude_stale: bool = Query(default=False),
    skills: list[str] | None = Query(default=None),
    program: str | None = Query(default=None),
):
    validated_username = validate_github_username(username)

    program_config: dict[str, Any] | None = None
    if program is not None and program.strip() and program.strip().lower() not in ("all", "none"):
        program_config = get_program_by_id_or_name(program)
        if not program_config:
            available = ", ".join(p.get("id", "") for p in get_all_programs())
            raise HTTPException(
                status_code=400,
                detail=f"Invalid program: '{program}'. Available programs: {available}",
            )

    explicit_skills: list[str] | None = None
    if skills is not None:
        explicit_skills = []
        for s in skills:
            parts = [p.strip() for p in s.split(",") if p.strip()]
            for p in parts:
                if not is_valid_skill(p):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid skill: '{p}'. Skills must be 1-50 alphanumeric characters or standard symbols (+, #, ., -, space).",
                    )
                if p not in explicit_skills:
                    explicit_skills.append(p)

    if explicit_skills is not None and len(explicit_skills) == 0:
        return {
            "username": validated_username,
            "skills": [],
            "recommendations": [],
        }

    repositories = await get_user_repositories(validated_username)

    if repositories is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    skill_data = analyze_skills(repositories)

    if explicit_skills is not None:
        user_skills = explicit_skills
        repo_skill_map = {skill["name"].lower(): skill["repository_count"] for skill in skill_data["skills"]}
        max_count = max(repo_skill_map.values(), default=1)
        weighted_skills = [
            {
                "name": skill,
                "weight": repo_skill_map.get(skill.lower(), max_count) / max_count,
            }
            for skill in user_skills
        ]
    else:
        user_skills = [skill["name"] for skill in skill_data["skills"]]
        max_count = max(
            (skill["repository_count"] for skill in skill_data["skills"]),
            default=1,
        )
        weighted_skills = [
            {
                "name": skill["name"],
                "weight": skill["repository_count"] / max_count,
            }
            for skill in skill_data["skills"]
        ]

    if not user_skills:
        return {
            "username": validated_username,
            "skills": [],
            "recommendations": [],
        }

    found_issues = []

    # Search issues for the user's top skills.
    for skill in user_skills[:5]:
        try:
            result = await search_github_issues(
                language=skill,
                label="good first issue",
                per_page=10,
            )

            found_issues.extend(result["issues"])

            # If program filter is active, also search issues tagged with program labels
            if program_config:
                for p_lbl in program_config.get("labels", [])[:2]:
                    try:
                        p_result = await search_github_issues(
                            language=skill,
                            label=p_lbl,
                            per_page=10,
                        )
                        found_issues.extend(p_result["issues"])
                    except Exception:
                        continue

        except GitHubRateLimitError:
            # Every remaining search would fail too, so tell the caller.
            raise

        except Exception:
            # One failed language search should not
            # break the entire recommendation request.
            continue

    if explicit_skills is not None:
        user_skills_lower = {s.lower() for s in user_skills}
        found_issues = [
            iss
            for iss in found_issues
            if (iss.get("language") and iss["language"].lower() in user_skills_lower)
            or any(
                (lbl.get("name", "").lower() if isinstance(lbl, dict) else str(lbl).lower())
                in user_skills_lower
                for lbl in iss.get("labels", [])
            )
            or any(s in (iss.get("title") or "").lower() for s in user_skills_lower)
        ]

    # Filter by selected program: only retain issues carrying its labels or repository topics
    if program_config is not None:
        found_issues = [
            iss
            for iss in found_issues
            if issue_matches_program(iss, program_config)
        ]

    # IDF is computed over everything fetched, so a skill that every
    # result mentions counts for less than a rare one.
    idf = build_idf(found_issues, weighted_skills)

    # None unless OSM_USE_EMBEDDINGS is on and sentence-transformers is installed.
    semantic = similarities(weighted_skills, found_issues)

    all_issues = []

    for index, issue in enumerate(found_issues):
        match = calculate_issue_score(
            issue,
            weighted_skills,
            idf,
            semantic[index] if semantic is not None else None,
        )

        all_issues.append(
            {
                **issue,
                "match_score": match["score"],
                "match_reasons": match["reasons"],
                "matched_skills": match["matched_skills"],
                "score_method": match["score_method"],
                "freshness": match.get("freshness"),
                "_raw_score": match["raw_score"],
            }
        )

    # Remove duplicate issues, keeping the best score.
    unique_issues: dict[int, dict[str, Any]] = {}

    for issue in all_issues:
        current = unique_issues.get(issue["id"])

        if current is None or issue["_raw_score"] > current["_raw_score"]:
            unique_issues[issue["id"]] = issue

    recommendations = list(unique_issues.values())

    # Optionally exclude stale issues (>60 days inactive)
    if exclude_stale:
        recommendations = [
            iss
            for iss in recommendations
            if not (iss.get("freshness") and iss["freshness"].get("is_stale"))
        ]

    # Highest compatibility first.
    recommendations.sort(
        key=lambda issue: issue["_raw_score"],
        reverse=True,
    )

    top_recommendations = recommendations[:20]
    for issue in top_recommendations:
        issue.pop("_raw_score", None)
        explanation_data = await generate_issue_match_explanation(issue, user_skills)
        issue["explanation"] = explanation_data["explanation"]
        issue["is_ai_generated"] = explanation_data["is_ai_generated"]
        issue["why_it_matches"] = explanation_data["explanation"]

    response_data: dict[str, Any] = {
        "username": validated_username,
        "skills": user_skills,
        "recommendations": top_recommendations,
    }
    if program_config:
        response_data["program"] = program_config["id"]

    return response_data


@router.get("/users/{username}/feed.atom", response_class=Response)
async def get_matched_issues_feed(
    username: str,
    request: Request,
    skills: list[str] | None = Query(default=None),
    program: str | None = Query(default=None),
    refresh: bool = Query(default=False, description="Bypass cache and force fresh recommendations"),
) -> Response:
    """Expose the same ranked matches as an Atom feed for feed readers.

    Includes title, repository, link, and match reasons. Uses stable entry IDs
    and caches responses to respect GitHub API rate limits.
    """
    clean_user = username.strip().lstrip("@").lower()
    skills_key = ",".join(sorted(skills)) if skills else ""
    prog_key = (program or "").strip().lower()
    feed_cache_key = f"feed:atom:{clean_user}:{skills_key}:{prog_key}"

    settings = get_settings()
    ttl = getattr(settings, "github_cache_ttl", 300)

    if not refresh:
        cached_xml = cache.get(feed_cache_key)
        if cached_xml is not None:
            return Response(
                content=cached_xml,
                media_type="application/atom+xml",
                headers={
                    "Content-Type": "application/atom+xml; charset=utf-8",
                    "Cache-Control": f"max-age={ttl}, public",
                    "X-Cache-Lookup": "HIT",
                },
            )

    matches = await get_matched_issues(username, exclude_stale=False, skills=skills, program=program)
    recommendations = matches["recommendations"]
    feed = ElementTree.Element(f"{{{ATOM_NS}}}feed")
    _atom_element(feed, "id", str(request.url))
    _atom_element(feed, "title", f"OpenSourceMate matches for @{matches['username']}")
    _atom_element(
        feed,
        "updated",
        max(
            (_atom_date(issue.get("updated_at")) for issue in recommendations),
            default=_atom_date(None),
        ),
    )
    ElementTree.SubElement(
        feed,
        f"{{{ATOM_NS}}}link",
        {
            "href": str(request.url),
            "rel": "self",
            "type": "application/atom+xml",
        },
    )

    base_url = str(request.base_url).rstrip("/")
    html_url = f"{base_url}/?username={matches['username']}"
    ElementTree.SubElement(
        feed,
        f"{{{ATOM_NS}}}link",
        {
            "href": html_url,
            "rel": "alternate",
            "type": "text/html",
        },
    )

    author = ElementTree.SubElement(feed, f"{{{ATOM_NS}}}author")
    _atom_element(author, "name", "OpenSourceMate")

    generator = ElementTree.SubElement(
        feed,
        f"{{{ATOM_NS}}}generator",
        {"uri": "https://github.com/Muskankr/OpenSourceMate", "version": "1.0.0"},
    )
    generator.text = "OpenSourceMate"

    for issue in recommendations:
        entry = ElementTree.SubElement(feed, f"{{{ATOM_NS}}}entry")
        issue_url = issue["url"]
        repository = issue["repository"]
        _atom_element(entry, "id", issue_url)
        _atom_element(entry, "title", issue["title"])
        _atom_element(entry, "updated", _atom_date(issue.get("updated_at")))
        ElementTree.SubElement(
            entry,
            f"{{{ATOM_NS}}}link",
            {
                "href": issue_url,
                "rel": "alternate",
                "type": "text/html",
            },
        )
        ElementTree.SubElement(
            entry,
            f"{{{ATOM_NS}}}category",
            {
                "term": repository,
                "label": f"Repository: {repository}",
            },
        )

        reason = (
            issue.get("why_it_matches")
            or issue.get("explanation")
            or ("; ".join(issue["match_reasons"]) if issue.get("match_reasons") else None)
            or (f"Matched skills: {', '.join(issue['matched_skills'])}" if issue.get("matched_skills") else None)
        )

        summary_text = f"Repository: {repository}; match score: {issue['match_score']}%"
        if reason:
            summary_text += f"; match reason: {reason}"
        _atom_element(entry, "summary", summary_text, {"type": "text"})

        content_lines = [
            f"Repository: {repository}",
            f"Match score: {issue['match_score']}%",
        ]
        if reason:
            content_lines.append(f"Match reason: {reason}")
        _atom_element(entry, "content", "\n".join(content_lines), {"type": "text"})

    xml_content = ElementTree.tostring(feed, encoding="utf-8", xml_declaration=True)
    cache.set(feed_cache_key, xml_content, ttl)

    return Response(
        content=xml_content,
        media_type="application/atom+xml",
        headers={
            "Content-Type": "application/atom+xml; charset=utf-8",
            "Cache-Control": f"max-age={ttl}, public",
            "X-Cache-Lookup": "MISS",
        },
    )


@router.post("/explain")
async def explain_recommendation(payload: dict):
    """
    Dedicated endpoint to generate or re-generate an explanation for an issue
    and developer skill combination.
    """
    issue = payload.get("issue", {})
    user_skills = payload.get("user_skills", [])
    if not issue:
        raise HTTPException(status_code=400, detail="Missing issue data")
    return await generate_issue_match_explanation(issue, user_skills)
