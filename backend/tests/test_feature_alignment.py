"""
Unit tests validating feature alignment and documentation claim accuracy (Issue #189).
Verifies:
1. Markdown files do not contain misleading or over-promising claims regarding unreleased features.
2. README and documentation properly distinguish live features from roadmap milestones.
"""

from pathlib import Path
import re
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
README_FILE = REPO_ROOT / "README.md"
ROADMAP_FILE = REPO_ROOT / "ROADMAP.md"


class TestFeatureAlignmentDocumentation:
    def test_readme_exists_and_has_features_section(self):
        assert README_FILE.exists()
        content = README_FILE.read_text(encoding="utf-8")
        assert "## ✨ Current Features" in content
        assert "## 📑 Table of Contents" in content

    def test_readme_clearly_marks_contribution_discovery_as_coming_next(self):
        content = README_FILE.read_text(encoding="utf-8")
        assert "Contribution Discovery — Coming Next" in content
        assert "Planned capabilities include:" in content
        assert "Features marked as planned are part of the project's roadmap" in content

    def test_roadmap_document_details_milestone_statuses(self):
        assert ROADMAP_FILE.exists()
        content = ROADMAP_FILE.read_text(encoding="utf-8")
        assert "Milestone" in content or "Roadmap" in content

    @pytest.mark.parametrize(
        "live_feature_keyword",
        [
            "Profile Analysis",
            "Technical Skill Analysis",
            "Public repository count",
            "Skill distribution",
        ],
    )
    def test_live_features_documented_accurately(self, live_feature_keyword: str):
        content = README_FILE.read_text(encoding="utf-8")
        assert live_feature_keyword in content

    def test_no_false_guarantees_in_readme(self):
        content = README_FILE.read_text(encoding="utf-8").lower()
        forbidden_promises = [
            "guaranteed pull request acceptance",
            "instant automated job placement",
            "100% bug free matching",
        ]
        for promise in forbidden_promises:
            assert promise not in content


    def test_terminology_consistency_between_docs_and_schemas(self):
        content = README_FILE.read_text(encoding="utf-8")
        assert "OpenSourceMate" in content
        assert "FastAPI" in content
        assert "Next.js" in content

    def test_contributing_guide_cross_referenced(self):
        content = README_FILE.read_text(encoding="utf-8")
        assert "CONTRIBUTING.md" in content or "Contributing" in content


    @pytest.mark.parametrize(
        "guideline_heading",
        [
            "Truth in Capability",
            "Transparent Roadmap Indicators",
            "Clear, Jargon-Free Explanation of Metrics",
            "Respectful, Non-Intrusive Error Handling",
        ],
    )
    def test_copywriting_guidelines_contain_core_principles(self, guideline_heading: str):
        guide_file = REPO_ROOT / "docs" / "copywriting-guidelines.md"
        assert guide_file.exists()
        content = guide_file.read_text(encoding="utf-8")
        assert guideline_heading in content

    def test_feature_alignment_review_file_exists_and_covers_matrix(self):
        review_file = REPO_ROOT / "docs" / "feature-alignment-review.md"
        assert review_file.exists()
        content = review_file.read_text(encoding="utf-8")
        assert "Feature Audit Matrix" in content
        assert "Issue Matching Engine" in content
        assert "Profile Comparison" in content


    def test_no_obsolete_instant_matching_claim_in_analyzer_hint(self):
        page_file = REPO_ROOT / "frontend" / "app" / "page.tsx"
        assert page_file.exists()
        content = page_file.read_text(encoding="utf-8")
        assert "receive matched issues" not in content
        assert "analyze technical skills, language proficiencies" in content

    def test_step3_contains_roadmap_badge_attribute(self):
        page_file = REPO_ROOT / "frontend" / "app" / "page.tsx"
        content = page_file.read_text(encoding="utf-8")
        assert 'badge="Roadmap"' in content


    def test_step1_and_step2_descriptions_are_grounded_in_live_features(self):
        page_file = REPO_ROOT / "frontend" / "app" / "page.tsx"
        content = page_file.read_text(encoding="utf-8")
        assert "Analyze your profile" in content
        assert "Understand your skills" in content
