# Repository Contribution Requirements Documentation (Issue #417)

## Overview

Newcomers to open source frequently invest substantial time crafting a solution only to discover late in the review process that the target repository enforces strict prerequisites:
- A mandatory Contributor License Agreement (CLA)
- A signed-off commit conforming to the Developer Certificate of Origin (DCO)
- A code of conduct pledge
- Or conversely, that the repository lacks any contributing guide or license whatsoever.

To prevent surprises and wasted contributor effort, OpenSourceMate detects and surfaces **Contribution Requirements** as compact, accessible chips directly on each recommended issue card.

---

## Detection Signals & Best-Effort Discovery

Requirements are detected using public GitHub data via the Community Profile API (`GET /repos/{owner}/{repo}/community/profile`) and root repository contents (`GET /repos/{owner}/{repo}/contents`):

1. **CONTRIBUTING Guide**:
   - Resolves `files.contributing.html_url` from the Community Profile API or root files matching `contributing.md`.
   - Links directly to the file in the repository (e.g. `https://github.com/owner/repo/blob/main/CONTRIBUTING.md`).
2. **Code of Conduct**:
   - Resolves `files.code_of_conduct.html_url` and formal code of conduct name (e.g. *Contributor Covenant*).
   - Links directly to the real `CODE_OF_CONDUCT.md` file.
3. **Licence File**:
   - Resolves `files.license.html_url` and SPDX identifier (e.g. `MIT`, `Apache-2.0`, `GPL-3.0`).
   - Links directly to the licence file on GitHub.
4. **CLA / DCO Signals**:
   - Detects common CLA bot/configuration files (`CLA.md`, `.cla.json`, `cla.json`, workflows) or DCO checks (`DCO.md`, `DCO`, `.github/dco.yml`).
   - Surfaces appropriate requirement labels: `CLA Required` or `DCO (Signed-off-by)`.
   - Links to the respective policy or guideline document.

---

## Unknown vs. None Contract

In accordance with Issue #417 acceptance criteria:
- **Missing information strictly shows `unknown` rather than `none`**.
- Because public heuristic detection is best-effort, if a file or signal is not explicitly resolved, it is labeled as `unknown` (e.g., `Contributing: unknown`, `Code of Conduct: unknown`, `License: unknown`, `CLA/DCO: unknown`).
- This prevents falsely asserting that a project does not require a CLA or has no license when it may merely use a non-standard file location.

---

## Shared Sanitized API Fixtures

Deterministic fixtures conforming to the GitHub REST API v3 contract are provided under `fixtures/requirements/`:
- `fixtures/requirements/requirements_all.json`: Repository with all requirements present (CONTRIBUTING, Code of Conduct, License, and CLA).
- `fixtures/requirements/requirements_some.json`: Repository with partial files (CONTRIBUTING and License present; Code of Conduct and CLA/DCO missing/unknown).
- `fixtures/requirements/requirements_none.json`: Repository with no requirement files (all 4 items evaluate to `unknown`).

---

## Rate-Limit Protection & Caching

- **Backend Cache**: In-memory `TTLCache` caches evaluated repository requirements for 300 seconds (5 minutes).
- **Frontend Cache**: Synchronous in-memory caching and in-flight Promise coalescing prevent duplicate network requests across multiple issue cards from the same repository.
- **Graceful Fallback**: If GitHub rate limits are encountered, the service degrades gracefully to cached data or safe `unknown` values without throwing uncaught exceptions.

---

## Acceptance Criteria Verification

- [x] **Chips link to the real files in the repository**: Active requirement chips are anchor tags linking directly to GitHub `html_url`.
- [x] **Missing information shows 'unknown' rather than 'none'**: All missing or unresolved items display `'unknown'`.
- [x] **Tests cover repositories with all, some and none of the files**: Unit tests in backend (`test_requirements_service.py`) and frontend (`repoRequirements.test.ts`, `ContributionRequirementsChips.test.tsx`) cover all three scenarios using shared sanitized fixtures.
