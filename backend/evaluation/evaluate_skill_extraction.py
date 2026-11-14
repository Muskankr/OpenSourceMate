"""Check the rule-based skill extraction against the hand-labelled required_skills.

Run from the backend folder:  python -m evaluation.evaluate_skill_extraction
Prints precision, recall and F1 per profile and overall (micro-averaged over
skills). Pass --verbose to list every missed and wrong skill per issue, and
--min-confidence 0.5 to drop low-confidence results first.
"""

import argparse
import json
from pathlib import Path

from app.services.issue_skill_service import extract_skills_for_issue

DATA = Path(__file__).with_name("labelled_issues.json")


def predicted(issue: dict, min_confidence: float = 0.0) -> set[str]:
    return {
        s["name"]
        for s in extract_skills_for_issue(issue)
        if s["confidence"] >= min_confidence
    }


def scores(tp: int, fp: int, fn: int) -> tuple[float, float, float]:
    # No prediction and nothing to find counts as perfect, not as 0/0.
    precision = tp / (tp + fp) if tp + fp else 1.0
    recall = tp / (tp + fn) if tp + fn else 1.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--min-confidence", type=float, default=0.0)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    profiles = json.loads(DATA.read_text(encoding="utf-8"))["profiles"]
    total = [0, 0, 0]

    print(f"{'profile':<18}{'precision':>10}{'recall':>8}{'F1':>6}")

    for profile in profiles:
        counts = [0, 0, 0]

        for issue in profile["issues"]:
            expected = set(issue["required_skills"])
            got = predicted(issue, args.min_confidence)
            counts[0] += len(got & expected)
            counts[1] += len(got - expected)
            counts[2] += len(expected - got)

            if args.verbose and got != expected:
                print(
                    f"  #{issue['id']} {issue['title']!r}: "
                    f"wrong {sorted(got - expected)}, missed {sorted(expected - got)}"
                )

        total = [a + b for a, b in zip(total, counts, strict=True)]
        p, r, f = scores(*counts)
        print(f"{profile['name']:<18}{p:>10.2f}{r:>8.2f}{f:>6.2f}")

    p, r, f = scores(*total)
    print(f"\n{'overall':<18}{p:>10.2f}{r:>8.2f}{f:>6.2f}")
    print(f"(true positives {total[0]}, false positives {total[1]}, missed {total[2]})")


if __name__ == "__main__":
    main()
