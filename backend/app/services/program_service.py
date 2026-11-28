"""Service for loading and matching open-source contributor programs (NSoC, Hacktoberfest, etc.).

Allows contributors to filter issue recommendations by programs they participate in.
New programs can be added by simply editing `data/programs.json` without modifying code.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_CACHED_CONFIG: dict[str, Any] | None = None
_LAST_MTIME: float = 0.0


def get_programs_config_path() -> Path:
    """Resolves the path to the programs configuration file."""
    # 1. Primary path: repository-level data/programs.json
    root_path = Path(__file__).resolve().parents[3] / "data" / "programs.json"
    if root_path.exists():
        return root_path

    # 2. Secondary path: app/data/programs.json
    app_path = Path(__file__).resolve().parent.parent / "data" / "programs.json"
    if app_path.exists():
        return app_path

    # Default to root path if neither exists yet
    return root_path


def load_programs_config(force_reload: bool = False) -> dict[str, Any]:
    """Loads programs configuration from disk.

    Automatically re-reads the configuration file if modified on disk,
    fulfilling the acceptance criterion that editing the config file immediately
    registers a new program.
    """
    global _CACHED_CONFIG, _LAST_MTIME

    config_path = get_programs_config_path()
    try:
        current_mtime = os.path.getmtime(config_path) if config_path.exists() else 0.0
    except OSError:
        current_mtime = 0.0

    if not force_reload and _CACHED_CONFIG is not None and current_mtime <= _LAST_MTIME:
        return _CACHED_CONFIG

    if not config_path.exists():
        logger.warning("Programs configuration file not found at %s", config_path)
        return {"version": "1.0.0", "programs": []}

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            _CACHED_CONFIG = data
            _LAST_MTIME = current_mtime
            return data
    except Exception as exc:
        logger.error("Failed to parse programs configuration at %s: %s", config_path, exc)
        if _CACHED_CONFIG is not None:
            return _CACHED_CONFIG
        return {"version": "1.0.0", "programs": []}


def get_all_programs() -> list[dict[str, Any]]:
    """Returns the list of all available contributor programs from configuration."""
    config = load_programs_config()
    return config.get("programs", [])


def get_program_by_id_or_name(identifier: str | None) -> dict[str, Any] | None:
    """Finds a program by its ID, slug, or name (case-insensitive)."""
    if not identifier:
        return None

    clean_id = identifier.strip().lower()
    programs = get_all_programs()

    for prog in programs:
        p_id = str(prog.get("id", "")).strip().lower()
        p_name = str(prog.get("name", "")).strip().lower()

        if clean_id == p_id or clean_id == p_name:
            return prog

        # Also match common separators (e.g. "lfx-mentorship" matches "lfx_mentorship" or "lfx mentorship")
        p_id_norm = p_id.replace("_", "-").replace(" ", "-")
        clean_norm = clean_id.replace("_", "-").replace(" ", "-")
        if clean_norm == p_id_norm:
            return prog

    return None


def issue_matches_program(issue: dict[str, Any], program_config: dict[str, Any]) -> bool:
    """Checks whether an issue carries any of the program's labels or repository topics.

    Matching is case-insensitive and checks both:
    1. Issue labels (e.g. "hacktoberfest", "hacktoberfest-accepted", "nsoc")
    2. Repository topics or issue topics (e.g. "hacktoberfest", "nwoc")
    """
    target_labels = {
        str(l).strip().lower() for l in program_config.get("labels", []) if str(l).strip()
    }
    target_topics = {
        str(t).strip().lower() for t in program_config.get("topics", []) if str(t).strip()
    }

    # 1. Check issue labels
    raw_labels = issue.get("labels") or []
    for lbl in raw_labels:
        label_name = lbl.get("name") if isinstance(lbl, dict) else str(lbl)
        if label_name and label_name.strip().lower() in target_labels:
            return True

    # 2. Check issue topics or repository topics
    raw_topics = (issue.get("topics") or []) + (issue.get("repository_topics") or [])
    for topic in raw_topics:
        if topic and str(topic).strip().lower() in target_topics:
            return True

    return False


def filter_issues_by_program(
    issues: list[dict[str, Any]], program_identifier: str | None
) -> list[dict[str, Any]]:
    """Filters a list of issues by the given program name/ID.

    If program_identifier is None, empty, or 'all', returns all issues without filtering.
    """
    if not program_identifier or program_identifier.strip().lower() in ("", "all", "none"):
        return issues

    prog = get_program_by_id_or_name(program_identifier)
    if not prog:
        available = ", ".join(p.get("id", "") for p in get_all_programs())
        raise ValueError(
            f"Unknown contributor program '{program_identifier}'. Configured programs: {available}"
        )

    return [issue for issue in issues if issue_matches_program(issue, prog)]
