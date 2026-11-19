# Changelog

All notable changes to OpenSourceMate are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Documentation & Governance: comprehensive PR reviewer checklist and kind feedback guide in `docs/REVIEWING.md`, operational triage and release guide for maintainers in `docs/MAINTAINERS.md`, `.github/CODEOWNERS` path ownership mapping, and reviewer checklist references linked from `.github/PULL_REQUEST_TEMPLATE.md`, `CONTRIBUTING.md`, `GOVERNANCE.md`, and `README.md` (#184).
- Frontend: dedicated "Open Source 101" resources page (`/resources`) with curated, verified external guides covering Git basics, first pull requests, reading contributing guides, writing issue comments, and communicating with maintainers, integrated into Navbar and Footer navigation (#187).
- Tooling & Development: devcontainer configuration in `.devcontainer/devcontainer.json` and `.devcontainer/post-create.sh` for one-click GitHub Codespaces cloud development with Python 3.12, Node.js 22, automatic port forwarding (3000, 8000), and "Open in Codespaces" badges in `README.md` and `README.hi.md` (#264).
- Automation & Workflow: scheduled workflow in `.github/workflows/inactive-assignees.yml` and `.github/scripts/check-inactive-assignees.js` that kindly nudges assignees inactive for 5 days and unassigns after 7 days, with `on-hold` exemption policy documented in `CONTRIBUTING.md` and `docs/LABELS.md` (#265).
- CI & Testing: automated test coverage reporting with pytest-cov (80% threshold) and Jest (50% threshold), PR step summary reports, coverage badges in `README.md` and `README.hi.md`, and local coverage scripts (#269).
- Documentation: faithful Hindi translation of the project documentation in `README.hi.md`, language switcher headers across `README.md` and `README.hi.md`, and synchronization guidelines in `CONTRIBUTING.md` (#294).
- Tooling & Documentation: RFC / change proposal template in `.github/ISSUE_TEMPLATE/proposal.yml` and RFC review process in `CONTRIBUTING.md` and `docs/proposals.md` for proposing larger changes (#295).
- Documentation: community support channels and sensitive data guidelines in `SUPPORT.md`, and project governance, roles, decision-making, and contributor progression pathways in `GOVERNANCE.md` (#296).
- Data: a hand-labelled dataset of 72 GitHub issues for difficulty estimation in `data/issue-difficulty-labels.csv`, with labelling guidelines and a validation script (#258).
- Testing: shared sanitized GitHub API response fixtures under `fixtures/` (users, repositories, languages, events, pagination, and edge cases) integrated across backend pytest tests and frontend mocks/tests (#232).
- Documentation: architecture guide, deployment guide, roadmap, label guide, first contribution guide,
  `.env.example` files and a polished README.
- Frontend: FAQ section, issue bookmarks and recommendation filters, recent searches, export of analysis
  results (Markdown and JSON), a refresh button with a last-updated timestamp, a comparison of two GitHub
  profiles, skill grouping, skill proficiency indicators and a skill chart, a "skills to learn next" list,
  pagination of GitHub repositories, a service-unavailable banner, custom 404 and error pages, SEO basics,
  a privacy page and a keyboard shortcut for the navbar.
- Frontend: inline SVG technology icons for 25+ common languages and frameworks in the skill list, accompanied by a neutral fallback icon, documented permissive licenses (`frontend/components/icons/LICENSE.md`), strict CSP preservation, accessibility (`aria-hidden`), and light/dark mode support (#299).
- Backend: environment-based settings, serializers and a health endpoint, structured logging with request
  ids, OpenAPI docs under `/api/v1`, and LLM-written explanations for why an issue matches.
- Tooling: ESLint, Prettier and pre-commit hooks, root development scripts, a welcome workflow for
  first-time contributors, a mock API (MSW) for the frontend, and a frontend test for the analyze flow.
- Tooling: a Security workflow (npm audit, pip-audit, Bandit and CodeQL) on pull requests and weekly, with a triage guide in `docs/security-scanning.md` (#198).
- Tooling: a post-deployment smoke test workflow that checks the backend health endpoint and a profile and skill analysis, configured through repository variables (#199).
- Backend: rule-based extraction of the skills an issue needs from its title, body and labels, driven by a keyword and alias dictionary in `app/data/issue_skill_keywords.json`, with hand-labelled `required_skills` in the evaluation set and a precision/recall script (#271).

### Changed

- Improved GitHub profile card and username form validation.
- TypeScript strict mode is on for the frontend.
- Responsive layout and accessibility fixes across the app.

### Dependencies

- Routine dependency updates from Dependabot (Next.js, TypeScript, ESLint, pydantic, pytest and others).
