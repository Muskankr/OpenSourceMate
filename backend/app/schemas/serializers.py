from typing import Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------
# Error Serializers
# ---------------------------------------------------------
class ErrorDetailSerializer(BaseModel):
    """Detailed error object conforming to the standardized error shape."""

    code: str = Field(
        ...,
        description="Unique machine-readable error code",
        json_schema_extra={"example": "NOT_FOUND"},
    )
    message: str = Field(
        ...,
        description="Human-readable error description",
        json_schema_extra={"example": "GitHub user not found"},
    )
    details: Any = Field(
        default=None,
        description="Optional diagnostic details or validation error list",
    )


class ErrorResponseSerializer(BaseModel):
    """Unified error envelope returned for all API error responses."""

    error: ErrorDetailSerializer
    detail: str = Field(
        ...,
        description="Top-level error message for backward compatibility",
    )
    reset_at: str | None = Field(
        default=None,
        description="ISO timestamp for rate limit resets",
    )


# ---------------------------------------------------------
# Health Check Serializers
# ---------------------------------------------------------
class HealthResponseSerializer(BaseModel):
    """Health check response serializer for GET /api/health and /api/health/."""

    status: str = Field(
        default="healthy",
        description="Current service health status",
        json_schema_extra={"example": "healthy"},
    )
    service: str = Field(
        default="OpenSourceMate API",
        description="Service identifier",
        json_schema_extra={"example": "OpenSourceMate API"},
    )
    version: str = Field(
        default="0.1.0",
        description="API semantic version",
        json_schema_extra={"example": "0.1.0"},
    )


class ReadinessResponseSerializer(BaseModel):
    """Readiness probe response serializer checking upstream dependencies (Issue #425)."""

    status: str = Field(
        ...,
        description="Current service readiness status: ready or not_ready",
        json_schema_extra={"example": "ready"},
    )
    service: str = Field(
        default="OpenSourceMate API",
        description="Service identifier",
        json_schema_extra={"example": "OpenSourceMate API"},
    )
    version: str = Field(
        default="0.1.0",
        description="API version",
        json_schema_extra={"example": "0.1.0"},
    )
    github_reachable: bool = Field(
        ...,
        description="Whether upstream GitHub API is reachable within short timeout",
        json_schema_extra={"example": True},
    )
    details: Any = Field(
        default=None,
        description="Optional diagnostic or error details",
    )


class HealthDiagnosticsSerializer(BaseModel):
    """Diagnostics payload with upstream service connectivity and cache metrics."""

    status: str = Field(
        ...,
        description="Overall health status",
        json_schema_extra={"example": "healthy"},
    )
    service: str = Field(default="OpenSourceMate API", description="Service identifier")
    version: str = Field(default="0.1.0", description="API version")
    github: dict[str, Any] = Field(
        ...,
        description="GitHub API connectivity and rate limit stats",
    )
    cache: dict[str, Any] = Field(..., description="In-memory cache metrics")


# ---------------------------------------------------------
# GitHub User and Repositories Serializers
# ---------------------------------------------------------
class GitHubUserProfileSerializer(BaseModel):
    """User profile response serializer matching standard profile payload."""

    username: str = Field(..., description="GitHub handle/login")
    name: str | None = Field(default=None, description="Display name")
    bio: str | None = Field(default=None, description="User biography")
    avatar_url: str = Field(..., description="URL to avatar image")
    public_repositories: int = Field(
        ..., description="Number of public repositories"
    )
    followers: int = Field(..., description="Follower count")
    following: int = Field(..., description="Following count")
    profile_url: str = Field(..., description="Public GitHub profile URL")


class ExtendedGitHubUserProfileSerializer(GitHubUserProfileSerializer):
    """Extended profile serializer including optional bio and social metadata."""

    location: str | None = Field(default=None, description="Location if provided")
    company: str | None = Field(default=None, description="Company or organization")
    blog: str | None = Field(default=None, description="Personal website or blog")
    twitter_username: str | None = Field(
        default=None, description="Twitter / X username"
    )
    created_at: str | None = Field(
        default=None, description="Account creation timestamp"
    )
    public_gists: int = Field(default=0, description="Public gist count")
    fetched_at: str | None = Field(
        default=None,
        description="ISO 8601 UTC timestamp when profile was retrieved (Issue #132)",
    )


class RepositoryItemSerializer(BaseModel):
    """Individual repository summary serializer."""

    name: str = Field(..., description="Repository name")
    description: str | None = Field(default=None, description="Repository description")
    language: str | None = Field(
        default=None, description="Primary programming language"
    )
    stars: int = Field(default=0, description="Star count")
    forks: int = Field(default=0, description="Fork count")
    is_fork: bool = Field(
        default=False, description="Whether this repository is a fork"
    )
    url: str = Field(..., description="HTML URL to repository")
    updated_at: str | None = Field(default=None, description="Last update ISO timestamp")


