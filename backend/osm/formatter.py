"""Output formatters for OpenSourceMate CLI (table and JSON)."""

import json
from typing import Any


def format_skills_json(data: dict[str, Any]) -> str:
    """Format skills data as indented JSON."""
    return json.dumps(data, indent=2)


def format_skills_table(data: dict[str, Any]) -> str:
    """Format skills profile data into a clean, human-readable terminal table."""
    username = data.get("username", "Unknown")
    analyzed_at = data.get("analyzed_at", "")
    total_repos = data.get("total_repositories_analyzed", 0)
    skills = data.get("skills", [])

    lines = []
    lines.append(f"Skill Profile: @{username}")
    lines.append(f"Analyzed Repositories: {total_repos}")
    if analyzed_at:
        lines.append(f"Timestamp: {analyzed_at}")
    lines.append("")

    if not skills:
        lines.append("No public technical skills detected for this user.")
        return "\n".join(lines)

    # Table columns: Skill, Repositories, Percentage, Proficiency
    headers = ["Skill", "Repositories", "Percentage", "Proficiency"]
    rows = []

    for s in skills:
        name = str(s.get("name", ""))
        repo_count = str(s.get("repository_count", 0))
        pct_val = s.get("percentage", 0.0)
        percentage = f"{pct_val:.1f}%"

        proficiency_tier = s.get("proficiency")
        proficiency_score = s.get("proficiency_score")

        if proficiency_tier and proficiency_score is not None:
            prof = f"{proficiency_tier} ({proficiency_score:.1f}/10)"
        elif proficiency_tier:
            prof = str(proficiency_tier)
        else:
            prof = "-"

        rows.append([name, repo_count, percentage, prof])

    # Determine column widths
    col_widths = [len(h) for h in headers]
    for row in rows:
        for idx, cell in enumerate(row):
            if len(cell) > col_widths[idx]:
                col_widths[idx] = len(cell)

    # Add padding
    col_widths = [w + 2 for w in col_widths]

    # Format header
    header_line = "".join(h.ljust(col_widths[i]) if i == 0 or i == 3 else h.rjust(col_widths[i]) for i, h in enumerate(headers))
    separator = "-" * len(header_line)

    lines.append(separator)
    lines.append(header_line)
    lines.append(separator)

    # Format rows
    for row in rows:
        row_line = "".join(
            row[i].ljust(col_widths[i]) if i == 0 or i == 3 else row[i].rjust(col_widths[i])
            for i in range(len(row))
        )
        lines.append(row_line)

    lines.append(separator)
    return "\n".join(lines)
