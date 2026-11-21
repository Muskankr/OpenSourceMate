from fastapi import APIRouter, HTTPException

from app.ai.ai_service import analyze_issue
from app.schemas.serializers import IssueAnalysisRequestSerializer

router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


@router.post("/analyze-issue", summary="AI-powered issue suitability analysis")
async def analyze_github_issue(
    request: IssueAnalysisRequestSerializer,
):
    if not request.issue:
        raise HTTPException(
            status_code=400,
            detail="The 'issue' dictionary parameter cannot be empty.",
        )
    if len(request.user_skills) > 100:
        raise HTTPException(
            status_code=400,
            detail="The 'user_skills' list cannot exceed 100 items.",
        )
    for skill in request.user_skills:
        if len(skill) > 50:
            raise HTTPException(
                status_code=400,
                detail=f"Skill '{skill[:20]}...' exceeds maximum length of 50 characters.",
            )
    try:
        analysis = await analyze_issue(
            issue=request.issue,
            user_skills=request.user_skills,
        )

        return analysis

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {exc}",
        )
