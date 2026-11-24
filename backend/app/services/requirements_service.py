"""Repository contribution requirements detection service (Issue #417).

Detects contribution requirements from public repository data:
- CONTRIBUTING.md presence and real file link
- CODE_OF_CONDUCT.md presence and real file link
- Licence file presence and real file link (with SPDX/name)
- CLA/DCO signals (e.g. CLA.md, .cla.json, DCO.md, .github/dco.yml) and real file link
- Missing information strictly displays 'unknown' rather than 'none'
"""

import re
from typing import Any

from app.cache import cache
from app.services.friendliness_service import parse_repo_owner_name
from app.services.github_service import GITHUB_API_URL, github_get

REQUIREMENTS_CACHE_TTL_SECONDS = 300


def _match_file(contents: list[dict[str, Any]], pattern: re.Pattern) -> dict[str, Any] | None:
    """Finds first file in contents list matching the regex pattern."""
    if not contents or not isinstance(contents, list):
        return None
    for item in contents:
        name = item.get("name", "")
        if pattern.search(name):
            return item
    return None


def compute_contribution_requirements(
    repository: str,
    community_profile: dict[str, Any] | None = None,
    contents: list[dict[str, Any]] | None = None,
    repo_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Pure evaluation of contribution requirements from community profile and contents."""
    files = (community_profile or {}).get("files", {}) if isinstance(community_profile, dict) else {}
    contents_list = contents or []

    # 1. CONTRIBUTING.md
    contributing_info: dict[str, Any]
    comm_contrib = files.get("contributing")
    if comm_contrib and comm_contrib.get("html_url"):
        contributing_info = {
            "detected": True,
            "name": "Contributing Guide",
            "url": comm_contrib.get("html_url"),
            "status": "present",
        }
    else:
        file_match = _match_file(contents_list, re.compile(r"^contributing(\.md|\.rst|\.txt)?$", re.IGNORECASE))
        if file_match and file_match.get("html_url"):
            contributing_info = {
                "detected": True,
                "name": file_match.get("name", "Contributing Guide"),
                "url": file_match.get("html_url"),
                "status": "present",
            }
        else:
            contributing_info = {
                "detected": False,
                "name": None,
                "url": None,
                "status": "unknown",
            }

    # 2. CODE_OF_CONDUCT.md
    coc_info: dict[str, Any]
    comm_coc = files.get("code_of_conduct")
    if comm_coc and comm_coc.get("html_url"):
        coc_info = {
            "detected": True,
            "name": comm_coc.get("name", "Code of Conduct"),
            "url": comm_coc.get("html_url"),
            "status": "present",
        }
    else:
        file_match = _match_file(contents_list, re.compile(r"^code_of_conduct(\.md|\.rst|\.txt)?$", re.IGNORECASE))
        if file_match and file_match.get("html_url"):
            coc_info = {
                "detected": True,
                "name": file_match.get("name", "Code of Conduct"),
                "url": file_match.get("html_url"),
                "status": "present",
            }
        else:
            coc_info = {
                "detected": False,
                "name": None,
                "url": None,
                "status": "unknown",
            }

    # 3. Licence File
    license_info: dict[str, Any]
    comm_lic = files.get("license")
    repo_lic = (repo_data or {}).get("license") if isinstance(repo_data, dict) else None

    if comm_lic and comm_lic.get("html_url"):
        spdx = comm_lic.get("spdx_id") or comm_lic.get("name") or "License"
        license_info = {
            "detected": True,
            "name": spdx,
            "url": comm_lic.get("html_url"),
            "status": "present",
        }
    elif repo_lic and repo_lic.get("url"):
        spdx = repo_lic.get("spdx_id") or repo_lic.get("name") or "License"
        # Derive HTML URL from repo or repo_lic
        lic_url = f"https://github.com/{repository}/blob/main/LICENSE"
        license_info = {
            "detected": True,
            "name": spdx,
            "url": lic_url,
            "status": "present",
        }
    else:
        file_match = _match_file(contents_list, re.compile(r"^licen[sc]e(\.md|\.rst|\.txt)?$", re.IGNORECASE))
        if file_match and file_match.get("html_url"):
            license_info = {
                "detected": True,
                "name": "License",
                "url": file_match.get("html_url"),
                "status": "present",
            }
        else:
            license_info = {
                "detected": False,
                "name": None,
                "url": None,
                "status": "unknown",
            }

    # 4. CLA / DCO Signals
    cla_dco_info: dict[str, Any]
    # Check for CLA files (e.g. CLA.md, .cla.json, cla.json)
    cla_file = _match_file(contents_list, re.compile(r"^(\.)?cla(\.md|\.json|\.txt)?$", re.IGNORECASE))
    dco_file = _match_file(contents_list, re.compile(r"^(\.)?dco(\.md|\.yml|\.yaml|\.txt)?$", re.IGNORECASE))

    if cla_file and cla_file.get("html_url"):
        cla_dco_info = {
            "detected": True,
            "type": "CLA",
            "name": "CLA Required",
            "url": cla_file.get("html_url"),
            "status": "present",
        }
    elif dco_file and dco_file.get("html_url"):
        cla_dco_info = {
            "detected": True,
            "type": "DCO",
            "name": "DCO (Signed-off-by)",
            "url": dco_file.get("html_url"),
            "status": "present",
        }
    else:
        cla_dco_info = {
            "detected": False,
            "type": None,
            "name": None,
            "url": None,
            "status": "unknown",
        }

    return {
        "repository": repository,
        "contributing": contributing_info,
        "code_of_conduct": coc_info,
        "license": license_info,
        "cla_dco": cla_dco_info,
    }


async def evaluate_contribution_requirements(
    repo_target: str,
    bypass_cache: bool = False,
) -> dict[str, Any]:
    """Evaluates repository contribution requirements, respecting cache and rate limits."""
    owner, repo = parse_repo_owner_name(repo_target)
    full_name = f"{owner}/{repo}"

    cache_key = f"repo_requirements:{full_name.lower()}"
    if not bypass_cache:
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

    # 1. Fetch Community Profile
    comm_resp = await github_get(f"{GITHUB_API_URL}/repos/{full_name}/community/profile")
    community_profile = (
        comm_resp.json()
        if comm_resp.status_code == 200 and isinstance(comm_resp.json(), dict)
        else None
    )

    # 2. Fetch Contents
    contents_resp = await github_get(f"{GITHUB_API_URL}/repos/{full_name}/contents")
    contents = (
        contents_resp.json()
        if contents_resp.status_code == 200 and isinstance(contents_resp.json(), list)
        else None
    )

    # 3. Fallback repository data if needed
    repo_resp = await github_get(f"{GITHUB_API_URL}/repos/{full_name}")
    repo_data = (
        repo_resp.json()
        if repo_resp.status_code == 200 and isinstance(repo_resp.json(), dict)
        else None
    )

    result = compute_contribution_requirements(
        repository=full_name,
        community_profile=community_profile,
        contents=contents,
        repo_data=repo_data,
    )

    cache.set(cache_key, result, ttl=REQUIREMENTS_CACHE_TTL_SECONDS)
    return result
