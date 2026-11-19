# NWOC'26 Participant Guide – OpenSourceMate

Welcome to **OpenSourceMate**! This guide is specifically written for contributors participating in **NJACK Winter of Code 2026 (NWOC'26 / NSOC'26)**, organized by **NJACK (The Official Computer Science Club of IIT Patna)**.

---

## Table of Contents

- [1. Program Overview & Key Information](#1-program-overview--key-information)
- [2. Issue Levels & Scoring (L1, L2, L3)](#2-issue-levels--scoring-l1-l2-l3)
- [3. How to Claim an Issue](#3-how-to-claim-an-issue)
- [4. Assignment Duration & Inactivity Policy](#4-assignment-duration--inactivity-policy)
- [5. Submitting Pull Requests & Review Timelines](#5-submitting-pull-requests--review-timelines)
- [6. How Contributions Are Counted](#6-how-contributions-are-counted)
- [7. Frequently Asked Questions (FAQ)](#7-frequently-asked-questions-faq)
- [8. Academic Integrity & Code of Conduct](#8-academic-integrity--code-of-conduct)

---

## 1. Program Overview & Key Information

- **Program**: NJACK Winter of Code 2026 (NWOC'26 / NSOC'26)
- **Host Organization**: NJACK, IIT Patna
- **Repository**: [Muskankr/OpenSourceMate](https://github.com/Muskankr/OpenSourceMate)
- **Project Admin & Lead Maintainer**: Muskan Kumari ([@Muskankr](https://github.com/Muskankr))
- **Primary Tech Stack**:
  - **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
  - **Backend**: Python 3.12, FastAPI, Pydantic, Uvicorn, Pytest
- **Helpful Resources**:
  - [First Contribution Guide](FIRST_CONTRIBUTION.md) (step-by-step for beginners)
  - [Contributor Guidelines](CONTRIBUTING.md)
  - [Architecture Overview](ARCHITECTURE.md)
  - [Label Guide](docs/LABELS.md)

---

## 2. Issue Levels & Scoring (L1, L2, L3)

All official program issues are labeled according to their difficulty level and scope. Points on the NWOC leaderboard are determined by the issue's assigned level:

| Level Label       | Difficulty & Scope                                                                                  | Typical Examples                                                                                                        | Points           |
| :---------------- | :-------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :--------------- |
| **`level1`** (L1) | **Beginner / Starter**<br>Small, well-defined changes with minimal dependencies.                    | Typo fixes, UI styling refinements, basic accessibility tags, link checkers, minor documentation updates.               | **10 Points**    |
| **`level2`** (L2) | **Intermediate**<br>Features requiring a solid understanding of frontend or backend subsystems.     | New reusable UI components, API endpoints, test suites (Jest/Pytest), data validation scripts, client state management. | **25–30 Points** |
| **`level3`** (L3) | **Advanced / Architecture**<br>Complex tasks touching multiple modules, performance, or core logic. | Fullstack features, core recommendation algorithms, vector embeddings, ML baselines, comprehensive evaluation suites.   | **45–50 Points** |

> [!NOTE]
> Issues will also carry domain tags such as `frontend`, `backend`, `documentation`, `testing`, `accessibility`, or `devops` so you can easily filter for tasks that match your skills.

---

## 3. How to Claim an Issue

To ensure a fair and organized experience for all participants:

1. **Find an unassigned issue**:
   - Filter repository issues by `level1`, `level2`, or `level3`.
   - Ensure the issue is **not** marked `in-progress` and is not already assigned to another contributor.
2. **Comment politely to request assignment**:
   - Leave a clear comment on the issue expressing your interest:
     > _"Hi @Muskankr! I am participating in NWOC'26 and would love to work on this issue. Please assign it to me."_
3. **Wait for confirmation**:
   - A maintainer will assign the issue to you and add the `in-progress` label.
   - **Do not start coding or submit a PR before you are officially assigned.** Unsolicited PRs for unassigned issues will be closed.
4. **One Active Issue Rule**:
   - You may only have **one active issue assignment** at a time.
   - Once your pull request has been submitted and merged, you are welcome to claim another issue.

---

## 4. Assignment Duration & Inactivity Policy

- **Assignment Window**: Once an issue is assigned to you, you have **48 to 72 hours (2 to 3 days)** to submit a working Pull Request (or a draft PR showing meaningful progress).
- **Need an extension?** If you run into unexpected difficulties or need additional time, leave a comment on the issue explaining your current progress and ETA. Maintainers are happy to grant extensions for active communication.
- **Inactivity & Reassignment**: If no PR or update is posted within 72 hours, the maintainers will remove your assignment and reopen the issue for another contributor.

---

## 5. Submitting Pull Requests & Review Timelines

When your solution is ready:

1. **Branch Naming**:
   - Create a feature branch from latest `main`:
     ```bash
     git checkout -b feat/your-feature-name
     ```
2. **Commit Conventions**:
   - Follow [Conventional Commits](https://www.conventionalcommits.org/):
     - `feat:` for new capabilities
     - `fix:` for bug fixes
     - `docs:` for documentation updates
     - `test:` for test additions/fixes
3. **Local Testing & Formatting**:
   - Ensure linters, formatters, and tests pass before pushing:
     - Frontend: `npm run lint` and `npm test`
     - Backend: `ruff check backend` and `pytest`
4. **Open the Pull Request**:
   - Complete the repository PR template.
   - Link the issue in the description using `Fixes #<issue-number>` or `Closes #<issue-number>`.
5. **Expected Review Turnaround**:
   - Maintainers review PRs in the order received, typically within **24 to 48 hours**.
   - Please avoid repeatedly pinging maintainers in comments; reviews will be conducted systematically.
   - If changes are requested, address them promptly so your PR can be merged.

---

## 6. How Contributions Are Counted

- **Merged PRs Only**: Contributions and points are officially awarded **only after your Pull Request is approved and merged into `main`**.
- **Issue Level Verification**: Ensure your PR links to the assigned issue so that points for that issue level (`level1`, `level2`, or `level3`) are credited on the NWOC portal/leaderboard.
- **Closed / Incomplete PRs**: Pull requests that are closed without merging do not receive points.

---

## 7. Frequently Asked Questions (FAQ)

### Can I work on multiple issues at the same time?

No. To give every participant a fair opportunity to contribute, each student is allowed only **one active issue assignment** at any given time. After your PR is merged, you can request assignment on your next issue.

### What should I do if I get stuck?

1. Check the existing documentation in [`docs/`](docs/) and [`ARCHITECTURE.md`](ARCHITECTURE.md).
2. Leave a comment on your issue or PR detailing:
   - What you are trying to accomplish
   - What you have already tried
   - The exact error message or unexpected behavior
3. Maintainers and fellow contributors will provide guidance and pointers.

### What if my PR is not merged before the program ends?

Any Pull Request opened **before the official NWOC submission deadline** that is in active review will be reviewed and merged after the deadline, provided you promptly address any requested revisions.

### Can I propose and work on my own feature or bug report?

Yes! If you identify a bug or have an enhancement idea:

1. Open a new issue using our issue templates.
2. Maintainers will review the proposal, assign an appropriate difficulty tag (`level1`, `level2`, or `level3`), and assign it to you if approved.
3. Do not open a PR without an approved and assigned issue first.

### Why was my Pull Request closed?

Pull requests may be closed if:

- Opened without an approved issue assignment.
- Left inactive for more than 4 days after changes were requested.
- Found to contain plagiarized, low-effort, or unsolicited AI-generated spam.

---

## 8. Academic Integrity & Code of Conduct

All NWOC'26 participants are expected to maintain the highest standards of integrity:

- **Harassment-Free Community**: We strictly enforce our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, welcoming, and constructive in all issue and PR interactions.
- **Original Work**: All code and documentation must be written by you. Plagiarism or copy-pasting from other contributors' submissions is grounds for immediate disqualification from the program.
- **Constructive Collaboration**: Open source is about learning and building together. Help fellow participants in discussions and learn from code review feedback!

Happy coding, and best of luck in NWOC'26! 🚀
