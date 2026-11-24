import math
import re
from collections import Counter
from datetime import UTC, datetime

from app.services.scoring_config import DEFAULT_SCORING_CONFIG, ScoringConfig

SCORE_METHOD = "keyword-tfidf"
MAX_TEXT_POINTS = DEFAULT_SCORING_CONFIG.max_text_points
MAX_EMBEDDING_POINTS = DEFAULT_SCORING_CONFIG.max_embedding_points

_TOKEN = re.compile(r"[a-z0-9][a-z0-9+#.\-]*")


def _tokens(text: str | None) -> list[str]:
    return [t.strip(".-") for t in _TOKEN.findall((text or "").lower())]


def _skill_entries(user_skills: list) -> dict[str, float]:
    """Accept plain names or {"name", "weight"} dicts; return lower-case name -> weight."""
    entries = {}

    for skill in user_skills:
        if isinstance(skill, dict):
            entries[skill["name"].lower()] = float(skill.get("weight", 1.0))
        else:
            entries[str(skill).lower()] = 1.0

    return entries


def _issue_term_counts(
    issue: dict,
    skill_names: set[str],
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> Counter[str]:
    """Weighted mentions of each skill: title counts 3x, labels and repo name 2x, body 1x."""
    fields = (
        (issue.get("title"), config.title_term_weight),
        (" ".join(issue.get("labels", [])), config.labels_term_weight),
        (issue.get("repository"), config.repo_term_weight),
        (issue.get("body"), config.body_term_weight),
    )
    counts: Counter[str] = Counter()

    for text, weight in fields:
        tokens = _tokens(text)
        joined = " " + " ".join(tokens) + " "

        for name in skill_names:
            if " " in name:
                counts[name] += weight * joined.count(f" {name} ")
            else:
                counts[name] += weight * tokens.count(name)

    return counts


def categorize_issue_freshness(
    updated_at_str: str | None,
    now: datetime | None = None,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> dict:
    """
    Categorize issue freshness into 'Active', 'Recent', or 'Stale'
    along with days since last update, human-readable label, and is_stale flag.
    """
    if not updated_at_str:
        return {
            "status": "Unknown",
            "days_ago": None,
            "label": "Unknown activity",
            "is_stale": False,
        }

    try:
        updated = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
        current_time = now or datetime.now(UTC)
        days = max(0, (current_time - updated).days)

        if days <= config.freshness_active_days_threshold:
            status = "Active"
            is_stale = False
        elif days <= config.freshness_stale_days_threshold:
            status = "Recent"
            is_stale = False
        else:
            status = "Stale"
            is_stale = True

        if days == 0:
            label = "Updated today"
        elif days == 1:
            label = "Updated yesterday"
        else:
            label = f"Updated {days}d ago"

        return {
            "status": status,
            "days_ago": days,
            "label": label,
            "is_stale": is_stale,
        }
    except (ValueError, TypeError):
        return {
            "status": "Unknown",
            "days_ago": None,
            "label": "Unknown activity",
            "is_stale": False,
        }


def build_idf(
    issues: list[dict],
    user_skills: list,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> dict[str, float]:
    """Inverse document frequency of each skill over the fetched issues.

    A skill that shows up in every issue (the one we searched for) says little
    about which issue fits best, so it gets a lower weight than a rare one.
    """
    names = set(_skill_entries(user_skills))
    document_frequency: Counter[str] = Counter()

    for issue in issues:
        for name, count in _issue_term_counts(issue, names, config=config).items():
            if count:
                document_frequency[name] += 1

    total = len(issues)

    return {
        name: math.log((total + 1) / (document_frequency[name] + 1)) + 1
        for name in names
    }


def calculate_issue_score(
    issue: dict,
    user_skills: list,
    idf: dict[str, float] | None = None,
    embedding_similarity: float | None = None,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> dict:
    """
    Calculate a transparent compatibility score between
    a GitHub issue and a user's skills using configurable weights.
    """

    score = 0
    reasons = []
    skills = _skill_entries(user_skills)

    labels = {label.lower() for label in issue.get("labels", [])}

    # -----------------------------------
    # 1. Skill / language match
    # -----------------------------------

    issue_language = issue.get("language")

    # The language only counts when it is known and in the profile, and
    # a skill the user relies on more is worth more.
    if issue_language and issue_language.lower() in skills:
        score += round(config.language_match_weight * skills[issue_language.lower()])
        reasons.append(f"Your profile includes {issue_language}.")

    # -----------------------------------
    # 1b. Skills mentioned in the title, body, labels or repo name
    # -----------------------------------

    counts = _issue_term_counts(issue, set(skills), config=config)
    idf = idf or {}
    matched_skills = []
    text_points = 0.0

    for name, count in counts.items():
        if not count:
            continue

        matched_skills.append(name)
        # Repeated mentions help, with diminishing returns.
        text_points += (
            config.text_term_multiplier
            * skills[name]
            * idf.get(name, 1.0)
            * (1 + math.log(count))
            / config.text_log_scale_divisor
        )

    text_points = min(round(text_points), config.max_text_points)

    # Optional semantic score, only present when the embedding model is available.
    if embedding_similarity is not None:
        embedding_points = round(config.max_embedding_points * embedding_similarity)
        if embedding_points:
            score += embedding_points
            reasons.append("The issue is semantically close to your skills.")

    if text_points:
        score += text_points
        reasons.append("The issue mentions " + ", ".join(sorted(matched_skills)) + ".")

    # -----------------------------------
    # 2. Good first issue
    # -----------------------------------

    if "good first issue" in labels:
        score += config.good_first_issue_bonus
        reasons.append("This issue is marked as a good first issue.")

    # -----------------------------------
    # 3. Help wanted
    # -----------------------------------

    if "help wanted" in labels:
        score += config.help_wanted_bonus
        reasons.append("The repository is actively looking for contributors.")

    # -----------------------------------
    # 4. Issue activity
    # -----------------------------------

    updated_at = issue.get("updated_at")

    if updated_at:
        try:
            updated = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))

            days_old = (datetime.now(UTC) - updated).days

            if days_old <= config.activity_recent_days_threshold:
                score += config.activity_recent_bonus
                reasons.append("This issue has been active recently.")

            elif days_old <= config.activity_moderate_days_threshold:
                score += config.activity_moderate_bonus
                reasons.append("This issue has recent activity.")

        except ValueError:
            pass

    # -----------------------------------
    # 5. Comment count
    # -----------------------------------

    comments = issue.get("comments", 0)

    if comments <= config.comments_max_threshold:
        score += config.comments_manageable_bonus
        reasons.append("The issue has a manageable discussion size.")

    # Keep the uncapped value so results that both reach 100 can still be ordered.
    raw_score = score

    # Clamp score strictly within [min_score, max_score]
    score = max(config.min_score, min(score, config.max_score))

    freshness = categorize_issue_freshness(updated_at, config=config)

    return {
        "score": score,
        "freshness": freshness,
        "raw_score": raw_score,
        "matched_skills": sorted(matched_skills),
        "score_method": (
            "keyword-tfidf+embeddings"
            if embedding_similarity is not None
            else SCORE_METHOD
        ),
        "reasons": reasons,
    }
