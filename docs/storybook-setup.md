# Storybook Setup for Shared UI Components

## Overview
This document outlines the Storybook architecture configured for OpenSourceMate's frontend component library (Issue #203).

Storybook isolates component design, visual testing, and documentation, allowing contributors to preview and test shared UI primitives and application states in isolation across both light and dark themes.

## Configuration

### 1. Framework & Integration (`frontend/.storybook/main.ts`)
- Configured using `@storybook/nextjs` for Next.js 14 / React 18 compatibility.
- Automatic documentation enabled via `autodocs: "tag"`.
- Static asset directory points to `../public`.

### 2. Preview & Theme Decorators (`frontend/.storybook/preview.ts`)
- Imports global Tailwind CSS styles (`../app/globals.css`).
- Provides background presets for dark (`#020617` / Slate 950) and light (`#ffffff`).

## Stories Suite (`frontend/stories/`)
Covers at least 6 components across light/dark themes:
1. `Button.stories.tsx`: `PrimaryDark`, `PrimaryLight`, `Secondary`, `LoadingState`, and `Danger`.
2. `Card.stories.tsx`: `DefaultDark`, `InteractiveLight`, and `GlassEffect`.
3. `Badge.stories.tsx`: Semantic status pills: `Emerald`, `Blue`, `Purple`, `Amber`, and `Rose`.
4. `Skeleton.stories.tsx`: Loading placeholders (`CardSkeletonDark`, `CardSkeletonLight`, `TextLines`).
5. `ErrorStates.stories.tsx`: Service degradation and maintenance banners using `ServiceUnavailableBanner`.
6. `ThemeToggle.stories.tsx`: Accessible theme switcher component in dark and light modes.

## Running Storybook Locally
To start the Storybook development server:
```bash
cd frontend
npm run storybook
```
To build a static production bundle for deployment or design review:
```bash
cd frontend
npm run build-storybook
```

## Automated Verification
Automated test in `frontend/__tests__/StorybookComponents.test.tsx` validates that all story-backed components export cleanly and instantiate without runtime syntax or CSS errors.
