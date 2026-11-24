#!/usr/bin/env python3
"""Print the match score breakdown for sample or custom profile and issue data (#422).

This script operates 100% locally with zero network calls or external dependencies.
Usage:
    python scripts/explain_score.py
    python scripts/explain_score.py --help
"""

import argparse
import json
import math
import sys
from datetime import UTC, datetime
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.matching_service import (
    _issue_term_counts,
    _skill_entries,
    calculate_issue_score,
)
from app.services.scoring_config import DEFAULT_SCORING_CONFIG, ScoringConfig


SAMPLE_PROFILE = [
    {"name": "Python", "weight": 1.0},
    {"name": "FastAPI", "weight": 0.8},
    {"name": "Docker", "weight": 0.5},
]

SAMPLE_ISSUE = {
    "id": 101,
    "title": "Add async route handlers with FastAPI and Python",
    "repository": "tiangolo/fastapi",
    "language": "Python",
    "labels": ["good first issue", "help wanted"],
    "body": "We need help refactoring Docker container configs and writing FastAPI endpoint tests in Python.",
    "comments": 2,
    "updated_at": datetime.now(UTC).isoformat(),
}


def explain_match_score(
    issue: dict,
    user_skills: list,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
    idf: dict[str, float] | None = None,
    embedding_similarity: float | None = None,
) -> dict:
    """Calculate and explain every scoring component in detail."""
    skills = _skill_entries(user_skills)
    labels = {label.lower() for label in issue.get("labels", [])}
    breakdown: dict = {
        "components": {},
        "subtotal": 0,
        "clamped_score": 0,
        "raw_score": 0,
        "reasons": [],
    }

    # 1. Primary Language Match
    issue_language = issue.get("language")
    lang_points = 0
    if issue_language and issue_language.lower() in skills:
        lang_points = round(config.language_match_weight * skills[issue_language.lower()])
        breakdown["reasons"].append(f"Your profile includes {issue_language}.")

    breakdown["components"]["primary_language_match"] = {
        "language": issue_language,
        "profile_weight": skills.get(issue_language.lower(), 0.0) if issue_language else 0.0,
        "base_weight": config.language_match_weight,
        "points": lang_points,
    }

    # 1b. Text Term / TF-IDF Mentions
    counts = _issue_term_counts(issue, set(skills), config=config)
    effective_idf = idf or {}
    text_points_raw = 0.0
    matched_skills = []
    term_details = {}

    for name, count in counts.items():
        if not count:
            continue
        matched_skills.append(name)
        weight = skills.get(name, 1.0)
        term_idf = effective_idf.get(name, 1.0)
        contrib = (
            config.text_term_multiplier
            * weight
            * term_idf
            * (1 + math.log(count))
            / config.text_log_scale_divisor
        )
        text_points_raw += contrib
        term_details[name] = {
            "occurrences": count,
            "weight": weight,
            "idf": round(term_idf, 3),
            "unrounded_points": round(contrib, 2),
        }

    capped_text_points = min(round(text_points_raw), config.max_text_points)
    if capped_text_points:
        breakdown["reasons"].append("The issue mentions " + ", ".join(sorted(matched_skills)) + ".")

    breakdown["components"]["text_mentions"] = {
        "raw_accumulated": round(text_points_raw, 2),
        "capped_points": capped_text_points,
        "max_allowed": config.max_text_points,
        "terms": term_details,
    }

    # Optional Semantic Similarity
    embedding_points = 0
    if embedding_similarity is not None:
        embedding_points = round(config.max_embedding_points * embedding_similarity)
        if embedding_points:
            breakdown["reasons"].append("The issue is semantically close to your skills.")

    breakdown["components"]["semantic_embeddings"] = {
        "similarity": embedding_similarity,
        "max_points": config.max_embedding_points,
        "points": embedding_points,
    }

    # 2. Good First Issue
    gfi_points = config.good_first_issue_bonus if "good first issue" in labels else 0
    if gfi_points:
        breakdown["reasons"].append("This issue is marked as a good first issue.")
    breakdown["components"]["good_first_issue"] = {
        "present": "good first issue" in labels,
        "bonus": config.good_first_issue_bonus,
        "points": gfi_points,
    }

    # 3. Help Wanted
    hw_points = config.help_wanted_bonus if "help wanted" in labels else 0
    if hw_points:
        breakdown["reasons"].append("The repository is actively looking for contributors.")
    breakdown["components"]["help_wanted"] = {
        "present": "help wanted" in labels,
        "bonus": config.help_wanted_bonus,
        "points": hw_points,
    }

    # 4. Activity Recency
    updated_at = issue.get("updated_at")
    activity_points = 0
    days_old = None
    if updated_at:
        try:
            updated = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            days_old = (datetime.now(UTC) - updated).days
            if days_old <= config.activity_recent_days_threshold:
                activity_points = config.activity_recent_bonus
                breakdown["reasons"].append("This issue has been active recently.")
            elif days_old <= config.activity_moderate_days_threshold:
                activity_points = config.activity_moderate_bonus
                breakdown["reasons"].append("This issue has recent activity.")
        except ValueError:
            pass

    breakdown["components"]["recent_activity"] = {
        "days_ago": days_old,
        "points": activity_points,
    }

    # 5. Comment Count
    comments = issue.get("comments", 0)
    comments_points = (
        config.comments_manageable_bonus if comments <= config.comments_max_threshold else 0
    )
    if comments_points:
        breakdown["reasons"].append("The issue has a manageable discussion size.")
    breakdown["components"]["comment_discussion_size"] = {
        "comments": comments,
        "max_threshold": config.comments_max_threshold,
        "points": comments_points,
    }

    subtotal = (
        lang_points
        + capped_text_points
        + embedding_points
        + gfi_points
        + hw_points
        + activity_points
        + comments_points
    )
    clamped = max(config.min_score, min(subtotal, config.max_score))

    breakdown["subtotal"] = subtotal
    breakdown["raw_score"] = subtotal
    breakdown["clamped_score"] = clamped
    return breakdown


