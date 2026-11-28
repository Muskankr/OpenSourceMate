from pydantic import BaseModel, Field


class PastedTextAnalysisRequest(BaseModel):
    """Payload for analyzing skills from user submitted text."""

    text: str = Field(
        ...,
        min_length=5,
        max_length=10000,
        description="Pasted bio, resume, or project description text (max 10,000 characters).",
        examples=["Full stack developer experienced in React, Next.js, TypeScript, Python, and Docker."],
    )


class ExtractedSkillItem(BaseModel):
    """Individual skill extracted from text."""

    skill: str
    occurrences: int
    confidence: int = Field(..., ge=0, le=100)
    category: str


class PastedTextAnalysisResponse(BaseModel):
    """Result of rule-based text skill analysis."""

    skills: list[ExtractedSkillItem]
    total_extracted: int
    character_count: int
    categories: dict[str, int]
