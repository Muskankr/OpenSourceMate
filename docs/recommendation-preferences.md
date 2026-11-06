# Recommendation Preferences Panel Guide (Issue #191)

## Overview

Issue **#191** resolves the gap where the "How It Works" workflow promises contribution matches that align with "contribution goals" without providing users a mechanism to define their objectives.

This feature introduces an accessible, collapsible **Preferences Panel** storing typed contribution criteria in guarded browser `localStorage` and exposes a unified object for future recommendation engine API calls.

---

## 1. Typed Preference Schema (`utils/preferences.ts`)

```typescript
export interface UserPreferences {
  goal: "general" | "learn" | "portfolio" | "gsoc" | "hacktoberfest" | "mentorship";
  difficulty: "any" | "good-first-issue" | "intermediate" | "advanced";
  includeLanguages: string[];
  excludeLanguages: string[];
  timeAvailability: "casual" | "regular" | "dedicated";
  onlyAssignedOpportunities: boolean;
  notifyOnNewMatches: boolean;
  updatedAt?: string;
}
```

---

## 2. Guarded Persistence Strategy

- **Browser Storage (`osm_recommendation_preferences_v1`)**:
  Preferences persist across browser reloads and navigation sessions.
- **Fail-Safe SSR & Privacy Guards**:
  If `localStorage` is disabled or blocked in private browsing modes, the helper functions catch errors safely and return immutable `DEFAULT_PREFERENCES` without throwing runtime exceptions.
- **One-Click Reset**:
  Users can clear saved preferences back to defaults at any time.

---

## 3. UI Component (`components/PreferencesPanel.tsx`)

- **Collapsible Toggle**:
  Keeps the landing and results page clean while remaining one click away.
- **Goal Cards**:
  Visually distinct buttons for GSoC, portfolio building, mentorship, and learning.
- **Language Priority Filters**:
  Quick tag pills for common languages (TypeScript, Python, Go, Rust, etc.) with custom tag additions.
- **Visual Feedback**:
  Displays a subtle "Saved" status indicator when choices update.

---

## 4. Testing & Verification

Automated unit tests in `frontend/__tests__/preferences.test.ts`:
- Validates default values.
- Tests localStorage persistence and parsing.
- Verifies reset behavior and error resilience during storage quota limits.
