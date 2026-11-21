from datetime import UTC, datetime
from typing import Any
from xml.etree import ElementTree

from fastapi import APIRouter, HTTPException, Query, Request, Response

from app.ai.ai_service import generate_issue_match_explanation
from app.services.embedding_service import similarities
from app.services.github_service import (
    GitHubRateLimitError,
    get_user_repositories,
)
from app.services.issue_service import search_github_issues
from app.services.matching_service import build_idf, calculate_issue_score
from app.services.skill_service import analyze_skills
from app.utils.validation import validate_github_username, validate_skill

router = APIRouter(
    prefix="/matching",
    tags=["Matching"],
)

ATOM_NS = "http://www.w3.org/2005/Atom"
ElementTree.register_namespace("", ATOM_NS)


def _atom_date(value: str | None) -> str:
    """Return an Atom-compatible UTC timestamp, tolerating incomplete issue data."""
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None
        if parsed is None or parsed.tzinfo is None:
            raise ValueError("Missing timezone")
    except ValueError:
        parsed = datetime.now(UTC)
    return parsed.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _atom_element(parent: ElementTree.Element, name: str, text: str) -> None:
    ElementTree.SubElement(parent, f"{{{ATOM_NS}}}{name}").text = text


@router.get("/users/{username}/issues")
async def get_matched_issues(
    username: str,
    exclude_stale: bool = Query(default=False),
    skills: list[str] | None = Query(default=None),
):
    validated_username = validate_github_username(username)

    # Validate explicit skills if provided
    validated_custom_skills = None
    if skills is not None:
        flat_skills: list[str] = []
        for s in skills:
            for item in s.split(","):
                item_clean = item.strip()
                if item_clean:
                    flat_skills.append(validate_skill(item_clean))
        validated_custom_skills = flat_skills

    repositories = await get_user_repositories(validated_username)

    if repositories is None:
        raise HTTPException(
            status_code=404,
            detail="GitHub user not found",
        )

    if validated_custom_skills is not None:
        user_skills = validated_custom_skills
    else:
        skill_data = analyze_skills(repositories)
        user_skills = [skill["name"] for skill in skill_data["skills"]]

    # Relative weight of each skill, so a main language counts for more than a side one.
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

        except GitHubRateLimitError:
            # Every remaining search would fail too, so tell the caller.
            raise

        except Exception:
            # One failed language search should not
            # break the entire recommendation request.
            continue

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

    return {
        "username": validated_username,
        "skills": user_skills,
        "recommendations": top_recommendations,
    }


@router.get("/users/{username}/feed.atom", response_class=Response)
async def get_matched_issues_feed(username: str, request: Request) -> Response:
    """Expose the same ranked matches as an Atom feed for feed readers."""
    matches = await get_matched_issues(username, exclude_stale=False)
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
        feed, f"{{{ATOM_NS}}}link", {"href": str(request.url), "rel": "self"}
    )
    author = ElementTree.SubElement(feed, f"{{{ATOM_NS}}}author")
    _atom_element(author, "name", "OpenSourceMate")

    for issue in recommendations:
        entry = ElementTree.SubElement(feed, f"{{{ATOM_NS}}}entry")
        issue_url = issue["url"]
        repository = issue["repository"]
        _atom_element(entry, "id", issue_url)
        _atom_element(entry, "title", issue["title"])
        _atom_element(entry, "updated", _atom_date(issue.get("updated_at")))
        ElementTree.SubElement(entry, f"{{{ATOM_NS}}}link", {"href": issue_url})
        ElementTree.SubElement(entry, f"{{{ATOM_NS}}}category", {"term": repository})
        _atom_element(
            entry,
            "summary",
            f"Repository: {repository}; match score: {issue['match_score']}%",
        )

    return Response(
        content=ElementTree.tostring(feed, encoding="utf-8", xml_declaration=True),
        media_type="application/atom+xml",
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
