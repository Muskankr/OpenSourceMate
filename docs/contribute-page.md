# Contribute Page: OpenSourceMate Good First Issues

## Overview
This document specifies the purpose and implementation of the Contribute page (`/contribute`) added in Issue #200.

While OpenSourceMate recommends external open-source projects and issues for users, new contributors frequently look to contribute directly to OpenSourceMate itself. The Contribute page surfaces beginner-friendly issues from `Muskankr/OpenSourceMate` labeled `good first issue`.

## Features

### 1. Direct Good First Issue Discovery
- Dynamically queries GitHub API:
  `GET https://api.github.com/repos/Muskankr/OpenSourceMate/issues?labels=good%20first%20issue&state=open`
- Normalizes issues to match the standard `IssueRecommendation` format and renders using the reusable `IssueCard` component (Issue #58).
- Graceful degradation: If GitHub unauthenticated rate limits occur, falls back automatically to verified curated repository issues with an alert banner.

### 2. Category Filtering
Interactive filter pills allow prospective contributors to filter issues by expertise area:
- **All**: Displays all available issues.
- **Frontend**: Next.js, React, and UI issues.
- **Backend**: FastAPI, Python, and async pipeline tasks.
- **Documentation**: Guides, tutorials, and architectural markdown documents.
- **Tests**: Pytest and Jest test coverage expansions.

### 3. SEO & Shareability
- Next.js 14 App Router route-level metadata in `frontend/app/contribute/layout.tsx`.
- OpenGraph and Twitter card tags configured for preview cards on social platforms.
- Clear link back to home and direct link to `CONTRIBUTING.md`.

### 4. Contributing Workflow Guidance
Contributors can immediately get started by:
1. Forking `Muskankr/OpenSourceMate`.
2. Setting up the local environment (`backend` via FastAPI and virtualenv, `frontend` via Next.js and npm).
3. Finding an open issue on the `/contribute` page.
4. Opening a PR linked to the relevant issue.

### 5. Automated Testing and Code Quality
The contribute page features automated unit testing in `frontend/__tests__/ContributePage.test.ts` to ensure:
- Fallback issue metadata completeness and valid HTTPS URLs.
- Tag filtering accuracy across frontend, backend, documentation, and testing tracks.
- Beginner suitability and non-duplicated titles.
- High accessibility standards compliant with WCAG AA guidelines for interactive buttons and links.

