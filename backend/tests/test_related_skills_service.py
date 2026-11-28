from fastapi.testclient import TestClient

from app.main import app
from app.services.related_skills_service import (
    calculate_unlocked_issues,
    get_related_skill_suggestions,
    load_related_skills_config,
    normalize_skill,
)

client = TestClient(app)


def test_normalize_skill():
    assert normalize_skill("  TypeScript  ") == "typescript"
    assert normalize_skill("FASTAPI") == "fastapi"
    assert normalize_skill("") == ""
    assert normalize_skill(None) == ""


def test_load_related_skills_config():
    config = load_related_skills_config()
    assert isinstance(config, dict)
    assert "JavaScript" in config or "javascript" in {k.lower() for k in config}
    assert "Python" in config or "python" in {k.lower() for k in config}
    # Check key relationships mentioned in Issue #401
    js_related = [s.lower() for s in config.get("JavaScript", [])]
    py_related = [s.lower() for s in config.get("Python", [])]
    assert "typescript" in js_related
    assert "fastapi" in py_related


def test_empty_or_no_skills_returns_helpful_message():
    """Acceptance criterion 3: Users with no detected skills see a helpful message."""
    res_empty = get_related_skill_suggestions([])
    assert res_empty["suggestions"] == []
    assert res_empty["total_unlocked"] == 0
    assert "No technical skills detected" in res_empty["message"]

    res_none = get_related_skill_suggestions(None)
    assert res_none["suggestions"] == []
    assert "No technical skills detected" in res_none["message"]


def test_suggestions_exclude_existing_skills():
    """Acceptance criterion 1: Suggestions exclude skills the user already has."""
    custom_mapping = {
        "Python": ["FastAPI", "Django", "Flask", "Pandas"],
        "JavaScript": ["TypeScript", "React", "Node.js"],
    }

    # User already has Python and FastAPI
    result = get_related_skill_suggestions(
        user_skills=["Python", "fastapi"],
        custom_mapping=custom_mapping,
    )

    suggested_names = [s["name"].lower() for s in result["suggestions"]]
    assert "fastapi" not in suggested_names
    assert "django" in suggested_names or "pandas" in suggested_names
    assert result["message"] is None

    # User has JavaScript and TypeScript
    result_js = get_related_skill_suggestions(
        user_skills=["javascript", "TYPESCRIPT"],
        custom_mapping=custom_mapping,
    )
    suggested_js = [s["name"].lower() for s in result_js["suggestions"]]
    assert "typescript" not in suggested_js
    assert "react" in suggested_js or "node.js" in suggested_js


def test_adding_relationship_needs_only_config_change():
    """Acceptance criterion 2: Adding a relationship needs only a config change."""
    custom_config = {
        "Elixir": ["Phoenix", "Ecto", "LiveView"],
    }

    result = get_related_skill_suggestions(
        user_skills=["Elixir"],
        custom_mapping=custom_config,
    )

    assert len(result["suggestions"]) == 3
    names = [s["name"] for s in result["suggestions"]]
    assert names == ["Phoenix", "Ecto", "LiveView"]
    assert all(s["recommended_from"] == "Elixir" for s in result["suggestions"])
    assert all(s["unlocked_issues_count"] > 0 for s in result["suggestions"])


def test_top_three_suggestions_with_unlocked_issue_counts():
    """Returns top three suggestions with positive unlocked issues count."""
    custom_mapping = {
        "Python": ["FastAPI", "Django", "Flask", "Pandas", "PyTorch", "Celery"],
    }

    result = get_related_skill_suggestions(
        user_skills=["Python"],
        custom_mapping=custom_mapping,
        limit=3,
    )

    assert len(result["suggestions"]) == 3
    for s in result["suggestions"]:
        assert s["unlocked_issues_count"] > 0
        assert s["name"]
        assert s["recommended_from"] == "Python"


def test_calculate_unlocked_issues_with_pool():
    mock_issues = [
        {"language": "FastAPI", "labels": ["good first issue"], "title": "FastAPI docs typo"},
        {"language": "FastAPI", "labels": ["help wanted"], "title": "Add async dependency"},
        {"language": "Python", "labels": ["bug"], "title": "Python parser bug"},
    ]

    user_skills_set = {"python"}
    # FastAPI unlocks 2 issues that user's python skill did not match
    unlocked = calculate_unlocked_issues("FastAPI", user_skills_set, issues_pool=mock_issues)
    assert unlocked == 2


def test_api_route_skill_unlocks_arbitrary():
    response = client.get("/api/matching/skill-unlocks?skills=Python,JavaScript")
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert len(data["suggestions"]) <= 3
    names = [s["name"].lower() for s in data["suggestions"]]
    # Should recommend TypeScript or FastAPI
    assert any(n in ("typescript", "fastapi", "react", "django") for n in names)
    assert data["message"] is None


def test_api_route_skill_unlocks_empty():
    response = client.get("/api/matching/skill-unlocks")
    assert response.status_code == 200
    data = response.json()
    assert data["suggestions"] == []
    assert data["message"] is not None
    assert "No technical skills detected" in data["message"]
