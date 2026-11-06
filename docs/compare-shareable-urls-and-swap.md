# Compare Page: Shareable URLs, Swap Button & Duplicate Check Guide (Issue #190)

## Overview

Issue **#190** enhances the GitHub Profile Comparison tool (`/compare`) with shareable permalinks (`/compare?a=user1&b=user2`), an intuitive swap button, duplicate-username validation, and resilient error recovery preserving valid analysis results when one username fails.

---

## 1. Shareable Comparison Permalinks

- **Query Parameters**: Standardized on `/compare?a=user1&b=user2` while maintaining backwards-compatibility with `/compare?user1=...&user2=...`.
- **URL Synchronization**: As developers enter or swap handles, the browser address bar dynamically reflects the active pair via `window.history.replaceState`.
- **Direct Link Sharing**: Pasting or opening a permalink (e.g. `/compare?a=torvalds&b=gaearon`) automatically initializes the side-by-side comparison.

---

## 2. Developer Position Swap Button

- A prominent, accessible swap button is embedded in the comparison form.
- Clicking the button:
  1. Swaps `Developer 1` and `Developer 2` text input states.
  2. Swaps already-loaded profile cards and skill breakdowns immediately without triggering redundant network requests.
  3. Updates the address bar query string (`?a=...&b=...`).

---

## 3. Duplicate Username Validation

- When a user submits the same handle for both Developer 1 and Developer 2 (e.g. `octocat` vs `octocat` or `OCTOCAT`):
  - The tool rejects the comparison before making unnecessary GitHub API requests.
  - Returns clear inline feedback: *"Cannot compare a developer with themselves. Please enter two different GitHub usernames."*

---

## 4. Isolated Failure Recovery

- When one profile is invalid or not found on GitHub, `Promise.allSettled` ensures the other valid profile remains fully analyzed, rendered, and interactive.

---

## 5. Automated Verification & Tests

Unit and integration tests reside in `frontend/__tests__/compareUrl.test.ts`. Run:

```bash
cd frontend
npm test -- __tests__/compareUrl.test.ts
```


## 6. Implementation Checklist

- [x] Support `/compare?a=user1&b=user2` alongside backward-compatible `/compare?user1=...&user2=...`.
- [x] Keep query parameters synced with browser URL history without reloading page.
- [x] Add prominent developer swap buttons with instant state reflection.
- [x] Validate against duplicate usernames case-insensitively before triggering API requests.
- [x] Ensure that if one lookup fails (e.g. 404 or network timeout), the other result is preserved.
- [x] Add comprehensive unit test suite in `frontend/__tests__/compareUrl.test.ts`.
- [x] Update documentation in `docs/compare-shareable-urls-and-swap.md`.


## 7. Deep-Linking and Social Sharing Example

Users can share direct comparison links across social platforms, Discord, or GitHub issues:
```text
https://open-source-mate-tawny.vercel.app/compare?a=torvalds&b=gaearon
```
When recipients load the URL:
1. `initialUser1` is set to `torvalds`.
2. `initialUser2` is set to `gaearon`.
3. Parallel fetches begin immediately, populating the comparison matrix.
4. If one developer handle ceases to exist on GitHub (e.g. 404), the other developer's profile and skills remain fully rendered with an inline error message for the missing user.
