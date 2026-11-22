# Label Guide

This guide explains the labels used on issues in this project, how repository labels are managed, and how to choose an issue to work on.

All repository labels are defined in [`.github/labels.yml`](../.github/labels.yml) and synchronized automatically through our [Label Sync Workflow](../.github/workflows/labels.yml) and synchronization script (`.github/scripts/sync-labels.js`). Existing and used labels are strictly preserved and never deleted.

---

## Difficulty

| Label              | Meaning                                                 |
| :----------------- | :------------------------------------------------------ |
| `beginner`         | Small, clear tasks. Great for first-time contributors.  |
| `intermediate`     | Needs some understanding of the codebase.               |
| `hard`             | Bigger changes that touch several parts of the project. |
| `good first issue` | Specially chosen for newcomers.                         |

---

## Mentorship & Program Levels

### NJACK Winter of Code 2026 (NWOC'26)

For participants in **NWOC'26 / NSOC'26**, issues are assigned level labels corresponding to leaderboard points:

| Label    | Level        | Points    | Scope                                                                    |
| :------- | :----------- | :-------- | :----------------------------------------------------------------------- |
| `level1` | Level 1 (L1) | 10 pts    | Beginner tasks, minor bug fixes, documentation, simple UI tweaks         |
| `level2` | Level 2 (L2) | 25–30 pts | Intermediate features, components, tests, API routes, validation         |
| `level3` | Level 3 (L3) | 45–50 pts | Advanced architecture, core algorithms, ML baselines, fullstack features |

For complete NWOC'26 program rules, claiming workflows, and FAQs, see the [NWOC'26 Program Guide](../PROGRAM_GUIDE.md).

### NJACK Season of Code (NSoC)

Historical and alternate program participant labels kept for continuous tracking:

| Label     | Level        | Scope                                                   |
| :-------- | :----------- | :------------------------------------------------------ |
| `NSoC`    | Program Tag  | NJACK Season of Code / Winter of Code participant issue |
| `NSoC-L1` | NSoC Level 1 | Beginner starter task                                   |
| `NSoC-L2` | NSoC Level 2 | Intermediate task                                       |
| `NSoC-L3` | NSoC Level 3 | Advanced architecture task                              |

---

## Area

| Label           | Meaning                                                    |
| :-------------- | :--------------------------------------------------------- |
| `frontend`      | UI, styling and client-side code                           |
| `backend`       | Server logic, APIs and databases                           |
| `docs`          | README, guides and other documentation                     |
| `testing`       | Writing or fixing tests                                    |
| `devops`        | CI/CD, build and deployment                                |
| `ai-ml`         | AI and machine learning features                           |
| `accessibility` | Accessibility, keyboard navigation, and WCAG AA compliance |
| `security`      | Security policies, vulnerability fixes, and auth policies  |

---

## Status

| Label              | Meaning                                                                        |
| :----------------- | :----------------------------------------------------------------------------- |
| `needs-triage`     | New issue that maintainers have not reviewed yet                               |
| `in-progress`      | Someone is already working on it. Please pick another issue.                   |
| `on-hold`          | Temporarily paused by contributor request; exempt from automated unassignment  |
| `stale-assignment` | Inactive for 5 days; awaiting contributor update before automated unassignment |
| `blocked`          | Blocked by an external dependency, PR, or architectural decision               |

---

## Types

| Label           | Meaning                                          |
| :-------------- | :----------------------------------------------- |
| `bug`           | Something isn't working as expected              |
| `enhancement`   | New feature or request                           |
| `feature`       | New functionality or enhancement                 |
| `documentation` | Improvements or additions to documentation       |
| `duplicate`     | This issue or pull request already exists        |
| `help wanted`   | Extra attention or community contribution needed |
| `invalid`       | This doesn't seem right or reproducible          |
| `question`      | Further information is requested                 |
| `wontfix`       | This will not be worked on                       |

---

## How to pick an issue

1. If you are new, filter by `beginner` or `good first issue`.
2. Add an area label that matches your skills, such as `frontend` or `docs`.
3. Skip issues labeled `in-progress`, because someone is already on them.
4. Pick an issue and comment on it to ask to be assigned before you start.
5. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for full contribution steps.

Each issue should normally have one label from each group, for example `beginner` + `docs` + `needs-triage`.
