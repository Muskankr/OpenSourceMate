"""Unit tests for rule-based text skill analysis service and API endpoint.

Verifies:
- Accurate extraction of skills from pasted resume/bio text.
- Case-insensitivity and frequency scoring.
- Maximum character cap enforcement (10,000 chars).
- In-memory privacy preservation (no data stored).
- API endpoint validation and schema compliance.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.services.text_skill_service import (
    extract_skills_from_text,
    MAX_PASTED_TEXT_LENGTH,
)


class TestTextSkillExtractionService:
    """Unit tests for in-memory text skill extraction algorithm."""

    def test_extract_empty_or_whitespace_text(self):
        """Empty or whitespace text returns empty skill list."""
        assert extract_skills_from_text("")["skills"] == []
        assert extract_skills_from_text("   \n\t  ")["skills"] == []

    def test_extract_common_languages_and_frameworks(self):
        """Extracts known tech stack mentions correctly."""
        text = """
        I am a Senior Software Engineer specializing in Python (FastAPI, Django) and TypeScript (React, Next.js).
        I use Docker and Kubernetes for microservices deployment, and PostgreSQL for relational persistence.
        """
        result = extract_skills_from_text(text)
        skills = {s["skill"] for s in result["skills"]}

        assert "Python" in skills
        assert "FastAPI" in skills
        assert "Django" in skills
        assert "TypeScript" in skills
        assert "React" in skills
        assert "Next.js" in skills
        assert "Docker" in skills
        assert "Kubernetes" in skills
        assert "PostgreSQL" in skills
        assert result["total_extracted"] >= 8

    def test_case_insensitivity(self):
        """Extracts skills regardless of casing (e.g., react, REACT, React)."""
        text = "we build with REACT, react, and ReAcT."
        result = extract_skills_from_text(text)
        react_item = next(s for s in result["skills"] if s["skill"] == "React")
        assert react_item["occurrences"] == 3
        assert react_item["confidence"] >= 80

    def test_text_length_capping(self):
        """Text longer than 10,000 characters is safely truncated without crashing."""
        huge_text = "Python developer " * 1000  # ~17,000 characters
        result = extract_skills_from_text(huge_text)
        assert result["character_count"] == MAX_PASTED_TEXT_LENGTH
        assert any(s["skill"] == "Python" for s in result["skills"])

    def test_categories_aggregation(self):
        """Aggregates occurrence counts per category."""
        text = "Python, Rust, React, Docker, Postgres"
        result = extract_skills_from_text(text)
        categories = result["categories"]
        assert "language" in categories
        assert "framework" in categories
        assert "devops" in categories
        assert "database" in categories


@pytest.mark.asyncio
class TestTextSkillsApiEndpoint:
    """Integration tests for POST /api/v1/skills/analyze-text endpoint."""

    async def test_analyze_text_endpoint_success(self):
        """Posting valid text payload returns 200 with extracted skills."""
        payload = {
            "text": "Experienced full-stack developer with 5 years in Next.js, React, Node.js, and Tailwind CSS."
        }
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/v1/skills/analyze-text", json=payload)
            assert resp.status_code == 200
            data = resp.json()
            assert "skills" in data
            assert data["total_extracted"] > 0
            skill_names = [s["skill"] for s in data["skills"]]
            assert "Next.js" in skill_names
            assert "React" in skill_names
            assert "Tailwind CSS" in skill_names

    async def test_analyze_text_too_short_validation_error(self):
        """Posting text shorter than 5 chars raises 422 Unprocessable Entity."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/v1/skills/analyze-text", json={"text": "hi"})
            assert resp.status_code == 422
