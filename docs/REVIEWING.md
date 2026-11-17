# Pull Request Review Guide & Reviewer Checklist

This guide outlines our code review principles, expectations, and quality standards for **OpenSourceMate**. Whether you are an officially appointed Reviewer or Maintainer ([GOVERNANCE.md](../GOVERNANCE.md)), or a community member reviewing a peer's contribution, please use this document to guide your reviews.

---

## 1. Our Review Philosophy

Code review is a collaborative learning and quality assurance process, not an interrogation or gatekeeping exercise.

- **Kindness & Empathy First**: Many of our contributors are participating in open source for the first time. Keep comments supportive, respectful, and encouraging.
- **Focus on the Code, Not the Person**: Critique the implementation, not the author. Use collaborative phrasing (e.g., _"What do you think about using `useMemo` here to avoid re-renders?"_ instead of _"You forgot to optimize this"_).
- **Explain the "Why"**: Don't just ask for changes—explain the reasoning behind them (performance, edge cases, accessibility, architectural consistency, or maintainability).
- **Distinguish Requirements from Preferences**: Clearly label blocking issues versus optional suggestions or nits.

---

## 2. Comprehensive Reviewer Checklist

Before approving any pull request, systematically evaluate the following six pillars:

### A. Scope & Issue Alignment

- [ ] **Single Responsibility**: Does the PR address only the issue it references (`Fixes #<number>`)?
- [ ] **No Scope Creep**: Are unrelated refactors, styling updates, or unrelated dependency changes excluded?
- [ ] **Branch Source**: Is the branch branched from latest `main` without extraneous merge commits?

### B. Tests & Code Coverage

- [ ] **Automated Tests Present**: Are new or modified features accompanied by comprehensive unit or integration tests?
- [ ] **Regression Tests for Bug Fixes**: If fixing a bug, is there a regression test that fails without the fix and passes with it?
- [ ] **Coverage Thresholds Maintained**:
  - Backend: Meets or exceeds the **80%** line coverage threshold (`pytest --cov=app`).
  - Frontend: Meets or exceeds the **50%** threshold across statements, branches, functions, and lines (`npm run test:coverage`).
- [ ] **CI Green**: All GitHub Actions workflows (linting, type checking, test suites, build) pass without warnings or failures.

### C. UI, Styling & Visual Consistency

- [ ] **Screenshots or Videos**: For any visual or UI changes, has the author included before/after screenshots or screen recordings in the PR description?
- [ ] **Responsive Design**: Does the UI display properly across mobile (<640px), tablet (768px), and desktop (1024px+) viewports?
- [ ] **Theme Support**: Does the component render correctly in both Dark and Light modes using standard Tailwind design tokens?
- [ ] **No Hardcoded Hex Colors**: Are Tailwind color tokens (`bg-background`, `text-foreground`, `border-border`, etc.) used instead of inline styles or hardcoded RGB/HEX values?

### D. Accessibility (a11y)

- [ ] **Semantic HTML**: Are native HTML elements used appropriately (e.g., `<button>` for clickable actions, `<a>` for links, `<main>`, `<nav>`, `<header>`)?
- [ ] **Keyboard Navigation**: Can all interactive elements be reached and activated using only the keyboard (`Tab`, `Enter`, `Space`, `Escape`)? Is focus state clearly visible?
- [ ] **Labels & ARIA**: Do form inputs have associated `<label>` or `aria-label` attributes? Do icon-only buttons have descriptive accessible names?
- [ ] **Color Contrast**: Does text meet WCAG 2.1 AA minimum contrast ratio (4.5:1 for regular text, 3:1 for large text)?
- [ ] **Reduced Motion**: Are intense animations or transitions wrapped in `motion-reduce:` or respectful of `prefers-reduced-motion`?

### E. Security & Privacy

- [ ] **No Secrets or Credentials**: Ensure no API keys, personal access tokens, passwords, private keys, or `.env` files are committed.
- [ ] **Input Validation & Sanitization**: Are user-supplied inputs and query parameters validated against schemas (Pydantic in backend, Zod or TypeScript types in frontend)?
- [ ] **Safe External Data**: Are external GitHub API responses safely unwrapped with fallback defaults to prevent null dereferences?
- [ ] **Sanitized Logging**: Are sensitive user headers, authorization tokens, or cookies excluded from server and console logs?

