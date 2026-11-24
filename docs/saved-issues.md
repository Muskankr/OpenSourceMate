# Saved Issues Feature Documentation (Issue #419)

## Overview

When developers discover interesting open-source issues across search sessions or recommendations, they often lose track of them upon leaving the page. **Saved Issues** provides a private personal list stored entirely in the browser (`localStorage`) where users can save issues, organize them with progress statuses (`Interested`, `Working on it`, `Done`), add private working notes, and export or import their saved list as JSON.

---

## Key Features

1. **'Save' / 'Saved' Button on Issue Cards**:
   - Each recommendation card includes a 1-click **Save** button (`☆ Save` / `★ Saved`).
   - Dynamically toggles saved state and provides instant accessible feedback (`aria-label`).
   - Persists immediately to browser `localStorage` and synchronizes across open tabs.

2. **Dedicated Saved Page (`/saved`)**:
   - Lists all saved issues with repository name, language, issue title (external link), and labels.
   - Status selector with three stages:
     - **Interested**: newly discovered issues being explored.
     - **Working on it**: active contributions currently in progress.
     - **Done**: completed contributions.
   - Short private note editor on each issue (e.g. branch names, assignee status, local testing notes), auto-saving on blur.
   - Status filter tabs (`All`, `Interested`, `Working on it`, `Done`) and real-time search filter.
   - Individual issue removal and a clear **Delete All** action with confirmation.

3. **In-Browser Versioned Storage (`localStorage`)**:
   - **Zero server storage or accounts**: all data stays private in the user's browser.
   - **Versioned envelope schema**:
     ```json
     {
       "version": 1,
       "updatedAt": "2026-11-24T14:40:00.000Z",
       "items": [
         {
           "id": 101,
           "title": "Add dark mode toggle",
           "repository": "facebook/react",
           "url": "https://github.com/facebook/react/issues/101",
           "language": "JavaScript",
           "labels": ["good first issue"],
           "comments": 3,
           "match_score": 92,
           "savedAt": "2026-11-24T14:40:00.000Z",
           "status": "Working on it",
           "note": "Working on branch feat/dark-mode"
         }
       ]
     }
     ```
   - **Quota protection**: enforces `MAX_SAVED_ISSUES = 100` to prevent storage exhaustion.
   - **Resilience**: corrupted or old/unrecognized storage data is ignored gracefully without crashing the page or throwing unhandled errors.

4. **JSON Export and Import Round-Trip**:
   - **Export JSON**: downloads a complete JSON file with metadata, statuses, private notes, and timestamps.
   - **Import JSON**: safely parses and merges imported issues, preserving notes and statuses without data loss.

---

## Acceptance Criteria Verification

- [x] **Saved issues survive a page reload**: Verified by unit tests in `savedIssuesStorage.test.ts` and `savedPage.test.tsx`.
- [x] **Corrupt or old storage data is ignored without crashing the page**: Tested with corrupted JSON, invalid types, future schema versions, and malformed fields.
- [x] **Export and import round-trip without losing data**: Verified that private notes, statuses, and metadata round-trip cleanly through JSON export and import.
- [x] **Unit tests cover the storage helper**: Comprehensive unit test suite in `frontend/__tests__/savedIssuesStorage.test.ts` (17 tests) and page tests in `frontend/__tests__/savedPage.test.tsx`.