def print_score_breakdown(
    issue: dict,
    user_skills: list,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
    as_json: bool = False,
) -> None:
    """Print the human-readable or JSON score breakdown report."""
    breakdown = explain_match_score(issue, user_skills, config=config)
    calculated = calculate_issue_score(issue, user_skills, config=config)

    if as_json:
        print(json.dumps({"breakdown": breakdown, "service_output": calculated}, indent=2))
        return

    print("======================================================================")
    print("                OPENSOURCEMATE MATCH SCORE BREAKDOWN                  ")
    print("======================================================================")
    print(f"Issue Title : {issue.get('title')}")
    print(f"Repository  : {issue.get('repository')}")
    print(f"Language    : {issue.get('language')}")
    print(f"Labels      : {', '.join(issue.get('labels', []))}")
    print(f"Comments    : {issue.get('comments', 0)}")
    print(f"Profile     : {', '.join(s['name'] if isinstance(s, dict) else str(s) for s in user_skills)}")
    print("----------------------------------------------------------------------")
    print(f"{'Scoring Component':<32} | {'Contribution / Points':<30}")
    print("----------------------------------------------------------------------")

    c = breakdown["components"]
    print(f"{'1. Primary Language Match':<32} | +{c['primary_language_match']['points']} pts (weight: {c['primary_language_match']['profile_weight']})")
    print(f"{'2. Keyword / TF-IDF Mentions':<32} | +{c['text_mentions']['capped_points']} pts (raw: {c['text_mentions']['raw_accumulated']}, cap: {c['text_mentions']['max_allowed']})")
    for term, data in c["text_mentions"]["terms"].items():
        print(f"     └─ {term:<24} |   {data['occurrences']} mention(s) -> {data['unrounded_points']} pts")
    if c["semantic_embeddings"]["similarity"] is not None:
        print(f"{'3. Semantic Embeddings':<32} | +{c['semantic_embeddings']['points']} pts (sim: {c['semantic_embeddings']['similarity']})")
    print(f"{'4. Good First Issue Bonus':<32} | +{c['good_first_issue']['points']} pts (present: {c['good_first_issue']['present']})")
    print(f"{'5. Help Wanted Bonus':<32} | +{c['help_wanted']['points']} pts (present: {c['help_wanted']['present']})")
    print(f"{'6. Recent Activity Bonus':<32} | +{c['recent_activity']['points']} pts (updated: {c['recent_activity']['days_ago']}d ago)")
    print(f"{'7. Manageable Discussion':<32} | +{c['comment_discussion_size']['points']} pts ({c['comment_discussion_size']['comments']} comments <= {c['comment_discussion_size']['max_threshold']})")
    print("----------------------------------------------------------------------")
    print(f"{'Raw Subtotal':<32} | {breakdown['subtotal']} pts")
    print(f"{'Final Clamped Score (0 - 100)':<32} | {breakdown['clamped_score']} / 100")
    print(f"{'Service Score Result':<32} | {calculated['score']} / 100")
    print("----------------------------------------------------------------------")
    print("Match Reasons:")
    for r in breakdown["reasons"]:
        print(f"  • {r}")
    print("======================================================================\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Print score breakdown for a sample profile and issue without network access."
    )
    parser.add_argument("--json", action="store_true", help="Output breakdown as structured JSON")
    args = parser.parse_args()

    print_score_breakdown(SAMPLE_ISSUE, SAMPLE_PROFILE, as_json=args.json)


if __name__ == "__main__":
    main()
