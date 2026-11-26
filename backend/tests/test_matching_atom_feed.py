"""Atom feed coverage for the public matched-issues endpoint (issue #306)."""

from unittest.mock import AsyncMock
from xml.etree import ElementTree

import httpx
import pytest

from app.api.routes import matching
from app.cache import cache
from app.main import app

ATOM = {"atom": "http://www.w3.org/2005/Atom"}


@pytest.fixture(autouse=True)
def clear_atom_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
async def api():
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


async def test_feed_contains_ranked_public_matches_and_valid_atom_fields(
    api, monkeypatch
):
    monkeypatch.setattr(
        matching,
        "get_matched_issues",
        AsyncMock(
            return_value={
                "username": "octocat",
                "recommendations": [
                    {
                        "title": "Fix A&B <parser>",
                        "repository": "acme/parser",
                        "url": "https://github.com/acme/parser/issues/42",
                        "match_score": 88,
                        "updated_at": "2026-11-16T12:30:00Z",
                    },
                    {
                        "title": "Improve docs",
                        "repository": "acme/docs",
                        "url": "https://github.com/acme/docs/issues/7",
                        "match_score": 75,
                        "updated_at": "2026-11-15T08:00:00+00:00",
                    },
                ],
            }
        ),
    )

    response = await api.get("/api/matching/users/octocat/feed.atom")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/atom+xml")
    feed = ElementTree.fromstring(response.content)
    assert feed.tag == "{http://www.w3.org/2005/Atom}feed"
    assert (
        feed.findtext("atom:title", namespaces=ATOM)
        == "OpenSourceMate matches for @octocat"
    )
    assert feed.findtext("atom:updated", namespaces=ATOM) == "2026-11-16T12:30:00Z"
    assert feed.find("atom:author/atom:name", ATOM).text == "OpenSourceMate"
    entries = feed.findall("atom:entry", ATOM)
    assert len(entries) == 2
    assert entries[0].findtext("atom:title", namespaces=ATOM) == "Fix A&B <parser>"
    assert (
        entries[0].find("atom:link", ATOM).attrib["href"]
        == "https://github.com/acme/parser/issues/42"
    )
    assert entries[0].find("atom:category", ATOM).attrib["term"] == "acme/parser"
    assert (
        entries[0].findtext("atom:summary", namespaces=ATOM)
        == "Repository: acme/parser; match score: 88%"
    )
    assert (
        entries[0].findtext("atom:updated", namespaces=ATOM) == "2026-11-16T12:30:00Z"
    )


async def test_feed_includes_match_reason_and_content(api, monkeypatch):
    monkeypatch.setattr(
        matching,
        "get_matched_issues",
        AsyncMock(
            return_value={
                "username": "coder",
                "recommendations": [
                    {
                        "title": "Add async support",
                        "repository": "org/async-lib",
                        "url": "https://github.com/org/async-lib/issues/101",
                        "match_score": 95,
                        "why_it_matches": "Matches your Python and asyncio expertise",
                        "match_reasons": ["Python skill match", "Good first issue"],
                        "updated_at": "2026-11-20T10:00:00Z",
                    }
                ],
            }
        ),
    )

    response = await api.get("/api/matching/users/coder/feed.atom")
    assert response.status_code == 200
    feed = ElementTree.fromstring(response.content)
    entries = feed.findall("atom:entry", ATOM)
    assert len(entries) == 1

    summary = entries[0].findtext("atom:summary", namespaces=ATOM)
    assert "Repository: org/async-lib" in summary
    assert "match score: 95%" in summary
    assert "match reason: Matches your Python and asyncio expertise" in summary

    content = entries[0].findtext("atom:content", namespaces=ATOM)
    assert "Repository: org/async-lib" in content
    assert "Match score: 95%" in content
    assert "Match reason: Matches your Python and asyncio expertise" in content


async def test_feed_uses_stable_ids_for_entries(api, monkeypatch):
    issue_url = "https://github.com/owner/repo/issues/55"
    monkeypatch.setattr(
        matching,
        "get_matched_issues",
        AsyncMock(
            return_value={
                "username": "dev",
                "recommendations": [
                    {
                        "title": "Refactor auth middleware",
                        "repository": "owner/repo",
                        "url": issue_url,
                        "match_score": 90,
                        "updated_at": "2026-11-22T08:00:00Z",
                    }
                ],
            }
        ),
    )

    response = await api.get("/api/matching/users/dev/feed.atom")
    assert response.status_code == 200
    feed = ElementTree.fromstring(response.content)
    entry = feed.find("atom:entry", ATOM)
    assert entry.findtext("atom:id", namespaces=ATOM) == issue_url


async def test_feed_escapes_xml_and_strips_control_characters(api, monkeypatch):
    raw_title = "Handle <unsafe> & 'special' \"chars\" \x00\x07 test"
    monkeypatch.setattr(
        matching,
        "get_matched_issues",
        AsyncMock(
            return_value={
                "username": "tester",
                "recommendations": [
                    {
                        "title": raw_title,
                        "repository": "test/escape",
                        "url": "https://github.com/test/escape/issues/1",
                        "match_score": 80,
                        "why_it_matches": "Skill <A> & <B> \x00 matched",
                        "updated_at": "2026-11-23T12:00:00Z",
                    }
                ],
            }
        ),
    )

    response = await api.get("/api/matching/users/tester/feed.atom")
    assert response.status_code == 200

    # Ensure valid XML syntax with standard parser
    feed = ElementTree.fromstring(response.content)
    entry = feed.find("atom:entry", ATOM)
    # Control characters stripped, XML entities unescaped by ElementTree
    assert entry.findtext("atom:title", namespaces=ATOM) == "Handle <unsafe> & 'special' \"chars\"  test"
    assert "Skill <A> & <B>  matched" in entry.findtext("atom:summary", namespaces=ATOM)

    # In raw XML bytes, < and & are strictly escaped as &lt; and &amp;
    raw_xml = response.content.decode("utf-8")
    assert "&lt;unsafe&gt;" in raw_xml
    assert "&amp;" in raw_xml
    assert "\x00" not in raw_xml


async def test_feed_responses_are_cached_to_respect_limits(api, monkeypatch):
    mock_matcher = AsyncMock(
        return_value={
            "username": "cacheduser",
            "recommendations": [
                {
                    "title": "First issue",
                    "repository": "cached/repo",
                    "url": "https://github.com/cached/repo/issues/1",
                    "match_score": 85,
                    "updated_at": "2026-11-24T00:00:00Z",
                }
            ],
        }
    )
    monkeypatch.setattr(matching, "get_matched_issues", mock_matcher)

    # First request: Cache MISS
    resp1 = await api.get("/api/matching/users/cacheduser/feed.atom")
    assert resp1.status_code == 200
    assert resp1.headers.get("X-Cache-Lookup") == "MISS"
    assert "max-age=" in resp1.headers.get("Cache-Control", "")
    assert mock_matcher.call_count == 1

    # Second request: Cache HIT (no additional get_matched_issues call)
    resp2 = await api.get("/api/matching/users/cacheduser/feed.atom")
    assert resp2.status_code == 200
    assert resp2.headers.get("X-Cache-Lookup") == "HIT"
    assert mock_matcher.call_count == 1
    assert resp2.content == resp1.content


async def test_feed_returns_clear_404_for_unknown_user(api, monkeypatch):
    monkeypatch.setattr(matching, "get_user_repositories", AsyncMock(return_value=None))

    response = await api.get("/api/matching/users/unknown-user/feed.atom")

    assert response.status_code == 404
    assert response.json()["detail"] == "GitHub user not found"
