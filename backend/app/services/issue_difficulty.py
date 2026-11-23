"""Estimate contributor effort from public GitHub issue metadata."""

import re
from collections.abc import Mapping
from typing import Any, Literal, TypedDict

Difficulty = Literal["Beginner", "Intermediate", "Advanced"]


class DifficultyEstimate(TypedDict):
    difficulty: Difficulty
    difficulty_reason: str


EXPLICIT_LEVELS: dict[str, Difficulty] = {
    **dict.fromkeys(
        (
            "beginner",
            "easy",
            "level 1",
            "level1",
            "l1",
            "l 1",
            "difficulty easy",
            "e easy",
        ),
        "Beginner",
    ),
    **dict.fromkeys(
        (
            "intermediate",
            "medium",
            "level 2",
            "level2",
            "l2",
            "l 2",
            "difficulty medium",
            "e medium",
        ),
        "Intermediate",
    ),
    **dict.fromkeys(
        (
            "advanced",
            "hard",
            "expert",
            "level 3",
            "level3",
            "l3",
            "l 3",
            "difficulty hard",
            "e hard",
        ),
        "Advanced",
    ),
}
LEVEL_ORDER = {"Beginner": 0, "Intermediate": 1, "Advanced": 2}
STARTER = {"good first issue", "first timers only", "starter", "good beginner issue"}
DOCS = {"docs", "documentation", "type docs", "a doc", "scope docs"}
ADVANCED_SCOPE = re.compile(
    r"\b(?:race condition|deadlock|concurren\w*|architectur\w*|parser|resolver|"
    r"breaking change|sourcemaps?|data corruption|memory leak|numeric dtypes?)\b",
    re.IGNORECASE,
)
PATH = re.compile(
    r"\b(?:[\w.-]+/)*[\w.-]+\.(?:py|tsx?|jsx?|mjs|rs|go|java|md|ya?ml|toml|json|css|html)\b"
)
LINKED_PR = re.compile(r"https://github\.com/[\w.-]+/[\w.-]+/pull/\d+\b", re.IGNORECASE)
NARROW_CHANGE = re.compile(
    r"\b(?:typo|docstring|wording|example|grammar|readme|documentation)\b",
    re.IGNORECASE,
)


def _result(level: Difficulty, reason: str) -> DifficultyEstimate:
    return {"difficulty": level, "difficulty_reason": reason}


def estimate_issue_difficulty(issue: Mapping[str, Any]) -> DifficultyEstimate:
    """Return a deterministic, human-readable estimate without fetching related records."""
    labels = issue.get("labels")
    normalized = set()
    for item in labels if isinstance(labels, list) else ():
        value = item.get("name") if isinstance(item, Mapping) else item
        if isinstance(value, str):
            normalized.add(re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip())
    declared = {
        EXPLICIT_LEVELS[label] for label in normalized if label in EXPLICIT_LEVELS
    }
    if declared:
        highest = max(declared, key=LEVEL_ORDER.__getitem__)
        return _result(
            highest,
            "Conflicting difficulty labels; showing the higher level."
            if len(declared) > 1
            else f"The repository labels this issue {highest.lower()}.",
        )

    title = issue.get("title")
    body = issue.get("body")
    title = title[:300] if isinstance(title, str) else ""
    body = body[:10000] if isinstance(body, str) else ""
    comments = issue.get("comments")
    comments = comments if type(comments) is int and comments >= 0 else 0
    references = len(set(PATH.findall(body)))
    links = len(set(LINKED_PR.findall(body)))
    broad_signals = sum(
        (len(body) >= 2000, references >= 3, comments >= 15, links >= 2)
    )
    if ADVANCED_SCOPE.search(title) or (
        broad_signals >= 2 and ADVANCED_SCOPE.search(body)
    ):
        return _result(
            "Advanced",
            "The issue describes changes to core behavior or a complex failure mode.",
        )
    if broad_signals >= 3:
        return _result(
            "Advanced",
            "Several files, linked changes, or a long discussion suggest a wider investigation.",
        )
    if broad_signals >= 2:
        return _result(
            "Intermediate",
            "The issue has several scope signals that warrant investigation before editing.",
        )
    if normalized & STARTER:
        return _result(
            "Beginner",
            "A starter label and limited scope signals suggest a contained change.",
        )
    if (normalized & DOCS or NARROW_CHANGE.search(title)) and not broad_signals:
        return _result(
            "Beginner",
            "The issue appears to be a contained documentation or example change.",
        )
    return _result(
        "Intermediate",
        "The available details suggest reviewing the affected component before changing it.",
    )
