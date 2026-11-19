# Curated Projects Guide

OpenSourceMate maintains a curated directory of active, beginner-welcoming open-source repositories located in [`data/curated-projects.json`](../data/curated-projects.json). These projects serve as verified targets for contributor discovery and matching.

---

## Program Tags (Issue #298)

Each curated project is tagged with the open-source and mentorship programs it participates in. This allows developers looking for opportunities in student or diversity mentorship initiatives to filter and explore relevant repositories.

### Recognized Programs

- **GSoC** (Google Summer of Code)
- **Outreachy**
- **Hacktoberfest**
- **LFX Mentorship** (Linux Foundation)
- **Google Season of Docs** (GSoD)
- **MLH Fellowship** (Major League Hacking)
- **Other** (documented student or community open-source programs)

### Tagging Invariant & Verifiable Sources

Every program tag **must include a verifiable source link** (`source`) proving historical or active participation. Acceptable sources include:

- Official organization archive pages (e.g. `summerofcode.withgoogle.com/archive/...`)
- Program community directory pages (e.g. `outreachy.org/communities/cfp/...`)
- Repository issue labels (e.g. `github.com/<owner>/<repo>/labels/hacktoberfest`)
- Official organization announcement or foundation wiki pages

---

## Schema Overview

Projects must strictly comply with [`data/curated-projects.schema.json`](../data/curated-projects.schema.json):

```json
{
  "repo": "owner/repository",
  "name": "Project Name",
  "description": "Clear, concise 1-2 sentence description.",
  "languages": ["Python", "TypeScript"],
  "topics": ["chat", "collaboration", "good-first-issue"],
  "contributing_url": "https://github.com/owner/repository/blob/main/CONTRIBUTING.md",
  "programs": [
    {
      "name": "GSoC",
      "source": "https://summerofcode.withgoogle.com/archive/2024/organizations/...",
      "years": [2022, 2023, 2024]
    },
    {
      "name": "Outreachy",
      "source": "https://www.outreachy.org/communities/cfp/..."
    }
  ]
}
```

---

## Proposing a New Project

We welcome suggestions for active, contributor-friendly open-source repositories! To propose a new project:

1. **Verify Project Eligibility**:
   - Repository must be public and actively maintained.
   - Must have an established [`CONTRIBUTING.md`](../CONTRIBUTING.md) or equivalent guide.
   - Must have participated in at least one open-source program with a verifiable public link.
2. **Add Entry**:
   - Add your project entry to [`data/curated-projects.json`](../data/curated-projects.json) in alphabetical order.
3. **Run Validation**:
   ```bash
   python scripts/validate_curated_projects.py
   ```
4. **Submit a Pull Request**:
   - Open a PR titled `data: add <project-name> to curated projects list`.
