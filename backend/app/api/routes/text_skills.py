from fastapi import APIRouter, HTTPException, status
from app.schemas.text_skill_schemas import (
    PastedTextAnalysisRequest,
    PastedTextAnalysisResponse,
)
from app.services.text_skill_service import extract_skills_from_text

router = APIRouter(
    prefix="/skills",
    tags=["Skills"],
)


@router.post(
    "/analyze-text",
    response_model=PastedTextAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze skills from pasted text or resume",
    description="In-memory extraction of technical skills from pasted resume, bio, or project description. Data is never stored.",
)
async def analyze_pasted_text(payload: PastedTextAnalysisRequest):
    """Perform rule-based skill extraction from pasted text strictly in-memory."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text payload cannot be empty.",
        )

    result = extract_skills_from_text(payload.text)
    return result
