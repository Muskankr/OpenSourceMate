import pytest
from app.exceptions import InvalidUsernameError
from app.utils.validation import (
    parse_github_profile_url,
    validate_github_username,
    RESERVED_GITHUB_PATHS,
)


class TestProfileUrlParsingBackend:
    @pytest.mark.parametrize(
        "url_input,expected_username",
        [
            ("github.com/torvalds", "torvalds"),
            ("https://github.com/torvalds/", "torvalds"),
            ("www.github.com/torvalds", "torvalds"),
            ("http://github.com/torvalds", "torvalds"),
            ("https://www.github.com/torvalds", "torvalds"),
            ("https://www.github.com/torvalds/", "torvalds"),
            ("http://www.github.com/torvalds/", "torvalds"),
            ("   https://github.com/torvalds   ", "torvalds"),
            ("HTTPS://GITHUB.COM/Torvalds/", "torvalds"),
            ("https://github.com/torvalds?tab=repositories", "torvalds"),
            ("https://github.com/torvalds#readme", "torvalds"),
        ],
    )
    def test_parse_valid_profile_urls(self, url_input: str, expected_username: str):
        extracted, error = parse_github_profile_url(url_input)
        assert error is None
        assert extracted == expected_username

        validated = validate_github_username(url_input)
        assert validated == expected_username

    @pytest.mark.parametrize(
        "repo_url",
        [
            "github.com/torvalds/linux",
            "https://github.com/torvalds/linux",
            "https://github.com/torvalds/linux/",
            "http://github.com/torvalds/linux",
            "www.github.com/torvalds/linux",
            "https://github.com/facebook/react/issues/123",
            "https://github.com/owner/repo/pull/456",
        ],
    )
    def test_reject_repository_urls_with_friendly_error(self, repo_url: str):
        extracted, error = parse_github_profile_url(repo_url)
        assert extracted is None
        assert error is not None
        assert "not a repository URL" in error

        with pytest.raises(InvalidUsernameError) as exc_info:
            validate_github_username(repo_url)
        assert "not a repository URL" in str(exc_info.value)

    @pytest.mark.parametrize(
        "reserved_path",
        ["settings", "explore", "topics", "features", "marketplace", "login", "orgs"],
    )
    def test_reject_reserved_paths(self, reserved_path: str):
        url = f"https://github.com/{reserved_path}"
        extracted, error = parse_github_profile_url(url)
        assert extracted is None
        assert error is not None
        assert f"/{reserved_path}" in error

        with pytest.raises(InvalidUsernameError):
            validate_github_username(url)

    def test_reject_non_github_urls(self):
        non_github = [
            "https://gitlab.com/torvalds",
            "http://bitbucket.org/torvalds",
            "https://google.com",
        ]
        for url in non_github:
            extracted, error = parse_github_profile_url(url)
            assert extracted is None
            assert "Only GitHub profile URLs" in error

            with pytest.raises(InvalidUsernameError):
                validate_github_username(url)

    def test_plain_usernames_remain_supported(self):
        assert validate_github_username("torvalds") == "torvalds"
        assert validate_github_username("@torvalds") == "torvalds"
        assert validate_github_username("OctoCat") == "octocat"
        assert validate_github_username("user-with-hyphens") == "user-with-hyphens"

        with pytest.raises(InvalidUsernameError):
            validate_github_username("-starts-with-hyphen")

        with pytest.raises(InvalidUsernameError):
            validate_github_username("ends-with-hyphen-")

        with pytest.raises(InvalidUsernameError):
            validate_github_username("double--hyphens")
