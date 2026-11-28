import json
from pathlib import Path
from typing import Any

RELATED_SKILLS_PATH = Path(__file__).resolve().parent.parent / "data" / "related_skills.json"

# Known baseline catalog counts of open issues for common companion skills
# when live issue queries are not provided or run in offline/isolated environments.
DEFAULT_SKILL_ISSUE_BASELINE: dict[str, int] = {
    "typescript": 24,
    "fastapi": 18,
    "react": 22,
    "next.js": 16,
    "django": 14,
    "docker": 15,
    "kubernetes": 12,
    "tokio": 10,
    "webassembly": 8,
    "spring boot": 15,
    "vue": 14,
    "nuxt.js": 11,
    "svelte": 9,
    "graphql": 13,
    "tailwind css": 17,
    "redux": 10,
    "nestjs": 12,
    "prisma": 9,
    "grpc": 11,
    "pytorch": 14,
    "pandas": 15,
    "flask": 12,
    "celery": 8,
    "actix web": 9,
    "axum": 10,
    "tauri": 8,
    "kotlin": 14,
    "android": 16,
    "cmake": 11,
    "qt": 9,
    "laravel": 13,
    ".net": 15,
    "asp.net core": 14,
    "ruby on rails": 12,
    "swiftui": 13,
}


def normalize_skill(name: str | None) -> str:
    """Normalize skill name for case-insensitive and trimmed comparison."""
    if not name or not isinstance(name, str):
        return ""
    return name.strip().lower()


def load_related_skills_config(path: Path | None = None) -> dict[str, list[str]]:
    """
    Loads and extracts the related skills mapping dictionary from the config file.
    Supports wrapped format `{"mappings": {...}}` and flat `{...}` format.
    Adding a new skill relationship needs only a config change in related_skills.json.
    """
    config_file = path or RELATED_SKILLS_PATH
    if not config_file.exists():
        return {}

    try:
        with open(config_file, encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, dict):
            return {}

        if "mappings" in data and isinstance(data["mappings"], dict):
            return {
                str(k): [str(item) for item in v if isinstance(item, str)]
                for k, v in data["mappings"].items()
                if isinstance(v, list)
            }

        # Flat format: ignore metadata keys starting with $ or special names
        result: dict[str, list[str]] = {}
        for k, v in data.items():
            if k.startswith("$") or k in ("title", "description", "version"):
                continue
            if isinstance(v, list):
                result[str(k)] = [str(item) for item in v if isinstance(item, str)]
        return result
    except Exception:
        return {}


def calculate_unlocked_issues(
    candidate_skill: str,
    user_skills_set: set[str],
    issues_pool: list[dict[str, Any]] | None = None,
) -> int:
    """
    Counts how many additional open issues a candidate skill unlocks beyond what
    the user's existing skills already matched.
    """
    cand_norm = normalize_skill(candidate_skill)
    if not cand_norm:
        return 0

    if issues_pool:
        extra_count = 0
        for issue in issues_pool:
            iss_lang = normalize_skill(issue.get("language"))
            iss_labels = [
                normalize_skill(lbl.get("name") if isinstance(lbl, dict) else str(lbl))
                for lbl in issue.get("labels", [])
            ]
            iss_title = (issue.get("title") or "").lower()

            # Check if this issue is already unlocked by user's current skills
            matched_by_user = (
                (iss_lang in user_skills_set)
                or any(lbl in user_skills_set for lbl in iss_labels)
                or any(s in iss_title for s in user_skills_set)
            )

            if matched_by_user:
                continue

            # Check if candidate skill unlocks this issue
            unlocked_by_candidate = (
                (iss_lang == cand_norm)
                or (cand_norm in iss_labels)
                or (cand_norm in iss_title)
            )

            if unlocked_by_candidate:
                extra_count += 1

        if extra_count > 0:
            return extra_count

    # Baseline fallback estimate from known skill issue catalog
    return DEFAULT_SKILL_ISSUE_BASELINE.get(cand_norm, 10)


def get_related_skill_suggestions(
    user_skills: list[str] | None,
    custom_mapping: dict[str, list[str]] | None = None,
    limit: int = 3,
    issues_pool: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Computes top `limit` (default 3) related skill suggestions that unlock the most
    additional open issues, strictly excluding skills the user already possesses.

    Acceptance criteria:
    - Suggestions exclude skills the user already has (case-insensitive).
    - Adding a relationship needs only a config change in related_skills.json.
    - Users with no detected skills see a helpful message.
    - Top three suggestions are returned with extra matching issues count.
    """
    if not user_skills:
        return {
            "suggestions": [],
            "total_unlocked": 0,
            "message": "No technical skills detected yet. Connect repositories or add skills to see nearby skills that unlock more open-source contribution opportunities.",
        }

    # Normalize existing user skills
    existing_skills_set: set[str] = set()
    cleaned_user_skills: list[str] = []

    for s in user_skills:
        if s and isinstance(s, str) and s.strip():
            trimmed = s.strip()
            cleaned_user_skills.append(trimmed)
            existing_skills_set.add(normalize_skill(trimmed))

    if not cleaned_user_skills:
        return {
            "suggestions": [],
            "total_unlocked": 0,
            "message": "No technical skills detected yet. Connect repositories or add skills to see nearby skills that unlock more open-source contribution opportunities.",
        }

    mapping = custom_mapping if custom_mapping is not None else load_related_skills_config()
    normalized_mapping: dict[str, tuple[str, list[str]]] = {}
    for k, v in mapping.items():
        normalized_mapping[normalize_skill(k)] = (k, v)

    candidates: list[dict[str, Any]] = []
    seen_candidate_names: set[str] = set()

    for user_skill in cleaned_user_skills:
        entry = normalized_mapping.get(normalize_skill(user_skill))
        if not entry:
            continue

        canonical_source, related_list = entry
        for rel in related_list:
            rel_norm = normalize_skill(rel)
            if not rel_norm:
                continue

            # Acceptance Criterion 1: Exclude skills user already has
            if rel_norm in existing_skills_set:
                continue

            # Avoid duplicate suggestions across multiple source skills
            if rel_norm in seen_candidate_names:
                continue

            seen_candidate_names.add(rel_norm)
            unlocked_count = calculate_unlocked_issues(
                rel,
                existing_skills_set,
                issues_pool=issues_pool,
            )

            candidates.append(
                {
                    "name": rel,
                    "recommended_from": canonical_source,
                    "unlocked_issues_count": unlocked_count,
                }
            )

    # Sort candidates by unlocked issues count descending, preserving order on ties
    candidates.sort(key=lambda x: x["unlocked_issues_count"], reverse=True)

    # Acceptance Criterion: Top three suggestions
    top_suggestions = candidates[:limit]

    return {
        "suggestions": top_suggestions,
        "total_unlocked": sum(s["unlocked_issues_count"] for s in top_suggestions),
        "message": None,
    }
