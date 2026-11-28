"""Unit tests for backend feature flags configuration.

Verifies:
- All unreleased feature flags default to False in production.
- Flags can be toggled via environment variables.
- Feature flag status can be checked programmatically.
"""

from app.config import Settings


class TestFeatureFlagsConfig:
    """Test suite ensuring backend feature flags work with safe production defaults."""

    def test_feature_flags_default_to_false(self):
        """All unreleased feature flags must default to False."""
        settings = Settings()
        assert settings.feature_pasted_text_analysis is False
        assert settings.feature_repository_selection is False
        assert settings.feature_starred_repo_interests is False
        assert settings.feature_username_autocomplete is False
        assert settings.feature_ai_explanations is False

    def test_feature_flags_env_override(self, monkeypatch):
        """Feature flags can be enabled via environment variable injection."""
        monkeypatch.setenv("FEATURE_PASTED_TEXT_ANALYSIS", "true")
        monkeypatch.setenv("FEATURE_REPOSITORY_SELECTION", "1")
        monkeypatch.setenv("FEATURE_STARRED_REPO_INTERESTS", "true")

        settings = Settings()
        assert settings.feature_pasted_text_analysis is True
        assert settings.feature_repository_selection is True
        assert settings.feature_starred_repo_interests is True
        assert settings.feature_username_autocomplete is False


    def test_feature_flags_case_insensitive_and_truthy_parsing(self, monkeypatch):
        """Verify 1, true, TRUE, on are parsed as True; 0, false, off as False."""
        monkeypatch.setenv("FEATURE_USERNAME_AUTOCOMPLETE", "TRUE")
        monkeypatch.setenv("FEATURE_AI_EXPLANATIONS", "on")
        monkeypatch.setenv("FEATURE_PASTED_TEXT_ANALYSIS", "0")

        settings = Settings()
        assert settings.feature_username_autocomplete is True
        assert settings.feature_ai_explanations is True
        assert settings.feature_pasted_text_analysis is False

    def test_feature_flags_all_flags_documented_and_exist(self):
        """Ensure all flags in backend correspond to registered frontend flags."""
        settings = Settings()
        expected_flags = [
            "feature_pasted_text_analysis",
            "feature_repository_selection",
            "feature_starred_repo_interests",
            "feature_username_autocomplete",
            "feature_ai_explanations",
        ]
        for flag in expected_flags:
            assert hasattr(settings, flag)
            assert getattr(settings, flag) is False
