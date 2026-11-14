"""Rule-based extraction of the skills an issue needs (Issue #271).

Reads the issue title, body and labels and looks the words up in
`app/data/issue_skill_keywords.json`. This is a baseline: no model, no network,
and every result says where it came from so it is easy to check.
"""

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import TypedDict

ISSUE_SKILL_KEYWORDS_FILE = (
    Path(__file__).resolve().parent.parent / "data" / "issue_skill_keywords.json"
)

# How much one mention counts, by where it was found. Same order as the
# title 3x / labels 2x / body 1x weighting in matching_service.
SOURCE_WEIGHTS = {"title": 0.9, "labels": 0.9, "body": 0.6}
AMBIGUOUS_FACTOR = 0.5
IMPLIED_FACTOR = 0.8

# Same characters as matching_service._tokens, plus "_" for names like read_csv,
# but case is kept so ambiguous words ("Go") can be told apart from English ("go").
_TOKEN = re.compile(r"[A-Za-z0-9][A-Za-z0-9+#._\-]*")


class ExtractedSkill(TypedDict):
    name: str
    confidence: float
    source: str


def _tokens(text: str | None) -> list[str]:
    return [t.rstrip(".-") for t in _TOKEN.findall(text or "")]


@lru_cache(maxsize=1)
def load_issue_skill_keywords() -> dict:
    """Load the keyword dictionary. A missing or broken file means no skills are found."""
    try:
        with open(ISSUE_SKILL_KEYWORDS_FILE, encoding="utf-8") as f:
            return json.load(f).get("skills", {})
    except (OSError, ValueError):
        return {}


@lru_cache(maxsize=1)
def _lookup() -> tuple[dict, dict, list[tuple[str, str]], dict, int]:
    """Build the lookup tables once.

    Returns (aliases, ambiguous, extensions, implies, longest alias in tokens):
    aliases and ambiguous map a tuple of tokens to a skill name; aliases are
    lower case, ambiguous keep the exact spelling that has to be used.
    """
    aliases: dict[tuple[str, ...], str] = {}
    ambiguous: dict[tuple[str, ...], str] = {}
    extensions: list[tuple[str, str]] = []
    implies: dict[str, list[str]] = {}

    for name, entry in load_issue_skill_keywords().items():
        for alias in [name, *entry.get("aliases", [])]:
            aliases[tuple(t.lower() for t in _tokens(alias))] = name
        for word in entry.get("ambiguous", []):
            ambiguous[tuple(_tokens(word))] = name
        for ext in entry.get("extensions", []):
            extensions.append((ext.lower(), name))
        if entry.get("implies"):
            implies[name] = list(entry["implies"])

    # A skill named like an English word ("Go") must only match through its
    # ambiguous spelling, not through the lower-case name added above.
    for key in ambiguous:
        aliases.pop(tuple(t.lower() for t in key), None)

    longest = max((len(k) for k in [*aliases, *ambiguous]), default=1)
    return aliases, ambiguous, extensions, implies, longest


def _mentions(
    text: str | None, case_sensitive_ambiguous: bool
) -> list[tuple[str, float]]:
    """Every (skill, factor) mentioned in the text; factor is 1, or less for ambiguous words."""
    aliases, ambiguous, extensions, _, longest = _lookup()
    ambiguous_lower = {tuple(t.lower() for t in k): v for k, v in ambiguous.items()}
    tokens = _tokens(text)
    lower = [t.lower() for t in tokens]
    found: list[tuple[str, float]] = []
    i = 0

    while i < len(tokens):
        for size in range(min(longest, len(tokens) - i), 0, -1):
            key = tuple(lower[i : i + size])
            if key in aliases:
                found.append((aliases[key], 1.0))
                break
            if case_sensitive_ambiguous:
                match = ambiguous.get(tuple(tokens[i : i + size]))
                factor = AMBIGUOUS_FACTOR
            else:
                match = ambiguous_lower.get(key)
                factor = 1.0
            if match:
                found.append((match, factor))
                break
        else:
            size = 1
            # File names: utils.py, Package.swift. Skipped when the token is an
            # alias itself, so "node.js" is Node.js and not a JavaScript file.
            for ext, name in extensions:
                if lower[i].endswith(ext) and len(lower[i]) > len(ext):
                    found.append((name, 1.0))
                    break
        i += size

    return found


def extract_issue_skills(
    title: str | None,
    body: str | None = None,
    labels: list[str] | None = None,
) -> list[ExtractedSkill]:
    """Skills an issue needs, as [{"name", "confidence", "source"}], highest confidence first.

    confidence is between 0 and 1: each mention adds weight by where it was
    found (title and labels more than body) and repeated mentions push it up.
    source is the strongest place the skill was found, or "implied" when it
    only comes from another skill (FastAPI -> Python).
    """
    fields = (
        ("title", title, True),
        # Labels are chosen on purpose, so a "go" label means Go.
        ("labels", " , ".join(labels or []), False),
        ("body", body, True),
    )
    miss: dict[str, float] = {}  # chance that every mention is wrong
    source: dict[str, str] = {}

    for field, text, case_sensitive in fields:
        for name, factor in _mentions(text, case_sensitive):
            miss[name] = miss.get(name, 1.0) * (1 - SOURCE_WEIGHTS[field] * factor)
            source.setdefault(name, field)

    confidence = {name: 1 - m for name, m in miss.items()}

    _, _, _, implies, _ = _lookup()
    for name in list(confidence):
        for parent in implies.get(name, []):
            implied = confidence[name] * IMPLIED_FACTOR
            if implied > confidence.get(parent, 0.0):
                confidence[parent] = implied
                source[parent] = "implied"

    return [
        {"name": name, "confidence": round(value, 2), "source": source[name]}
        for name, value in sorted(confidence.items(), key=lambda kv: (-kv[1], kv[0]))
    ]


def extract_skills_for_issue(issue: dict) -> list[ExtractedSkill]:
    """extract_issue_skills for an issue dict as returned by the GitHub search."""
    return extract_issue_skills(
        issue.get("title"), issue.get("body"), issue.get("labels") or []
    )
