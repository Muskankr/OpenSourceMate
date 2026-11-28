import httpx
import pytest
from app.utils.validation import is_valid_skill, validate_skill


def test_is_valid_skill():
    assert is_valid_skill("Python") is True
    assert is_valid_skill("TypeScript") is True
    assert is_valid_skill("C++") is True
    assert is_valid_skill("C#") is True
    assert is_valid_skill(".NET") is True
    assert is_valid_skill("Node.js") is True
    assert is_valid_skill("React Native") is True
    assert is_valid_skill("Rust") is True

    # Invalid cases
    assert is_valid_skill("") is False
    assert is_valid_skill("   ") is False
    assert is_valid_skill(None) is False
    assert is_valid_skill("a" * 51) is False
    assert is_valid_skill("<script>alert(1)</script>") is False
    assert is_valid_skill("python; rm -rf /") is False
    assert is_valid_skill("skill\x00null") is False


def test_validate_skill():
    assert validate_skill("  Python  ") == "Python"
    assert validate_skill("Go") == "Go"

    with pytest.raises(ValueError):
        validate_skill("")

    with pytest.raises(ValueError):
        validate_skill("<invalid>")


def _make_issue(issue_id, title, language, labels=None):
    return {
        "id": issue_id,
        "title": title,
        "body": f"Details for {title}",
        "repository_url": "https://api.github.com/repos/example/repo",
        "html_url": f"https://github.com/example/repo/issues/{issue_id}",
        "state": "open",
        "labels": [{"name": l} for l in (labels or ["good first issue"])],
        "comments": 2,
        "created_at": "2026-10-01T00:00:00Z",
        "updated_at": "2026-10-15T00:00:00Z",
        "user": {"login": "dev"},
        "language": language,
    }


async def test_backend_accepts_explicit_skills_and_filters_results(api, github_mock):
    def handler(request):
        if request.url.path == "/users/octocat/repos":
            return httpx.Response(
                200,
                json=[
                    {
                        "name": "polyglot",
                        "full_name": "octocat/polyglot",
                        "description": "Multi-language repo",
                        "language": "Python",
                        "stargazers_count": 5,
                        "forks_count": 0,
                        "fork": False,
                        "html_url": "https://github.com/octocat/polyglot",
                        "updated_at": "2026-01-01T00:00:00Z",
                    }
                ],
            )
        if request.url.path == "/search/issues":
            lang = request.url.params.get("q", "")
            if "language:Go" in lang or "language:go" in lang:
                return httpx.Response(
                    200,
                    json={
                        "total_count": 1,
                        "items": [_make_issue(101, "Add Go concurrency worker", "Go")],
                    },
                )
            if "language:Python" in lang or "language:python" in lang:
                return httpx.Response(
                    200,
                    json={
                        "total_count": 1,
                        "items": [_make_issue(102, "Optimize Python parser", "Python")],
                    },
                )
            return httpx.Response(200, json={"total_count": 0, "items": []})
        return httpx.Response(404)

    github_mock(handler)

    # 1. Query with explicit skills: Go (excluding Python)
    resp = await api.get("/api/matching/users/octocat/issues?skills=Go")
    assert resp.status_code == 200
    data = resp.json()
    assert data["skills"] == ["Go"]
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["id"] == 101

    # 2. Query with invalid skill parameter -> 400 Bad Request
    bad_resp = await api.get("/api/matching/users/octocat/issues?skills=<script>")
    assert bad_resp.status_code == 400
    assert "Invalid skill" in bad_resp.json()["detail"]

    # 3. Query with empty skills -> empty recommendations
    empty_resp = await api.get("/api/matching/users/octocat/issues?skills=")
    assert empty_resp.status_code == 200
    empty_data = empty_resp.json()
    assert empty_data["skills"] == []
    assert empty_data["recommendations"] == []
