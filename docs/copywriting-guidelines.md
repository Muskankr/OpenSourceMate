# OpenSourceMate Copywriting & Tone of Voice Guidelines

## Purpose

These guidelines define the messaging principles for OpenSourceMate to ensure all interface text, error messages, landing page copy, and documentation accurately reflect working capabilities without inflating roadmap aspirations into false promises.

---

## Core Principles

### 1. Truth in Capability
- **Rule**: If a feature is not merged into `main` and verified with tests, it must never be presented as an active, immediate capability.
- **Example**:
  - ❌ *"Enter your username and receive AI-matched open-source issues!"* (Issue matching is actively in progress under issues #25–#28).
  -  *"Enter your username to analyze technical skills, language proficiencies, and repository breakdowns."*

### 2. Transparent Roadmap Indicators
- When showcasing upcoming milestones on the landing page or documentation, always accompany them with a distinct status badge:
  - `[Roadmap]` / `[In Development]` / `[Planned]`
- Link directly to [ROADMAP.md](../../ROADMAP.md) so users and contributors can track real progress.

### 3. Clear, Jargon-Free Explanation of Metrics
- **Skill Proficiency**: Explain how tiers are calculated (1 repo = Learning, 2–4 repos = Comfortable, 5+ repos = Strong) without claiming proprietary ML models when simple transparent heuristics are in place.
- **Repository Weights**: Clarify whether fork repositories are counted or excluded.

### 4. Respectful, Non-Intrusive Error Handling
- Never show raw internal exceptions, database connection strings, or server tracebacks.
- State what went wrong in plain human language, offer a concrete next step (such as "Retry" or "Report Problem"), and link to our GitHub issue tracker.

---

## Glossary of Approved Terms

| Term | Approved Usage | Deprecated / Disallowed Usage |
| :--- | :--- | :--- |
| **Developer Profile Analysis** | Use when describing GitHub data retrieval and skill aggregation. | "Automated Candidate Evaluation" |
| **Skill Proficiency Indicator** | Use when describing repository-based skill breakdown badges. | "Expertise Certification" |
| **Profile Comparison** | Use for comparing two profiles side-by-side. | "Developer Faceoff" / "Ranking Battle" |
| **Contribution Discovery** | Use for browsing curated issues and open source opportunities. | "Guaranteed PR Acceptance" |


## 6. Style & Tone Standards

- **Voice**: Collaborative, welcoming, precise, open-source first.
- **Audience**: Contributors ranging from first-time Git learners to seasoned open-source maintainers.
- **Clarity**: Avoid hype, superlatives ("revolutionary", "game-changing"), or vague promises. State specifically what the software does, how it gathers data, and how developers can participate.
- **Inclusive Language**: Adhere to the Contributor Covenant Code of Conduct; avoid discriminatory idioms or gendered assumptions.


## 7. Tone and Vocabulary Checklist

Before committing new UI labels or markdown documentation:
1. Does this phrase describe functionality that works today in `main`?
2. If this is a forward-looking feature, is it accompanied by a `[Roadmap]` or `[Coming Soon]` badge?
3. Is technical jargon avoided where everyday developer language works better?
4. Is the tone encouraging and accessible to newcomers without condescension?
5. Are all error messages actionable with clear next steps?
