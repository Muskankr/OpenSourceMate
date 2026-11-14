"""Validate data/issue-difficulty-labels.csv.

Usage: python scripts/validate_issue_difficulty_labels.py [path] [--require-review]
"""

import csv
import re
import sys
from collections import Counter
from pathlib import Path

DEFAULT_PATH = Path(__file__).resolve().parent.parent / "data" / "issue-difficulty-labels.csv"
COLUMNS = [
    "issue_url",
    "title",
    "repository",
    "language",
    "labels",
    "comment_count",
    "difficulty",
    "reason",
    "labelled_by",
    "reviewed_by",
    "collected_on",
]
DIFFICULTIES = {"beginner", "intermediate", "hard"}
URL_RE = re.compile(r"^https://github\.com/([\w.-]+/[\w.-]+)/issues/\d+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def validate(path: Path, require_review: bool) -> list[str]:
    errors = []
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != COLUMNS:
            return [f"columns must be {COLUMNS}, got {reader.fieldnames}"]
        rows = list(reader)

    seen: dict[str, int] = {}
    for line, row in enumerate(rows, start=2):
        url = row["issue_url"]
        match = URL_RE.match(url)
        if not match:
            errors.append(f"line {line}: invalid issue_url {url!r}")
        elif match.group(1) != row["repository"]:
            errors.append(f"line {line}: repository {row['repository']!r} does not match the URL")
        if url in seen:
            errors.append(f"line {line}: duplicate issue_url, first seen on line {seen[url]}")
        seen.setdefault(url, line)

        if row["difficulty"] not in DIFFICULTIES:
            errors.append(f"line {line}: difficulty must be one of {sorted(DIFFICULTIES)}")
        if not row["comment_count"].isdigit():
            errors.append(f"line {line}: comment_count must be a non-negative integer")
        if not DATE_RE.match(row["collected_on"]):
            errors.append(f"line {line}: collected_on must be YYYY-MM-DD")
        for column in ("title", "language", "reason", "labelled_by"):
            if not row[column].strip():
                errors.append(f"line {line}: {column} is empty")

        reviewer = row["reviewed_by"].strip()
        if reviewer and reviewer.lower() == row["labelled_by"].strip().lower():
            errors.append(f"line {line}: reviewed_by must be a different person from labelled_by")
        if require_review and not reviewer:
            errors.append(f"line {line}: not reviewed yet")

    levels = Counter(row["difficulty"] for row in rows)
    languages = Counter(row["language"] for row in rows)
    print(f"{len(rows)} rows; levels: {dict(levels)}; languages: {dict(languages)}")
    return errors


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    path = Path(args[0]) if args else DEFAULT_PATH
    errors = validate(path, require_review="--require-review" in sys.argv)
    for error in errors:
        print(error, file=sys.stderr)
    if errors:
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
