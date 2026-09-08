from collections import Counter


def analyze_skills(repositories: list[dict]) -> dict:
    languages = Counter()

    for repository in repositories:
        language = repository.get("language")

        if language:
            languages[language] += 1

    total = sum(languages.values())

    if total == 0:
        return {
            "skills": [],
            "total_repositories_analyzed": len(repositories),
        }

    skills = []

    for language, count in languages.most_common():
        percentage = round((count / total) * 100, 2)

        skills.append(
            {
                "name": language,
                "repository_count": count,
                "percentage": percentage,
            }
        )

    return {
        "skills": skills,
        "total_repositories_analyzed": len(repositories),
    }