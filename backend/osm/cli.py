"""Command-Line Interface for OpenSourceMate."""

import argparse
import os
import sys
from typing import Sequence

from osm import __version__
from osm.api_client import (
    ApiConnectionError,
    ApiRequestError,
    UserNotFoundError,
    fetch_user_skills,
)
from osm.formatter import format_skills_json, format_skills_table

DEFAULT_API_URL = os.environ.get("OSM_API_URL", "http://localhost:8000")


def build_parser() -> argparse.ArgumentParser:
    """Build and configure the CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="osm",
        description="OpenSourceMate Command-Line Client: explore developer skills and contribution matches.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  osm analyze octocat
  osm analyze torvalds --json
  osm analyze gaearon --api-url http://localhost:8000 --refresh

For more information, visit: https://github.com/Muskankr/OpenSourceMate
""",
    )

    parser.add_argument(
        "-v",
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
        help="Show program version and exit",
    )

    subparsers = parser.add_subparsers(
        dest="command",
        title="Commands",
        description="Available subcommands",
        metavar="<command>",
    )

    # Subcommand: analyze
    analyze_parser = subparsers.add_parser(
        "analyze",
        help="Analyze a GitHub user's technical skills profile",
        description="Fetch and display a GitHub user's analyzed skill profile as a table or JSON.",
    )

    analyze_parser.add_argument(
        "username",
        type=str,
        help="Target GitHub username (e.g. 'octocat')",
    )

    analyze_parser.add_argument(
        "--api-url",
        type=str,
        default=DEFAULT_API_URL,
        help=f"Base URL of OpenSourceMate backend API (default: {DEFAULT_API_URL} or $OSM_API_URL)",
    )

    analyze_parser.add_argument(
        "--json",
        action="store_true",
        help="Print the raw skill profile output as formatted JSON",
    )

    analyze_parser.add_argument(
        "--refresh",
        action="store_true",
        help="Bypass API cache and fetch fresh GitHub data",
    )

    analyze_parser.add_argument(
        "--timeout",
        type=float,
        default=15.0,
        help="Network timeout in seconds (default: 15.0)",
    )

    return parser


def handle_analyze(args: argparse.Namespace) -> int:
    """Handle the 'analyze' subcommand execution.

    Returns:
        0 on success, 1 on error.
    """
    try:
        data = fetch_user_skills(
            username=args.username,
            api_url=args.api_url,
            refresh=args.refresh,
            timeout=args.timeout,
        )

        if args.json:
            print(format_skills_json(data))
        else:
            print(format_skills_table(data))

        return 0

    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except UserNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except ApiConnectionError as e:
        print(f"Connection Error: {e}", file=sys.stderr)
        return 1
    except ApiRequestError as e:
        print(f"API Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


def main(argv: Sequence[str] | None = None) -> int:
    """CLI entry point.

    Args:
        argv: Command-line arguments sequence (defaults to sys.argv[1:]).

    Returns:
        Exit code (0 for success, 1 for execution error, 2 for syntax error).
    """
    parser = build_parser()

    if argv is None:
        argv = sys.argv[1:]

    # If no arguments provided, show help and exit with code 0
    if not argv:
        parser.print_help()
        return 0

    try:
        args = parser.parse_args(argv)
    except SystemExit as e:
        return e.code

    if args.command == "analyze":
        return handle_analyze(args)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