class RepositoryListSerializer(BaseModel):
    """List of repositories for a user with pagination metadata."""

    username: str = Field(..., description="Target GitHub username")
    repository_count: int = Field(
        ..., description="Total repository count returned"
    )
    total_pages_fetched: int = Field(
        default=1, description="Number of repository pages fetched from GitHub API"
    )
    has_more: bool = Field(
        default=False, description="Whether more repositories exist beyond the pagination cap"
    )
    fetched_at: str | None = Field(
        default=None,
        description="ISO 8601 UTC timestamp when repositories were retrieved (Issue #132)",
    )
    repositories: list[RepositoryItemSerializer] = Field(
        default_factory=list, description="Repository list"
    )


class TopRepositoriesResponseSerializer(BaseModel):
    """Top repositories by stars and recent activity (Issue #85)."""

    username: str = Field(..., description="GitHub username")
    exclude_forks: bool = Field(default=True, description="Whether forks were excluded")
    top_by_stars: list[RepositoryItemSerializer] = Field(
        default_factory=list, description="Top 5 repositories sorted by stars descending"
    )
    most_recent: list[RepositoryItemSerializer] = Field(
        default_factory=list, description="Top 5 repositories sorted by pushed_at/updated_at descending"
    )


# ---------------------------------------------------------
# Skill Analysis Serializers
# ---------------------------------------------------------
class SkillItemSerializer(BaseModel):
    """Individual skill breakdown serializer."""

    name: str = Field(..., description="Skill / technology name")
    repository_count: int = Field(
        ..., description="Number of repositories using this skill"
    )
    percentage: float = Field(..., description="Skill percentage weight")
    type: str | None = Field(
        default=None, description="Skill classification, e.g. language or framework"
    )
    weight: float | None = Field(
        default=None, description="Calculated skill weight"
    )
    group: str | None = Field(
        default=None,
        description="Associated technology ecosystem or group name (Issue #130)",
    )
    subskills: list[str] | None = Field(
        default=None,
        description="Constituent technologies if this item represents a combined group (Issue #130)",
    )
    proficiency: str | None = Field(
        default=None,
        description="Estimated proficiency level: Learning, Comfortable, or Strong (Issue #131)",
    )
    proficiency_score: float | None = Field(
        default=None,
        description="Calculated proficiency score from 0.0 to 10.0 (Issue #131)",
    )
    proficiency_reason: str | None = Field(
        default=None,
        description="Explanation of how the proficiency estimate was computed (Issue #131)",
    )


class UserSkillsSerializer(BaseModel):
    """Skill analysis output serializer."""

    username: str = Field(..., description="GitHub username analyzed")
    skills: list[SkillItemSerializer] = Field(
        default_factory=list, description="Extracted skills"
    )
    total_repositories_analyzed: int = Field(
        ..., description="Total count of analyzed repositories"
    )
    groups: dict[str, list[str]] | None = Field(
        default=None,
        description="Mapping of active technology groups to present constituent skills (Issue #130)",
    )
    analyzed_at: str | None = Field(
        default=None,
        description="ISO 8601 UTC timestamp indicating when this skill analysis was generated (Issue #132)",
    )


# ---------------------------------------------------------
# Issues & Matching Serializers
# ---------------------------------------------------------
class IssueLabelSerializer(BaseModel):
    """Issue label serializer."""

    name: str = Field(..., description="Label name")
    color: str | None = Field(default=None, description="Hex color")


class IssueItemSerializer(BaseModel):
    """Normalized GitHub issue item serializer."""

    id: int = Field(..., description="GitHub Issue ID")
    title: str = Field(..., description="Issue title")
    url: str = Field(..., description="Web link to issue")
    repository: str = Field(..., description="Full repository name (owner/repo)")
    labels: list[str | dict[str, Any]] = Field(
        default_factory=list, description="Attached labels"
    )
    comments: int = Field(default=0, description="Comment count")
    created_at: str = Field(..., description="Created ISO timestamp")
    updated_at: str = Field(..., description="Updated ISO timestamp")
    state: str = Field(default="open", description="Issue state")


class IssueSearchResponseSerializer(BaseModel):
    """Search results envelope for GitHub issues."""

    total_count: int = Field(..., description="Total count of matching issues")
    issues: list[dict[str, Any]] = Field(
        default_factory=list, description="List of matched issue objects"
    )


