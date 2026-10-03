import json
from typing import Optional

from openai import AsyncOpenAI
from pydantic_settings import BaseSettings, SettingsConfigDict


class AISettings(BaseSettings):
    ai_api_key: Optional[str] = None
    ai_model: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = AISettings()

client = (
    AsyncOpenAI(api_key=settings.ai_api_key)
    if settings.ai_api_key
    else None
)


async def analyze_issue(
    issue: dict,
    user_skills: list[str],
) -> dict:

    # AI is optional.
    # The rest of OpenSourceMate can work without an AI API key.
    if not client or not settings.ai_model:
        return {
            "difficulty": "unknown",
            "required_skills": [],
            "skill_matches": [],
            "why_it_matches": (
                "AI analysis is not configured yet. "
                "Configure an AI API key and model to enable "
                "AI-powered issue analysis."
            ),
            "recommended_steps": [
                "Review the GitHub issue description",
                "Check the repository contribution guidelines",
                "Compare the issue requirements with your skills",
            ],
            "potential_challenges": [
                "AI analysis is currently unavailable"
            ],
        }

    prompt = f"""
You are an open-source contribution assistant.

Analyze whether the GitHub issue is suitable for the developer.

Developer skills:
{json.dumps(user_skills)}

GitHub issue:
{json.dumps(issue)}

Return ONLY valid JSON with this structure:

{{
    "difficulty": "beginner|intermediate|advanced",
    "required_skills": [],
    "skill_matches": [],
    "why_it_matches": "",
    "recommended_steps": [],
    "potential_challenges": []
}}

Do not invent repository information that is not present
in the provided issue data.
"""

    response = await client.chat.completions.create(
        model=settings.ai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You analyze open-source GitHub issues "
                    "for developers."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content

    if not content:
        raise ValueError("AI returned an empty response.")

    return json.loads(content)