# Issue Skill Extraction (Rule-Based Baseline)

Issue #271. Matching used to look only for the user's own skill names in an
issue, plus the repository language. This adds a step that reads an issue and
says which skills it needs, so "fix the pytest fixture" is known to be a
Python issue even though the word "Python" never appears.

## Usage

```python
from app.services.issue_skill_service import extract_issue_skills, extract_skills_for_issue

extract_issue_skills(
    "Add pagination to the /items endpoint",
    "The FastAPI router returns every row. Add limit and offset with Pydantic validation.",
    ["good first issue"],
)
# [{"name": "FastAPI",  "confidence": 0.6,  "source": "body"},
#  {"name": "Pydantic", "confidence": 0.6,  "source": "body"},
#  {"name": "Python",   "confidence": 0.48, "source": "implied"}]

extract_skills_for_issue(issue)  # same, for an issue dict from the GitHub search
```

The skill names are the same ones `skill_service` gives a user (`Python`,
`FastAPI`, `Tailwind CSS`, ...), so `matching_service` can compare the two
lists directly. Wiring the result into the ranking is a separate issue.

## How it works

The dictionary lives in `backend/app/data/issue_skill_keywords.json`. Each skill has:

| Key | Meaning | Example |
|---|---|---|
| `aliases` | Words that mean the skill, matched as whole words in any case. Can be several words. | `pytest`, `pip` → Python; `github actions` → GitHub Actions |
| `extensions` | File names ending with these | `utils.py` → Python, `Package.swift` → Swift |
| `ambiguous` | Words that are also ordinary English. They only count when written exactly like this, and at half weight | `Go`, `Swift`, `Node`, `Express` |
| `implies` | Parent skills added at 0.8 × the child's confidence | FastAPI → Python, Tailwind CSS → CSS |

**Confidence.** One mention in the title or labels is worth 0.9 and one in the
body 0.6, the same order as the 3× / 2× / 1× weighting in `matching_service`.
More mentions combine as `1 - Π(1 - w)`, so confidence goes up with each one
but never above 1. `source` is the strongest place the skill was found
(`title`, `labels`, `body`), or `implied`.

Labels are trusted more than free text, so an ambiguous word in a label
counts in full: a `go` label means Go.

To add a skill, add an entry to the JSON file. No Python change is needed.

## Evaluation

Every issue in `backend/evaluation/labelled_issues.json` now has
`required_skills`, written by hand from the issue text only (not from the
repository language). For example, a README typo in a Python repo needs no skills.

```bash
cd backend
python -m evaluation.evaluate_skill_extraction            # precision / recall / F1
python -m evaluation.evaluate_skill_extraction --verbose  # list each mistake
python -m evaluation.evaluate_skill_extraction --min-confidence 0.5
```

Results (micro-averaged over skills, 30 issues):

| Profile | Precision | Recall | F1 |
|---|---:|---:|---:|
| python-fastapi | 0.86 | 1.00 | 0.92 |
| react-typescript | 1.00 | 1.00 | 1.00 |
| data-ml | 1.00 | 1.00 | 1.00 |
| **overall** | **0.95** | **1.00** | **0.97** |

With `--min-confidence 0.5` the overall precision stays 0.95 and recall drops to 0.90:
body-only implied skills fall under the threshold.

The two errors both come from a Python word in an issue that doesn't need Python:

- #102 "Dockerfile builds as root" mentions "the Python API image", but the fix is in the Dockerfile.
- #103 "Typo in README" mentions `pip`, but it is a docs typo.

**These numbers are optimistic.** The dictionary was written while looking at
these same 30 short issues, so it covers every word they use. Real issues are
longer, messier and use libraries the dictionary has never seen. Treat the
numbers as a check that the code works, not as an accuracy claim. A fair
number needs a held-out set of real GitHub issues labelled by someone who did
not write the dictionary.

## Limitations

- **Negation and context are ignored.** "This is not a React bug" still finds React. A mention is treated as a need ("mentions Python" ≠ "needs Python", as in #102).
- **Ambiguous words.** `Go`, `Swift`, `Node` and `Express` need the exact capital letter. "Go to the settings page" at the start of a sentence still finds Go (at 0.45). Lower-case "go" in a body is missed, even when it means the language. Single letters such as C and R are not in the dictionary at all.
- **"react" as a verb** ("react to the event") finds React, because React is not marked ambiguous: lower-case `react` is far more common as the library in issue text.
- **Only known words.** A new framework, or one missing from the JSON file, is not found until someone adds it.
- **No code reading.** Code blocks, stack traces and linked files are read as plain words, with no special handling.
- **Small, synthetic evaluation set.** See above.
