from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ai.ai_service import analyze_issue


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


class IssueAnalysisRequest(BaseModel):
    issue: dict
    user_skills: list[str]


@router.post("/analyze-issue")
async def analyze_github_issue(
    request: IssueAnalysisRequest,
):
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