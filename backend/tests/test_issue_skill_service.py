"""Tests for rule-based skill extraction from issue text (Issue #271)."""

import json

from app.services import issue_skill_service
from app.services.issue_skill_service import (
    extract_issue_skills,
    extract_skills_for_issue,
    load_issue_skill_keywords,
)


def names(result):
    return [s["name"] for s in result]


def by_name(result):
    return {s["name"]: s for s in result}


def test_dictionary_file_loads_and_every_entry_is_well_formed():
    skills = load_issue_skill_keywords()

    assert len(skills) >= 30
    for name, entry in skills.items():
        assert set(entry) <= {"aliases", "ambiguous", "extensions", "implies"}, name
        for parent in entry.get("implies", []):
            assert parent in skills, f"{name} implies unknown skill {parent}"
        for ext in entry.get("extensions", []):
            assert ext.startswith("."), f"{name}: {ext}"


def test_result_shape():
    result = extract_issue_skills("Fix the Django admin", "", [])

    assert result[0] == {"name": "Django", "confidence": 0.9, "source": "title"}
    for skill in result:
        assert set(skill) == {"name", "confidence", "source"}
        assert 0 < skill["confidence"] <= 1


def test_aliases_map_to_canonical_skill():
    result = by_name(
        extract_issue_skills("Flaky test", "Run it with pytest and pip install -e .")
    )

    assert result["Python"]["source"] == "body"


def test_matching_is_case_insensitive_and_whole_word():
    assert names(extract_issue_skills("Upgrade REACT")) == ["React"]
    # "javascript" must not be found inside "javascripts" and "ts" not inside "tests".
    assert (
        extract_issue_skills("Clean up tests", "Move assets out of javascripts/") == []
    )


def test_multi_word_alias():
    result = by_name(extract_issue_skills("CI", "The GitHub Actions workflow fails"))

    assert "GitHub Actions" in result


def test_file_extensions():
    result = names(
        extract_issue_skills("Rename tmp in utils.py", "Also see Package.swift")
    )

    assert "Python" in result
    assert "Swift" in result


def test_alias_with_extension_like_suffix_is_not_a_file():
    # node.js is the Node.js alias, not a JavaScript file.
    assert names(extract_issue_skills("Bump node.js")) == ["Node.js"]


def test_title_counts_more_than_body():
    in_title = by_name(extract_issue_skills("Docker image is too big"))["Docker"]
    in_body = by_name(extract_issue_skills("Image is too big", "The Docker image"))[
        "Docker"
    ]

    assert in_title["confidence"] > in_body["confidence"]
    assert in_title["source"] == "title"
    assert in_body["source"] == "body"


def test_repeated_mentions_raise_confidence():
    once = by_name(extract_issue_skills("Fix", "Uses Rust"))["Rust"]["confidence"]
    twice = by_name(extract_issue_skills("Fix", "Uses Rust and cargo"))["Rust"][
        "confidence"
    ]

    assert twice > once


def test_labels_are_read():
    result = by_name(
        extract_issue_skills("Fix crash", "", ["good first issue", "python"])
    )

    assert result["Python"]["source"] == "labels"


def test_ambiguous_word_capitalised_counts_at_lower_confidence():
    # A capitalised "Go" at the start of a sentence still counts (documented limitation).
    result = by_name(extract_issue_skills("Go to the settings page"))

    assert result["Go"]["confidence"] < 0.9


def test_ambiguous_word_in_lower_case_is_ignored():
    assert extract_issue_skills("Fix", "Users go back and swift scrolling breaks") == []


def test_ambiguous_word_in_label_counts_fully():
    result = by_name(extract_issue_skills("Fix linter", "", ["go"]))

    assert result["Go"]["confidence"] == 0.9


def test_specific_alias_of_ambiguous_skill_counts_fully():
    result = by_name(extract_issue_skills("Add golangci-lint"))

    assert result["Go"]["confidence"] == 0.9


def test_implied_parent_skill():
    result = by_name(extract_issue_skills("Add a FastAPI endpoint"))

    assert result["Python"]["source"] == "implied"
    assert result["Python"]["confidence"] < result["FastAPI"]["confidence"]


def test_direct_mention_beats_weaker_implication():
    result = by_name(
        extract_issue_skills("Python crash", "Happens in the FastAPI router")
    )

    assert result["Python"]["source"] == "title"


def test_results_sorted_by_confidence():
    result = extract_issue_skills("React button", "Tailwind classes")
    confidences = [s["confidence"] for s in result]

    assert confidences == sorted(confidences, reverse=True)


def test_no_text_no_skills():
    assert extract_issue_skills(None, None, None) == []
    assert extract_issue_skills("Typo in CONTRIBUTING", "Fix spelling") == []


def test_extract_skills_for_issue_reads_issue_dict():
    issue = {"title": "Seed PyTorch", "body": None, "labels": ["good first issue"]}

    assert "PyTorch" in names(extract_skills_for_issue(issue))


def test_missing_dictionary_finds_nothing(tmp_path, monkeypatch):
    monkeypatch.setattr(
        issue_skill_service, "ISSUE_SKILL_KEYWORDS_FILE", tmp_path / "x.json"
    )
    load_issue_skill_keywords.cache_clear()
    issue_skill_service._lookup.cache_clear()
    try:
        assert extract_issue_skills("Python crash") == []
    finally:
        load_issue_skill_keywords.cache_clear()
        issue_skill_service._lookup.cache_clear()


def test_labelled_dataset_has_required_skills_from_the_dictionary():
    from evaluation.evaluate_skill_extraction import DATA

    known = set(load_issue_skill_keywords())
    for profile in json.loads(DATA.read_text(encoding="utf-8"))["profiles"]:
        for issue in profile["issues"]:
            assert set(issue["required_skills"]) <= known, issue["id"]
