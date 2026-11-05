# Feature Alignment & Copywriting Review Matrix (Issue #189)

## Overview

In alignment with **Issue #189**, this audit reviews all user-facing copy across the landing page (`frontend/app/page.tsx`), profile analyzer, compare tool (`frontend/app/compare/page.tsx`), and project documentation (`README.md`, `ROADMAP.md`).

Claims have been carefully audited against existing production implementations to eliminate over-promising, clarify live capabilities, and add transparent status indicators for features actively in progress (e.g. backend issue-matching and personalized ranking algorithms).

---

## 1. Feature Audit Matrix: Live vs. In-Development

| Capability | Previous Copy / Claim | Reality Status | Updated Accurate Copy |
| :--- | :--- | :--- | :--- |
| **GitHub Profile Analysis** | "Enter a username and receive matched issues" | **LIVE** | "Enter a public GitHub username to analyze technical experience, public repository breakdown, and programming language distributions." |
| **Skill Proficiency Scoring** | "Calculates skill proficiency" | **LIVE** | "Classifies detected skills into Learning, Comfortable, and Strong tiers with transparent repository count weighting." |
| **Profile Comparison** | "Compare two GitHub profiles" | **LIVE** | "Compare two GitHub developer profiles side-by-side to discover shared skills, unique competencies, and Jaccard similarity scores." |
| **Export Capabilities** | "Export analysis results" | **LIVE** | "Export profile analysis reports to JSON, CSV, or Markdown directly in the browser." |
| **Issue Matching Engine** | "Receive matched issues and recommendations" | **IN ACTIVE DEVELOPMENT** (Backend issues [#25](https://github.com/Muskankr/OpenSourceMate/issues/25)–[#28](https://github.com/Muskankr/OpenSourceMate/issues/28)) | Labeled with `Roadmap / In Development` pill badge: "Explore recommended issues and contribution areas matched to your skills (issue matching engine currently in active development)." |
| **AI Match Explanations** | "AI issue match explanations" | **PLANNED** | Clearly demarcated in `README.md` and `ROADMAP.md` under Planned Capabilities. |

---

## 2. Updated Copy Locations

### A. Landing Page & Analyzer Form (`frontend/app/page.tsx`)
- Updated hidden screen-reader hint:
  `Provide a public GitHub username to analyze technical skills, language proficiencies, and repository breakdowns.`
- Updated Step 3 in "How It Works" section:
  Added `Roadmap` badge and adjusted description:
  *"Explore recommended issues and contribution areas matched to your skills (issue matching engine currently in active development)."*

### B. Project Readme (`README.md`)
- Maintained strict distinction between:
  - **`✨ Current Features`**: GitHub Profile Analysis, Technical Skill Analysis, Skill Proficiency Badges, Profile Comparison, and Data Export.
  - **`🎯 Contribution Discovery — Coming Next`**: Skill-based issue matching, personalized recommendation ranking, AI contribution rationale, and real-time GitHub issue syncing.

---

## 3. Reviewer Checklist

When evaluating application claims:
- [x] Does the analyzer accurately describe what is generated upon submitting a username? **Yes** (profile metrics, skill distribution, repository counts).
- [x] Are roadmap features explicitly marked so users understand what is experimental or in development? **Yes** (`Roadmap` badge on Step 3).
- [x] Are empty/fallback states transparent when recommended issues are not yet served by the backend? **Yes** (clear notice provided).


## 4. Detailed Copy Audit Across All Pages

### Hero Section (`frontend/app/page.tsx`)
- Headline: *"Find the open-source issues that fit your skills."*
- Subheadline: *"OpenSourceMate analyzes your GitHub profile and technical experience to help you discover meaningful open-source contribution opportunities."*
- Alignment check: The project vision is retained while the analyzer clearly sets expectations that submitting a username begins with developer experience profiling and language metrics.

### Comparison Tool (`frontend/app/compare/page.tsx`)
- Heading: *"Compare GitHub Profiles"*
- Subtitle: *"Compare two GitHub profiles side by side to uncover shared technologies, unique strengths, and repository distributions."*
- Alignment check: Perfectly matches the working comparison engine implementation.

### Error Messages & Service Fallbacks
- Service Unavailable banner: *"OpenSourceMate backend is temporarily unreachable."*
- Sanitized errors: Raw stack traces and internal Python tracebacks are completely suppressed, protecting internal infrastructure details and presenting friendly user guidance.

### Skill Proficiency Badges
- Learning (1 repository): Clearly documented as initial exploration.
- Comfortable (2-4 repositories): Documented as demonstrated repeat usage.
- Strong (5+ repositories): Documented as proven fluency.
- Alignment check: Matches calculation logic in `frontend/utils/proficiency.ts`.

---

## 5. Ongoing Maintenance Guidelines

1. **New Feature Releases**: Whenever a backend service transitions from development to production (such as issue matching in PRs #25–#28), update `ROADMAP.md`, remove the `Roadmap` badge from Step 3, and refresh the review matrix.
2. **Copy Verification**: Run `npm test -- __tests__/featureAlignment.test.tsx` in CI to ensure that obsolete over-promising copy is not accidentally reintroduced into the landing page.


## 6. Implementation Summary

- [x] Audited landing page hero, analyzer form, and "How It Works" steps for claim fidelity.
- [x] Replaced misleading hidden hint with accurate repository breakdown explanation.
- [x] Added `Roadmap` badge and updated copy for Step 3 (Contribution discovery).
- [x] Documented complete audit matrix and copywriting guidelines in `docs/feature-alignment-review.md` and `docs/copywriting-guidelines.md`.
- [x] Added automated frontend unit tests in `frontend/__tests__/featureAlignment.test.tsx`.
- [x] Added automated documentation verification tests in `backend/tests/test_feature_alignment.py`.


## 8. Alignment Review Summary Table

| Asset Checked | Findings | Modifications Made |
| :--- | :--- | :--- |
| `frontend/app/page.tsx` | Hidden hint stated "receive matched issues". | Corrected to "analyze technical skills, language proficiencies, and repository breakdowns." |
| `frontend/app/page.tsx` | Step 3 described immediate issue matching. | Added `Roadmap` badge and updated description to state matching engine is in active development. |
| `frontend/components/StepCard` | Did not support status badges. | Added optional `badge` prop with high-contrast theme styling. |
| `README.md` | Clear separation between current features and upcoming milestones. | Validated and confirmed compliant with truth-in-capability guidelines. |
| `ROADMAP.md` | Tracks issue matching and LLM explanations under Phase 2. | Cross-referenced and verified. |
