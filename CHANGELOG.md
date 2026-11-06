# Changelog

All notable changes to OpenSourceMate are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Documentation: architecture guide, deployment guide, roadmap, label guide, first contribution guide,
  `.env.example` files and a polished README.
- Frontend: FAQ section, issue bookmarks and recommendation filters, recent searches, export of analysis
  results (Markdown and JSON), a refresh button with a last-updated timestamp, a comparison of two GitHub
  profiles, skill grouping, skill proficiency indicators and a skill chart, a "skills to learn next" list,
  pagination of GitHub repositories, a service-unavailable banner, custom 404 and error pages, SEO basics,
  a privacy page and a keyboard shortcut for the navbar.
- Backend: environment-based settings, serializers and a health endpoint, structured logging with request
  ids, OpenAPI docs under `/api/v1`, and LLM-written explanations for why an issue matches.
- Tooling: ESLint, Prettier and pre-commit hooks, root development scripts, a welcome workflow for
  first-time contributors, a mock API (MSW) for the frontend, and a frontend test for the analyze flow.

### Changed

- Improved GitHub profile card and username form validation.
- TypeScript strict mode is on for the frontend.
- Responsive layout and accessibility fixes across the app.

### Dependencies

- Routine dependency updates from Dependabot (Next.js, TypeScript, ESLint, pydantic, pytest and others).
