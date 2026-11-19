"""Validate data/curated-projects.json against schema and integrity rules.

Usage:
    python scripts/validate_curated_projects.py [path_to_json] [--schema path_to_schema]
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

DEFAULT_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "curated-projects.json"
DEFAULT_SCHEMA_PATH = Path(__file__).resolve().parent.parent / "data" / "curated-projects.schema.json"

REPO_PATTERN = re.compile(r"^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$")
ALLOWED_PROGRAMS = {
    "GSoC",
    "Outreachy",
    "Hacktoberfest",
    "LFX Mentorship",
    "Google Season of Docs",
    "MLH Fellowship",
    "Major League Hacking",
    "Other",
}


def is_valid_http_url(url: str) -> bool:
    """Validates that a URL is a well-formed HTTP/HTTPS URL with netloc."""
    if not isinstance(url, str) or not url.strip():
        return False
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def validate_schema(data: dict[str, Any], schema_path: Path | None = None) -> list[str]:
    """Validates JSON data using jsonschema if available, falling back to builtin checks."""
    errors: list[str] = []
    if schema_path and schema_path.is_file():
        try:
            import jsonschema

            with schema_path.open("r", encoding="utf-8") as f:
                schema = json.load(f)
            validator = jsonschema.Draft202012Validator(schema)
            for err in validator.iter_errors(data):
                loc = " -> ".join(str(elem) for elem in err.path) or "root"
                errors.append(f"Schema error at [{loc}]: {err.message}")
            return errors
        except ImportError:
            # Fallback to manual validation below when jsonschema library is not installed
            pass
        except Exception as e:
            errors.append(f"Failed to load schema from {schema_path}: {e}")
    return errors


def validate_curated_projects(
    data_path: Path = DEFAULT_DATA_PATH,
    schema_path: Path = DEFAULT_SCHEMA_PATH,
) -> tuple[list[str], dict[str, Any]]:
    """Validates data/curated-projects.json structure, program tags, and source links."""
    errors: list[str] = []
    stats: dict[str, Any] = {
        "total_projects": 0,
        "languages": Counter(),
        "programs": Counter(),
    }

    if not data_path.is_file():
        return [f"Data file not found at {data_path}"], stats

    try:
        with data_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return [f"Invalid JSON syntax in {data_path}: {e}"], stats

    if not isinstance(data, dict):
        return ["Root JSON element must be an object/dict"], stats

    # Validate against JSON schema if present
    schema_errors = validate_schema(data, schema_path)
    errors.extend(schema_errors)

    version = data.get("version")
    if not isinstance(version, str) or not re.match(r"^\d+\.\d+\.\d+$", version):
        errors.append(f"Root 'version' must be semver (e.g., '1.0.0'), got {version!r}")

    projects = data.get("projects")
    if not isinstance(projects, list):
        return errors + ["Root 'projects' field must be an array of project objects"], stats

    if len(projects) == 0:
        errors.append("The 'projects' array must contain at least one project.")

    seen_repos: dict[str, int] = {}

    for idx, project in enumerate(projects, start=1):
        ctx = f"Project #{idx}"
        if not isinstance(project, dict):
            errors.append(f"{ctx}: must be a dictionary/object")
            continue

        repo = project.get("repo", "")
        ctx = f"Project #{idx} ({repo or 'unknown'})"

        # Check repository identifier
        if not isinstance(repo, str) or not REPO_PATTERN.match(repo.strip()):
            errors.append(f"{ctx}: 'repo' must match 'owner/repository' format, got {repo!r}")
        else:
            repo_clean = repo.strip().lower()
            if repo_clean in seen_repos:
                errors.append(
                    f"{ctx}: duplicate repository, previously seen at #{seen_repos[repo_clean]}"
                )
            else:
                seen_repos[repo_clean] = idx

        # Check name & description
        name = project.get("name")
        if not isinstance(name, str) or not name.strip():
            errors.append(f"{ctx}: 'name' must be a non-empty string")

        desc = project.get("description")
        if not isinstance(desc, str) or len(desc.strip()) < 10:
            errors.append(f"{ctx}: 'description' must be at least 10 characters long")

        # Check contributing URL
        contrib_url = project.get("contributing_url")
        if not is_valid_http_url(contrib_url):
            errors.append(
                f"{ctx}: 'contributing_url' must be a valid HTTP/HTTPS URL, got {contrib_url!r}"
            )

        # Check languages
        languages = project.get("languages")
        if not isinstance(languages, list) or len(languages) == 0:
            errors.append(f"{ctx}: 'languages' must be a non-empty list of programming languages")
        else:
            for lang in languages:
                if not isinstance(lang, str) or not lang.strip():
                    errors.append(f"{ctx}: language entries must be non-empty strings")
                else:
                    stats["languages"][lang.strip()] += 1

        # Check topics
        topics = project.get("topics")
        if not isinstance(topics, list) or len(topics) == 0:
            errors.append(f"{ctx}: 'topics' must be a non-empty list of tags")

        # Check programs
        programs = project.get("programs")
        if not isinstance(programs, list) or len(programs) == 0:
            errors.append(
                f"{ctx}: 'programs' must be a non-empty list of tagged open-source programs"
            )
        else:
            seen_prog_names = set()
            for p_idx, prog in enumerate(programs, start=1):
                p_ctx = f"{ctx} -> program #{p_idx}"
                if not isinstance(prog, dict):
                    errors.append(f"{p_ctx}: program tag must be an object")
                    continue

                p_name = prog.get("name")
                if p_name not in ALLOWED_PROGRAMS:
                    errors.append(
                        f"{p_ctx}: program name must be one of {sorted(ALLOWED_PROGRAMS)}, got {p_name!r}"
                    )
                else:
                    stats["programs"][p_name] += 1
                    if p_name in seen_prog_names:
                        errors.append(f"{p_ctx}: duplicate program tag {p_name!r}")
                    seen_prog_names.add(p_name)

                # Source link validation (Acceptance Criteria: Every tag has a verifiable source)
                source_url = prog.get("source")
                if not is_valid_http_url(source_url):
                    errors.append(
                        f"{p_ctx}: 'source' must be a verifiable HTTP/HTTPS link, got {source_url!r}"
                    )

                years = prog.get("years")
                if years is not None:
                    if not isinstance(years, list) or not all(
                        isinstance(y, int) and 2000 <= y <= 2100 for y in years
                    ):
                        errors.append(
                            f"{p_ctx}: 'years' must be a list of integers between 2000 and 2100"
                        )

    stats["total_projects"] = len(projects)
    return errors, stats


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    data_path = Path(args[0]) if args else DEFAULT_DATA_PATH
    schema_path = DEFAULT_SCHEMA_PATH

    print(f"Validating curated projects in: {data_path}")
    errors, stats = validate_curated_projects(data_path, schema_path)

    if errors:
        print(f"\n❌ Validation failed with {len(errors)} error(s):", file=sys.stderr)
        for err in errors:
            print(f"  • {err}", file=sys.stderr)
        return 1

    print("\n✅ Curated Projects validation passed!")
    print(f"  • Total Projects: {stats['total_projects']}")
    print(f"  • Languages ({len(stats['languages'])}): {dict(stats['languages'].most_common(8))}")
    print(f"  • Program Tags: {dict(stats['programs'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
