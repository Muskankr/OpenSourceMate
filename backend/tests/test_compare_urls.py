"""
Backend and contract tests verifying shareable comparison URL parameter handling (Issue #190).
"""

from urllib.parse import parse_qs, urlparse
import pytest


def parse_comparison_query(url_or_query: str):
    parsed = urlparse(url_or_query)
    query_str = parsed.query if parsed.query else url_or_query
    qs = parse_qs(query_str.lstrip("?"))
    user1 = qs.get("a", qs.get("user1", [""]))[0].strip().lstrip("@")
    user2 = qs.get("b", qs.get("user2", [""]))[0].strip().lstrip("@")
    return user1, user2


class TestCompareUrlContract:
    def test_parse_modern_params(self):
        u1, u2 = parse_comparison_query("https://example.com/compare?a=torvalds&b=gaearon")
        assert u1 == "torvalds"
        assert u2 == "gaearon"

    def test_parse_legacy_params(self):
        u1, u2 = parse_comparison_query("/compare?user1=octocat&user2=defunkt")
        assert u1 == "octocat"
        assert u2 == "defunkt"

    def test_strips_at_symbol(self):
        u1, u2 = parse_comparison_query("?a=@babin&b=@muskan")
        assert u1 == "babin"
        assert u2 == "muskan"

    def test_detects_duplicate_users(self):
        u1, u2 = parse_comparison_query("?a=octocat&b=OCTOCAT")
        assert u1.lower() == u2.lower()

    def test_swap_parameters(self):
        u1, u2 = parse_comparison_query("?a=alpha&b=beta")
        swapped = f"/compare?a={u2}&b={u1}"
        su1, su2 = parse_comparison_query(swapped)
        assert su1 == "beta"
        assert su2 == "alpha"


    def test_single_user_partial_load(self):
        u1, u2 = parse_comparison_query("?a=torvalds")
        assert u1 == "torvalds"
        assert u2 == ""

    def test_empty_query_string(self):
        u1, u2 = parse_comparison_query("")
        assert u1 == ""
        assert u2 == ""

    def test_whitespace_padded_query(self):
        u1, u2 = parse_comparison_query("?a=%20developer1%20&b=developer2")
        assert u1 == "developer1"
        assert u2 == "developer2"