### F. Documentation & Changelog

- [ ] **Documentation Updates**: If user-facing behaviour, API endpoints, or setup steps changed, are the corresponding docs updated (e.g., [README.md](../README.md), [ARCHITECTURE.md](../ARCHITECTURE.md), OpenAPI specs)?
- [ ] **Bilingual Consistency**: If [README.md](../README.md) was modified, is [README.hi.md](../README.hi.md) kept in sync?
- [ ] **Changelog Entry**: Is there a single-line summary added under `[Unreleased]` in [CHANGELOG.md](../CHANGELOG.md) (under `Added`, `Changed`, or `Fixed`)?

---

## 3. How to Give Constructive, Kind Feedback

### Prefix Your Comments

Help contributors understand your intent quickly by prefixing comments with conventional labels:

| Prefix         | Meaning                                                              | Action Required?                         |
| :------------- | :------------------------------------------------------------------- | :--------------------------------------- |
| `[blocking]`   | Critical bug, security issue, failing tests, or architectural flaw.  | **Yes** — must be resolved before merge. |
| `[suggestion]` | A cleaner, more idiomatic, or performant alternative.                | **Recommended**, but open to discussion. |
| `[nit]`        | Minor polish, typo, comment grammar, or formatting detail.           | **Optional** — contributor's choice.     |
| `[question]`   | Seeking clarification on why a specific approach was chosen.         | **Yes** — reply in thread to clarify.    |
| `[praise]`     | Celebrating elegant solutions, great test coverage, or clean design! | **None** — just good vibes.              |

### Use GitHub Suggestion Blocks

Whenever proposing a concrete change or syntax fix, use GitHub's suggestion syntax so the author can apply it with a single click:

````markdown
```suggestion
const formattedDate = useMemo(() => formatDate(date), [date]);
```
````

### Examples: Constructive vs. Non-Constructive Comments

❌ **Unhelpful**: _"This is messy and slow."_  
✅ **Constructive**: _"[suggestion] In `backend/app/services/matching.py`, iterating over all repositories inside this loop runs in $O(N \times M)$ time. Could we index repositories by name in a dictionary first so lookups are $O(1)$?"_

❌ **Unhelpful**: _"Fix the accessibility here."_  
✅ **Constructive**: _"[blocking] The filter button doesn't have an accessible name for screen readers. Adding `aria-label="Filter by skill"` or visible text inside the button will ensure it passes our WCAG AA accessibility check."_

---

## 4. Review Decisions: When to Approve, Comment, or Request Changes

### When to **Approve**

Select **Approve** when:

1. All items in the [Reviewer Checklist](#2-comprehensive-reviewer-checklist) are satisfied.
2. All automated CI checks have passed.
3. Any previous questions or discussions have reached consensus and have been marked as resolved.
4. If minor non-blocking nits remain, you trust the author to apply them or follow up.

### When to **Comment**

Select **Comment** when:

1. You have open questions about design choices or implementation details.
2. You have suggestions or early feedback on a Work-in-Progress (WIP) or Draft PR.
3. You are leaving initial review notes while waiting for automated CI to complete.

### When to **Request Changes**

Select **Request Changes** only when there are substantive, blocking blockers that prevent the PR from being safely merged:

- Failing automated test suites or broken builds.
- Missing automated tests for new functionality or regressions for bug fixes.
- Significant violation of project security, accessibility, or architecture rules.
- Accidental commit of secrets, credentials, or large binary assets.
- Unannounced breaking API changes that bypass the [RFC proposal process](proposals.md).

_Note: Always provide clear, actionable steps on what is needed to move the PR from "Changes Requested" to "Approved"._

---

## 5. Merging & Post-Merge Process (Maintainers)

Only repository maintainers with write permissions can merge approved PRs.

1. **Verify Approvals & CI**: Ensure at least one maintainer or appointed reviewer has approved and all CI checks are green.
2. **Squash and Merge**:
   - We default to **Squash and Merge** to maintain a clean linear commit history on `main`.
   - Title: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat(ui): add reviewer checklist and codeowners (#184)`).
   - Body: Include a summary of changes and reference closed issues (`Fixes #184`).
3. **Delete Branch**: Delete the topic branch on the repository after merging.
4. **Thank the Contributor**: Leave a short note thanking the author for their effort and contribution!
