import unittest
from app.services.skill_service import analyze_skills


class TestSkillEvidence(unittest.TestCase):
    """Test suite covering skill evidence extraction and payload capping (Issue #480)."""

    def test_skill_evidence_extracted_from_language_details(self):
        """Verifies that repositories contributing code to languages are tracked in evidence with byte share."""
        repositories = [
            {
                "name": "data-pipeline",
                "full_name": "developer/data-pipeline",
                "html_url": "https://github.com/developer/data-pipeline",
                "updated_at": "2026-03-01T12:00:00Z",
                "fork": False,
            },
            {
                "name": "web-app",
                "full_name": "developer/web-app",
                "html_url": "https://github.com/developer/web-app",
                "updated_at": "2026-02-15T08:30:00Z",
                "fork": False,
            },
        ]
        repo_details = {
            "developer/data-pipeline": {
                "languages": {"Python": 80000, "Shell": 20000},
            },
            "developer/web-app": {
                "languages": {"Python": 50000, "TypeScript": 150000},
            },
        }

        result = analyze_skills(repositories, repo_details=repo_details)
        skills_by_name = {s["name"]: s for s in result["skills"]}

        self.assertIn("Python", skills_by_name)
        python_skill = skills_by_name["Python"]
        self.assertIn("evidence", python_skill)

        evidence = python_skill["evidence"]
        self.assertEqual(len(evidence), 2)

        # Repositories should be sorted by bytes descending
        first_repo = evidence[0]
        self.assertEqual(first_repo["name"], "developer/data-pipeline")
        self.assertEqual(first_repo["url"], "https://github.com/developer/data-pipeline")
        self.assertEqual(first_repo["bytes"], 80000)
        self.assertEqual(first_repo["share"], 80.0)  # 80000 / (80000 + 20000) = 80.0%
        self.assertEqual(first_repo["last_updated"], "2026-03-01T12:00:00Z")

        second_repo = evidence[1]
        self.assertEqual(second_repo["name"], "developer/web-app")
        self.assertEqual(second_repo["bytes"], 50000)
        self.assertEqual(second_repo["share"], 25.0)  # 50000 / (50000 + 150000) = 25.0%

    def test_skill_evidence_capped_at_five_repositories(self):
        """Verifies that evidence is capped at 5 repositories per skill to keep payload size small."""
        repositories = []
        repo_details = {}

        # Create 8 repositories contributing to Rust
        for i in range(1, 9):
            full_name = f"dev/rust-project-{i}"
            repositories.append({
                "name": f"rust-project-{i}",
                "full_name": full_name,
                "html_url": f"https://github.com/{full_name}",
                "updated_at": f"2026-01-0{i}T00:00:00Z",
                "fork": False,
            })
            repo_details[full_name] = {
                "languages": {"Rust": i * 10000},
            }

        result = analyze_skills(repositories, repo_details=repo_details)
        rust_skill = next(s for s in result["skills"] if s["name"] == "Rust")

        # Capped to exactly 5
        self.assertEqual(len(rust_skill["evidence"]), 5)
        # Should contain top 5 by bytes (projects 8, 7, 6, 5, 4)
        repo_names = [e["name"] for e in rust_skill["evidence"]]
        self.assertEqual(
            repo_names,
            [
                "dev/rust-project-8",
                "dev/rust-project-7",
                "dev/rust-project-6",
                "dev/rust-project-5",
                "dev/rust-project-4",
            ],
        )

    def test_framework_and_fallback_language_evidence(self):
        """Verifies evidence is correctly formed for primary repository languages and framework dependencies/topics."""
        repositories = [
            {
                "name": "fastapi-service",
                "full_name": "org/fastapi-service",
                "html_url": "https://github.com/org/fastapi-service",
                "language": "Python",
                "topics": ["fastapi"],
                "updated_at": "2026-04-10T15:00:00Z",
                "fork": False,
            }
        ]
        repo_details = {
            "org/fastapi-service": {
                "dependencies": ["fastapi"],
            }
        }

        result = analyze_skills(repositories, repo_details=repo_details)
        skills_by_name = {s["name"]: s for s in result["skills"]}

        # Python evidence from fallback language field
        python_evidence = skills_by_name["Python"]["evidence"]
        self.assertEqual(len(python_evidence), 1)
        self.assertEqual(python_evidence[0]["name"], "org/fastapi-service")
        self.assertEqual(python_evidence[0]["share"], 100.0)

        # FastAPI framework evidence
        fastapi_evidence = skills_by_name["FastAPI"]["evidence"]
        self.assertEqual(len(fastapi_evidence), 1)
        self.assertEqual(fastapi_evidence[0]["name"], "org/fastapi-service")
        self.assertEqual(fastapi_evidence[0]["url"], "https://github.com/org/fastapi-service")


if __name__ == "__main__":
    unittest.main()
