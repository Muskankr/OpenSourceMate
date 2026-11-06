# GitHub Profile Health Checklist Guide (Issue #194)

## Overview

Issue **#194** introduces a profile readiness checklist tailored for students and developers aspiring to contribute to open source.

Instead of displaying a reductionist or punitive single "score" that could discourage newcomers, the checklist evaluates key profile and repository hygiene factors independently, pairing each with a concise, actionable one-line tip.

---

## 1. Evaluated Readiness Rules

Documented in `frontend/utils/profileHealth.ts`:

| Rule ID | Criteria | Passed Criteria | Constructive Guidance / Tip |
| :--- | :--- | :--- | :--- |
| `bio` | Profile Bio & Focus | Bio present with >= 10 characters | "Add a 1-2 sentence bio mentioning your preferred languages and open-source interests." |
| `profile_readme` | Special Profile README | User has `username/username` repository | "Create a repository matching your username to showcase your projects and background." |
| `context` | Location or Affiliation | Location or organization specified | "Specify your general location or timezone to help maintainers schedule reviews." |
| `website` | Portfolio or Social Link | Valid blog, portfolio, or LinkedIn URL | "Link your personal blog, LinkedIn, or portfolio to provide extra context to project maintainers." |
| `repo_descriptions` | Repository Descriptions | >= 50% of top repos contain descriptions | "Add short descriptions to your top repositories so visitors quickly understand what each project does." |
| `licenses` | Open-Source Licenses | >= 50% of top repos contain recognized licenses | "Add an open-source license (such as MIT or Apache 2.0) to your public repositories so others can legally use them." |

---

## 2. Design Principles

1. **No Gamified Shaming**: We avoid arbitrary letter grades (e.g. "F Grade") or punitive percentage meters.
2. **Encouraging Feedback**: Passing items feature clear checkmarks with positive affirmation.
3. **High-Impact Guidance**: Incomplete high-impact items (such as missing bio or repository descriptions) are marked with an unobtrusive `Recommended` tag.
4. **Accessible Contrast**: Fully supports WCAG 2.1 AA contrast levels in both light and dark themes.

---

## 3. Testing & Verification

Unit tests in `frontend/__tests__/profileHealth.test.ts`:
- Tests all 6 health check rules against full, partial, and minimal profile inputs.
- Verifies description and license threshold ratios.
- Tests component rendering in both light and dark modes.
