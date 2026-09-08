import json

from openai import AsyncOpenAI
from pydantic_settings import BaseSettings, SettingsConfigDict


class AISettings(BaseSettings):
    ai_api_key: str
    ai_model: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = AISettings()

client = AsyncOpenAI(
    api_key=settings.ai_api_key,
)


async def analyze_issue(
    issue: dict,
    user_skills: list[str],
) -> dict:

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

    return json.loads(content)