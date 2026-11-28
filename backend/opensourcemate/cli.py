"""OpenSourceMate command-line interface.

Provides terminal users with ranked open-source issue recommendations matching their
technical profile and skills. Supports output as formatted text tables or JSON.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from typing import Any, Sequence

from app.api.routes.matching import get_matched_issues
from app.config import get_settings
from app.exceptions import InvalidUsernameError
from app.services.github_service import (
    GitHubRateLimitError,
    GitHubTimeoutError,
    GitHubUpstreamError,
    close_client,
)
from app.utils.validation import validate_github_username


def sanitize_output(text: str, token: str | None) -> str:
    """Ensure that the GitHub token is never leaked in standard or error output."""
    if token and len(token) >= 4 and token in text:
        return text.replace(token, "[REDACTED_TOKEN]")
    return text


def format_table(issues: list[dict[str, Any]]) -> str:
    """Format recommendation issues into an aligned, easy-to-read ASCII/Unicode table."""
    if not issues:
        return "No matching issues found."

    headers = ["#", "Score", "Language", "Repository & Issue", "Link"]
    rows: list[list[str]] = []

    for idx, iss in enumerate(issues, start=1):
        score_val = iss.get("match_score", iss.get("score", 0))
        score_str = f"{round(score_val)}%"
        lang = str(iss.get("language") or "N/A")
        repo = iss.get("repository", "")
        iss_id = iss.get("id", "")
        title = iss.get("title", "").replace("\n", " ").strip()
        repo_and_title = f"{repo}#{iss_id}: {title}"
        if len(repo_and_title) > 45:
            repo_and_title = repo_and_title[:42] + "..."
        url = str(iss.get("url") or "")

        rows.append([str(idx), score_str, lang, repo_and_title, url])

    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(cell))

    def make_row(cells: list[str]) -> str:
        padded = [cells[i].ljust(col_widths[i]) for i in range(len(cells))]
        return " | ".join(padded)

    separator = "-+-".join(["-" * w for w in col_widths])

    table_lines = [
        make_row(headers),
        separator,
        *[make_row(r) for r in rows],
    ]
    return "\n".join(table_lines)


async def fetch_recommendations(
    username: str,
    language: str | None = None,
    limit: int = 10,
    github_token: str | None = None,
) -> dict[str, Any]:
    """Execute recommendation logic for the given username with optional token and filters."""
    settings = get_settings()

    # If user provided a token via CLI arg or env, temporarily apply it to settings
    effective_token = github_token or os.environ.get("GITHUB_TOKEN") or os.environ.get("OPENSOURCEMATE_GITHUB_TOKEN")
    original_token = settings.github_token
    if effective_token:
        settings.github_token = effective_token

    try:
        skills_arg = [language] if language else None
        result = await get_matched_issues(
            username=username,
            skills=skills_arg,
        )

        recommendations = result.get("recommendations", [])

        # If a language was specified, further ensure recommendations match
        if language:
            lang_lower = language.strip().lower()
            recommendations = [
                iss
                for iss in recommendations
                if str(iss.get("language", "")).lower() == lang_lower
                or any(
                    (lbl.get("name", "").lower() if isinstance(lbl, dict) else str(lbl).lower()) == lang_lower
                    for lbl in iss.get("labels", [])
                )
            ]

        if limit > 0:
            recommendations = recommendations[:limit]

        return {
            "username": result.get("username", username),
            "skills": result.get("skills", []),
            "total": len(recommendations),
            "recommendations": recommendations,
        }
    finally:
        settings.github_token = original_token
        await close_client()


def build_parser() -> argparse.ArgumentParser:
    """Build the CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="opensourcemate",
        description="Find open-source contribution opportunities tailored to your GitHub skills.",
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: recommend <username>
    rec_parser = subparsers.add_parser(
        "recommend",
        help="Recommend open-source issues matching a GitHub user's skills.",
    )
    rec_parser.add_argument(
        "username",
        type=str,
        help="GitHub username to analyze (e.g. octocat)",
    )
    rec_parser.add_argument(
        "--limit",
        "-n",
        type=int,
        default=10,
        help="Maximum number of recommendations to return (default: 10)",
    )
    rec_parser.add_argument(
        "--language",
        "-l",
        type=str,
        default=None,
        help="Filter recommendations by programming language (e.g. python, typescript)",
    )
    rec_parser.add_argument(
        "--json",
        action="store_true",
        dest="as_json",
        help="Output results as structured JSON instead of a formatted table",
    )
    rec_parser.add_argument(
        "--token",
        type=str,
        default=None,
        help="GitHub personal access token (optional, or read from GITHUB_TOKEN env var)",
    )

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Main CLI entry point function. Returns 0 on success, non-zero on failure."""
    parser = build_parser()

    # Handle no arguments or when user executes `opensourcemate <username>` directly
    args_list = list(sys.argv[1:] if argv is None else argv)
    if not args_list:
        parser.print_help(sys.stderr)
        return 1

    # Convenience shortcut: if first arg is not a recognized subcommand or flag, default to 'recommend'
    known_commands = {"recommend", "-h", "--help", "-v", "--version"}
    if args_list and args_list[0] not in known_commands and not args_list[0].startswith("-"):
        args_list.insert(0, "recommend")

    args = parser.parse_args(args_list)

    if args.command == "recommend":
        raw_token = (
            args.token
            or os.environ.get("GITHUB_TOKEN")
            or os.environ.get("OPENSOURCEMATE_GITHUB_TOKEN")
        )

        try:
            validated_user = validate_github_username(args.username)
        except InvalidUsernameError as err:
            msg = f"Error: Invalid GitHub username '{args.username}'."
            sys.stderr.write(sanitize_output(msg, raw_token) + "\n")
            return 1

        if args.limit <= 0:
            sys.stderr.write("Error: --limit must be a positive integer greater than 0.\n")
            return 1

        try:
            data = asyncio.run(
                fetch_recommendations(
                    username=validated_user,
                    language=args.language,
                    limit=args.limit,
                    github_token=raw_token,
                )
            )
        except GitHubRateLimitError:
            err_msg = (
                "Error: GitHub API rate limit reached. "
                "Provide a token via GITHUB_TOKEN environment variable to increase limits."
            )
            sys.stderr.write(sanitize_output(err_msg, raw_token) + "\n")
            return 1
        except GitHubTimeoutError as timeout_err:
            err_msg = f"Error: Request timed out ({timeout_err})."
            sys.stderr.write(sanitize_output(err_msg, raw_token) + "\n")
            return 1
        except GitHubUpstreamError as upstream_err:
            err_msg = f"Error: GitHub upstream service error ({upstream_err})."
            sys.stderr.write(sanitize_output(err_msg, raw_token) + "\n")
            return 1
        except Exception as exc:
            err_msg = f"Error: Failed to fetch recommendations ({exc})."
            sys.stderr.write(sanitize_output(err_msg, raw_token) + "\n")
            return 1

        if args.as_json:
            output = json.dumps(data, indent=2)
            sys.stdout.write(sanitize_output(output, raw_token) + "\n")
        else:
            table = format_table(data.get("recommendations", []))
            user_display = f"Top recommended issues for @{data.get('username')}:"
            skills_list = ", ".join(data.get("skills", [])) or "None detected"
            skills_display = f"Detected skills: {skills_list}"
            full_output = f"\n{user_display}\n{skills_display}\n\n{table}\n"
            sys.stdout.write(sanitize_output(full_output, raw_token))

        return 0

    parser.print_help(sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
