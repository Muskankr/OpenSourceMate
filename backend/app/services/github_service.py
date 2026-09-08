import httpx


GITHUB_API_URL = "https://api.github.com"


async def get_github_user(username: str):
    url = f"{GITHUB_API_URL}/users/{username}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    if response.status_code == 404:
        return None

    response.raise_for_status()

    return response.json()


async def get_user_repositories(username: str):
    url = f"{GITHUB_API_URL}/users/{username}/repos"

    params = {
        "per_page": 100,
        "sort": "updated",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)

    if response.status_code == 404:
        return None

    response.raise_for_status()

    return response.json()