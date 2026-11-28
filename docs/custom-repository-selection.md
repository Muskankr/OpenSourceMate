# Custom Repository Selection Architecture

## Problem Statement

Developers frequently maintain diverse repositories on GitHub, including:
1. Academic coursework forks or toy tutorials that do not reflect their true domain preferences.
2. Legacy archived code written in outdated languages they no longer desire to contribute with.
3. Private or secondary repositories that skew recommendations toward undesired technologies.

Previously, profile analysis evaluated the top repositories indiscriminately. Users had no voice in deciding which repositories informed their skill graph and issue match suggestions.

---

## Architecture & Interaction Design

The `<RepositorySelector />` component provides explicit user control before computing skills:
- **Intelligent Default State**:
  - Non-fork, active original repositories are **selected by default**.
  - Forks (`fork === true`) and archived repositories (`archived === true`) are **unselected by default**.
- **Bulk Action Controls**:
  - `Select All`: Includes 100% of detected repositories.
  - `Clear All`: Deselects all repositories.
  - `Defaults`: Swiftly restores the recommended heuristic (excluding forks and archives).
- **Search & Quick Tabs**:
  - Instant text filtering across repository names, languages, and descriptions.
  - Quick view tabs: `All`, `Sources`, and `Forks`.
- **Accessibility & ARIA Compliance**:
  - Screen reader friendly using an `aria-live="polite"` live announcement region announcing inclusions and exclusions dynamically.
  - Proper `<label>` encapsulation with custom keyboard navigation support.

---

## Data Flow Diagram

```text
       Fetched User Repositories
                   |
                   v
       +-----------------------+
       |  RepositorySelector   |
       +-----------------------+
         /         |         \
   [Sources]    [Forks]   [Archived]
  (Checked by  (Unchecked (Unchecked
    default)   by default) by default)
         \         |         /
          \        |        /
       +-----------------------+
       |   User Adjusts Set    |
       |  (Search / Toggles)   |
       +-----------------------+
                   |
                   v
       Emits selected Repositories
                   |
                   v
   Recompute Skills & Issue Matches
```

---

## Verification & Automated Test Coverage
- Component rendering, defaults, interactive toggling, and accessibility verified in `frontend/__tests__/RepositorySelector.test.tsx` (8 unit tests).
