# Loading Skeletons and Progressive Feedback

## Overview

Profile and issue matchmaking analysis involves querying multiple GitHub APIs and inference routines (profile details, repository languages, skill detection, and issue matching). In network environments or during intensive analyses, users need immediate, transparent feedback to understand system progress and avoid duplicate submissions.

This enhancement introduces:

1. **Responsive Skeleton Placeholders**: Dimensional mirrors for the Profile summary (`ProfileSkeleton`), Skills summary (`SkillsSkeleton`), and Issue list (`IssuesSkeleton`) that prevent Cumulative Layout Shift (CLS) when real data mounts.
2. **Accessible Step Messages**: Real-time progress updates through an accessible live region (`role="status"`, `aria-live="polite"`) guiding the user through Profile Ingestion, Skill Detection, and Issue Matching.
3. **Synchronous Duplicate Submission Prevention**: Synchronous ref locking (`isAnalyzingRef`) combined with reactive UI button disabling (`disabled` and `aria-busy`) to prevent double-clicks or repeated Enter submissions.
4. **Resilient Terminal States**: Analysis always terminates in either populated developer results or an actionable error alert with retry capabilities.
5. **Internationalization (i18n)**: All progress messages and step titles are fully localized in English (`frontend/messages/en.json`) and Hindi (`frontend/messages/hi.json`).

---

## Architecture & Components

### 1. Progressive Step Tracker (`AnalysisProgressSteps`)

- **Live Region**: Announced by screen readers via `role="status"` and `aria-live="polite"` without disrupting user focus.
- **Pill Stepper**: Displays visual progress indicators for the 3 distinct analysis phases:
  - Phase 1: `Fetching GitHub profile...` (Profile Ingestion)
  - Phase 2: `Detecting technical skills...` (Repository Inference)
  - Phase 3: `Finding matching issues...` (Matchmaking & Recommendation)
- **Status Markers**:
  - _Active step_: Animated pulse indicator and highlighted purple pill (`bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/50`).
  - _Completed step_: Green checkmark badge (`bg-emerald-500/10 text-emerald-400`).
  - _Pending step_: Numbered step index.

### 2. Zero-CLS Skeletons

To satisfy Core Web Vitals standards, each skeleton component strictly mirrors the outer padding, margins, borders, and responsive grid columns of the final rendered content:

| Component         | Final Target          | Dimensions & Layout                                   | Theme Support                                 |
| :---------------- | :-------------------- | :---------------------------------------------------- | :-------------------------------------------- |
| `ProfileSkeleton` | `ProfileCard`         | `p-5 sm:p-7 md:p-8 mb-8`, avatar 80/96px, 3-col stats | Dark (`white/10`) & Light (`gray-200`)        |
| `SkillsSkeleton`  | Technical Skills Card | `mt-6 p-5 sm:p-8`, chip row, 2-col skill cards        | Dark (`white/10`) & Light (`gray-200`)        |
| `IssuesSkeleton`  | Matched Issues Card   | `mt-6 p-5 sm:p-8`, 5-col filter toolbar, 3-card stack | Dark (`purple-500/20`) & Light (`purple-200`) |

### 3. Duplicate Submission Prevention

React state updates are asynchronous. If a user double-clicks an active button in the same event loop tick, a pure state check (`if (loading) return;`) can still execute twice before the next render cycle.

To ensure strict single-request execution:

```typescript
const isAnalyzingRef = useRef(false);

const analyzeProfile = async (override?: string) => {
  // Synchronous lock stops immediate double clicks before render update
  if (isAnalyzingRef.current || loading || loadingMatching) return;
  isAnalyzingRef.current = true;

  try {
    // Pipeline execution...
  } finally {
    isAnalyzingRef.current = false;
  }
};
```

Additionally, the Analyze button and Enter key handlers bind to `disabled={isAnalyzing}` and `aria-busy={isAnalyzing}`.

---

## Testing & Verification

Unit tests in `frontend/__tests__/LoadingProgressSkeletons.test.tsx` verify the three primary acceptance criteria:

1. **Single Request Verification**: Rapid double-clicks trigger exactly one API network call and set `aria-busy="true"`.
2. **Layout & Theme Consistency**: Skeletons mount with matched geometry in both dark and light themes.
3. **Deterministic Completion**: Ensures steps sequentially transition and conclude cleanly in either final results or error alerts with retry handlers.
