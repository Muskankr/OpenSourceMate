"""Atom feed coverage for the public matched-issues endpoint (issue #306)."""

from unittest.mock import AsyncMock
from xml.etree import ElementTree

import httpx
import pytest

from app.api.routes import matching
from app.main import app

ATOM = {"atom": "http://www.w3.org/2005/Atom"}


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


async def test_feed_returns_clear_404_for_unknown_user(api, monkeypatch):
    monkeypatch.setattr(matching, "get_user_repositories", AsyncMock(return_value=None))

    response = await api.get("/api/matching/users/unknown-user/feed.atom")

    assert response.status_code == 404
    assert response.json()["detail"] == "GitHub user not found"
