# Feature Flags Architecture for Safe Incremental Rollouts

## Overview

Feature flags allow engineering teams to merge unreleased or partially-complete code into the `main` branch without exposing unstable behavior to production users. This eliminates long-lived feature branches, prevents massive merge conflicts, and enables trunk-based development with canary or preview releases.

OpenSourceMate implements a unified, type-safe feature flagging system across both the Next.js frontend and the FastAPI backend.

---

## Architectural Principles

1. **Default Off in Production (`false` by default)**:
   - Any flag guarding an in-progress feature is strictly disabled by default in production.
   - If an environment variable is omitted, the flag safely evaluates to `false`.
2. **Type Safety & Intellisense**:
   - Every flag is strictly typed in `frontend/utils/featureFlags.ts` via the `FeatureFlags` interface and in `backend/app/config.py` via Pydantic `Settings`.
   - Misspelled flag names or unknown keys generate compile-time TypeScript errors and runtime configuration warnings.
3. **Graceful User Fallback (`<FeatureGate />` & `<ComingSoonPlaceholder />`)**:
   - Features wrapped in `<FeatureGate flag="...">` display a polite, styled, accessible "Feature Coming Soon" status banner when disabled, or remain completely hidden based on configuration.

---

## Flag Registry

| Flag Key (Frontend / Backend) | Environment Variable Name | Feature Description | Default Status |
| :--- | :--- | :--- | :--- |
| `pastedTextAnalysis` / `feature_pasted_text_analysis` | `NEXT_PUBLIC_FEATURE_PASTED_TEXT_ANALYSIS` | Resume & pasted text skill extraction tab (Issue #342) | `false` |
| `repositorySelection` / `feature_repository_selection` | `NEXT_PUBLIC_FEATURE_REPOSITORY_SELECTION` | Interactive repository selection checklist (Issue #343) | `false` |
| `starredRepoInterests` / `feature_starred_repo_interests` | `NEXT_PUBLIC_FEATURE_STARRED_REPO_INTERESTS` | Starred repositories topic interest signals (Issue #344) | `false` |
| `usernameAutocomplete` / `feature_username_autocomplete` | `NEXT_PUBLIC_FEATURE_USERNAME_AUTOCOMPLETE` | Debounced username autocomplete combobox (Issue #346) | `false` |
| `aiExplanations` / `feature_ai_explanations` | `NEXT_PUBLIC_FEATURE_AI_EXPLANATIONS` | AI-generated match rationale explanations | `false` |

---

## Usage Guide

### Frontend Usage
```tsx
import { FeatureGate, ComingSoonPlaceholder } from '@/components/FeatureGate';

export function AnalyzerTabs() {
  return (
    <div>
      <StandardGitHubSearch />

      <FeatureGate
        flag="pastedTextAnalysis"
        fallback={
          <ComingSoonPlaceholder
            featureName="Resume / Text Analysis"
            description="Paste text to discover tailored issues without GitHub profile history."
          />
        }
      >
        <PastedTextAnalyzer />
      </FeatureGate>
    </div>
  );
}
```

### Backend Usage
```python
from app.config import get_settings

settings = get_settings()

if not settings.feature_pasted_text_analysis:
    raise HTTPException(status_code=404, detail="Pasted text analysis feature is not enabled")
```

---

## Testing & Quality Control
- Backend settings tested in `backend/tests/test_feature_flags.py`.
- Frontend parsing and `<FeatureGate />` rendering tested in `frontend/__tests__/featureFlags.test.tsx`.
