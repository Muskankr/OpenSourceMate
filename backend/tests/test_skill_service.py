from app.services.skill_service import analyze_skills


def repo(language):
    return {"name": "r", "language": language}


def test_empty_list():
    assert analyze_skills([]) == {"skills": [], "total_repositories_analyzed": 0}


def test_counts_and_percentages():
    result = analyze_skills(
        [repo("Python"), repo("Python"), repo("Python"), repo("Go")]
    )
    assert result["total_repositories_analyzed"] == 4
    assert result["skills"] == [
        {"name": "Python", "repository_count": 3, "percentage": 75.0},
        {"name": "Go", "repository_count": 1, "percentage": 25.0},
    ]


def test_sorted_by_count_descending():
    result = analyze_skills([repo("Go"), repo("Rust"), repo("Rust")])
    assert [s["name"] for s in result["skills"]] == ["Rust", "Go"]


def test_percentage_is_rounded_to_two_decimals():
    result = analyze_skills([repo("A"), repo("B"), repo("C")])
    assert all(s["percentage"] == 33.33 for s in result["skills"])


def test_none_and_missing_language_are_skipped_but_still_counted_as_analyzed():
    result = analyze_skills([repo(None), {"name": "x"}, repo("Python")])
    assert result["total_repositories_analyzed"] == 3
    assert result["skills"] == [
        {"name": "Python", "repository_count": 1, "percentage": 100.0}
    ]


def test_all_languages_none():
    result = analyze_skills([repo(None), repo(None)])
    assert result == {"skills": [], "total_repositories_analyzed": 2}


def test_forked_repos_are_currently_counted():
    # Documents current behaviour: forks are not excluded from skills.
    forked = {"name": "f", "language": "Java", "fork": True}
    result = analyze_skills([forked])
    assert result["skills"][0]["name"] == "Java"
