"""Scoring configuration dataclass and defaults for OpenSourceMate match scoring (#422).

Contains all weights, multipliers, point caps, and thresholds used by
`calculate_issue_score` to determine developer-issue compatibility.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ScoringConfig:
    """Typed, validated configuration of match scoring weights and thresholds.

    All weights and thresholds are explicit and documented to eliminate magic numbers.
    """

    # --- Direct Language Match ---
    # Points awarded when the primary programming language of the issue repository
    # matches a skill in the developer's profile, scaled by the user's skill weight (0.0 to 1.0).
    language_match_weight: float = 40.0

    # --- Term / TF-IDF Mentions ---
    # Maximum points that can be contributed by keyword / TF-IDF text mentions across
    # the issue's title, body, labels, and repository name.
    max_text_points: int = 30

    # Multiplier in the logarithmic text points accumulation formula:
    # points = text_term_multiplier * skill_weight * idf * (1 + ln(count)) / text_log_scale_divisor
    text_term_multiplier: float = 12.0
    text_log_scale_divisor: float = 2.0

    # Weights applied when counting skill occurrences in different issue fields:
    # Title mentions count 3x, labels & repository name count 2x, body counts 1x.
    title_term_weight: int = 3
    labels_term_weight: int = 2
    repo_term_weight: int = 2
    body_term_weight: int = 1

    # --- Optional Semantic / Vector Embeddings ---
    # Maximum points contributed when sentence-transformer embedding cosine similarity is available.
    max_embedding_points: int = 25

    # --- Community Label Bonuses ---
    # Bonus points awarded for newcomer-friendly issue labels:
    good_first_issue_bonus: int = 25
    help_wanted_bonus: int = 15

    # --- Activity & Freshness Thresholds & Bonuses ---
    # Bonus points for recently updated issues:
    activity_recent_days_threshold: int = 30
    activity_recent_bonus: int = 10

    activity_moderate_days_threshold: int = 90
    activity_moderate_bonus: int = 5

    # Freshness categorization thresholds (days):
    freshness_active_days_threshold: int = 14
    freshness_stale_days_threshold: int = 60

    # --- Discussion / Comment Count Threshold & Bonus ---
    # Bonus for manageable comment discussions (avoids crowded issues with lots of back-and-forth):
    comments_max_threshold: int = 10
    comments_manageable_bonus: int = 10

    # --- Overall Score Clamping Range ---
    min_score: int = 0
    max_score: int = 100


# Default global scoring configuration instance
DEFAULT_SCORING_CONFIG = ScoringConfig()
