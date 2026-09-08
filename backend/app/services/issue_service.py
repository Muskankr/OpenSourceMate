import httpx


GITHUB_API_URL = "https://api.github.com"


async def search_github_issues(
    language: str | None = None,
    label: str | None = None,
    keyword: str | None = None,
    per_page: int = 20,
):
    query_parts = [
        "is:issue",
        "is:open",
    ]

    if language:
        query_parts.append(f"language:{language}")

    if label:
        query_parts.append(f'label:"{label}"')

    if keyword:
        query_parts.append(keyword)

    query = " ".join(query_parts)

    url = f"{GITHUB_API_URL}/search/issues"

    params = {
        "q": query,
        "per_page": min(per_page, 100),
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            params=params,
            headers={
                "Accept": "application/vnd.github+json"
            },
        )

    response.raise_for_status()

    data = response.json()

    issues = []

    for issue in data["items"]:
        issues.append(
            {
                "id": issue["id"],
                "title": issue["title"],
                "repository": issue["repository_url"].split(
                    "/repos/"
                )[-1],
                "url": issue["html_url"],
                "state": issue["state"],
                "labels": [
                    label["name"]
                    for label in issue["labels"]
                ],
                "comments": issue["comments"],
                "created_at": issue["created_at"],
                "updated_at": issue["updated_at"],
                "user": issue["user"]["login"],
                "language": language,
            }
        )

    return {
        "total_count": data["total_count"],
        "issues": issues,
    }