class MatchedIssueRecommendationSerializer(BaseModel):
    """Personalized issue recommendation serializer."""

    id: int = Field(..., description="Issue ID")
    title: str = Field(..., description="Issue title")
    url: str = Field(..., description="Issue HTML URL")
    repository: str = Field(..., description="Repository identifier")
    labels: list[str] = Field(default_factory=list, description="Issue labels")
    comments: int = Field(default=0, description="Comment count")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    matched_skills: list[str] = Field(
        default_factory=list, description="Skills that matched this issue"
    )
    score: float = Field(..., description="Matching relevance score")
    score_method: str = Field(
        default="keyword-tfidf", description="Scoring methodology"
    )
    ai_explanation: str | None = Field(
        default=None, description="Optional AI explanation"
    )


class MatchedIssuesResponseSerializer(BaseModel):
    """Personalized issue recommendations response."""

    username: str = Field(..., description="Analyzed username")
    skills: list[str] = Field(
        default_factory=list, description="Matched skills used for queries"
    )
    recommendations: list[MatchedIssueRecommendationSerializer] = Field(
        default_factory=list, description="Ranked list of recommended issues"
    )


# ---------------------------------------------------------
# AI Analysis Serializers
# ---------------------------------------------------------
class IssueAnalysisRequestSerializer(BaseModel):
    """Request payload for AI issue deep-dive analysis."""

    issue: dict[str, Any] = Field(
        ..., description="Raw or parsed GitHub issue dictionary"
    )
    user_skills: list[str] = Field(
        default_factory=list, description="List of user skills"
    )


class IssueAnalysisResponseSerializer(BaseModel):
    """AI analysis result serializer."""

    fit_score: int | float | None = Field(
        default=None, description="Estimated developer fit score"
    )
    complexity: str | None = Field(
        default=None, description="Difficulty assessment"
    )
    summary: str | None = Field(default=None, description="Summary of the issue")
    prerequisites: list[str] = Field(
        default_factory=list, description="Required technical prerequisites"
    )
    key_files: list[str] = Field(
        default_factory=list, description="Suggested files to inspect"
    )
    suggested_steps: list[str] = Field(
        default_factory=list, description="Step-by-step implementation guide"
    )
    explanation: str | None = Field(
        default=None, description="Comprehensive AI explanation"
    )


# ---------------------------------------------------------
# Repository Discover & Newcomer-Friendliness Serializers (Issue #447)
# ---------------------------------------------------------
class DiscoveredRepoScoreBreakdownSerializer(BaseModel):
    """Breakdown of points contributing to the newcomer-friendliness score."""

    beginner_issues_points: int = Field(..., description="Points awarded for open beginner issues (max 30)")
    recent_activity_points: int = Field(..., description="Points awarded for recent activity (max 25)")
    contributing_points: int = Field(..., description="Points awarded for CONTRIBUTING guide (max 25)")
    code_of_conduct_points: int = Field(..., description="Points awarded for Code of Conduct (max 20)")
    total_score: int = Field(..., description="Sum of newcomer-friendliness points (0-100)")


class DiscoveredRepositorySerializer(BaseModel):
    """Discovered repository item with newcomer-friendliness ranking."""

    name: str = Field(..., description="Repository short name")
    full_name: str = Field(..., description="Repository full slug (owner/repo)")
    html_url: str = Field(..., description="Web URL to repository")
    description: str | None = Field(default=None, description="Project description")
    stars: int = Field(default=0, description="Stargazer count")
    forks: int = Field(default=0, description="Forks count")
    language: str | None = Field(default=None, description="Primary repository language")
    open_issues_count: int = Field(default=0, description="Total count of open issues")
    good_first_issues_count: int = Field(default=0, description="Count of open beginner/good first issues")
    has_contributing: bool = Field(default=False, description="Whether repository has CONTRIBUTING guidelines")
    has_code_of_conduct: bool = Field(default=False, description="Whether repository has CODE_OF_CONDUCT")
    last_activity_at: str | None = Field(default=None, description="ISO timestamp of most recent activity")
    newcomer_friendliness_score: int = Field(default=0, description="Calculated newcomer friendliness score (0-100)")
    newcomer_friendliness_tier: str = Field(default="Moderate", description="Friendliness tier classification")
    score_breakdown: DiscoveredRepoScoreBreakdownSerializer = Field(
        ..., description="Point breakdown across the 4 newcomer signals"
    )


class DiscoveredRepositoriesResponseSerializer(BaseModel):
    """Response envelope for discovered welcoming repositories."""

    repositories: list[DiscoveredRepositorySerializer] = Field(
        default_factory=list, description="Ranked list of welcoming repositories"
    )
    total_count: int = Field(default=0, description="Total count of discovered repositories")
    languages: list[str] = Field(default_factory=list, description="Target languages evaluated")
    selected_language: str | None = Field(default=None, description="Active language filter if any")
    stars_filter: dict[str, Any] = Field(default_factory=dict, description="Active stars filter criteria")

