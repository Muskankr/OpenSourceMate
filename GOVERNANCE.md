# Project Governance – OpenSourceMate

This document describes the governance structure, decision-making processes, contributor roles, and conflict resolution mechanisms for **OpenSourceMate**.

---

## 1. Principles

OpenSourceMate operates under the following core tenets:

- **Openness & Transparency**: Discussions, roadmap planning, architectural decisions, and reviews take place in public on GitHub.
- **Meritocracy & Inclusivity**: Influence and leadership are earned through constructive contributions, thoughtful reviews, and helpful community stewardship.
- **Kindness & Empathy**: We abide by the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md) in all repository spaces.

---

## 2. Roles and Responsibilities

We recognize three primary roles in the community:

### Contributor

- **Who they are**: Anyone who engages with the project by reporting bugs, suggesting features, participating in discussions, submitting pull requests (code, documentation, tests, design), or triaging issues.
- **Responsibilities**:
  - Follow the [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).
  - Submit tested, well-documented changes conforming to project standards.
  - Engage respectfully during code reviews.

### Reviewer

- **Who they are**: Active, trusted contributors who have demonstrated a track record of high-quality PRs, reliable code reviews, and deep familiarity with the codebase.
- **Responsibilities**:
  - Review pull requests for architectural fit, test coverage, security, and accessibility.
  - Triage incoming issues by validating reproduction steps and applying relevant labels (`docs/LABELS.md`).
  - Help onboard first-time contributors with constructive, supportive feedback.
  - Recommend PRs for merging to maintainers.

### Maintainer / Project Lead

- **Who they are**: Core project leaders responsible for repository direction, security, and releases. The Project Admin and Lead Maintainer is Muskan Kumari ([@Muskankr](https://github.com/Muskankr)).
- **Responsibilities**:
  - Make final decisions on architecture, features, and breaking changes.
  - Approve and merge pull requests into `main`.
  - Maintain CI/CD pipelines, release management ([docs/RELEASES.md](docs/RELEASES.md)), and package deployments.
  - Enforce the [Code of Conduct](CODE_OF_CONDUCT.md) and handle reported security vulnerabilities ([SECURITY.md](SECURITY.md)).
  - Nominate and onboard new Reviewers and Maintainers.

---

## 3. How Someone Moves Up

We actively encourage contributors to grow into leadership roles:

```
Contributor ───► Reviewer ───► Maintainer
```

### From Contributor to Reviewer

Contributors who consistently display:

1. Multiple accepted, high-quality pull requests across different subsystems (frontend, backend, testing, or docs).
2. Constructive, thorough reviews on peer pull requests.
3. Friendly, respectful participation in GitHub Discussions and issues.
4. Consistent alignment with project code standards.

_Path_: Any current Maintainer can nominate a Contributor to become a Reviewer. If other maintainers agree without objection, the contributor is invited to the Reviewers team with triage and review permissions.

### From Reviewer to Maintainer

Reviewers who:

1. Actively maintain components, triage issues, and review PRs over a sustained period (typically 3–6 months).
2. Demonstrate strong technical judgment, commitment to project stability, and proactive communication.
3. Uphold security, accessibility, and architectural standards.

_Path_: Existing Maintainers discuss the nomination in private. Upon consensus of the maintainer team and approval from the Project Admin ([@Muskankr](https://github.com/Muskankr)), the candidate is invited to the Maintainers team with write/merge access.

---

## 4. Decision-Making Process

We prioritize consensus-driven collaboration:

1. **Lazy Consensus for Routine Changes**:
   - Small bug fixes, documentation improvements, dependency updates, and minor features require approval from at least one Reviewer or Maintainer. If no objections are raised, the PR is merged.
2. **RFCs for Significant Changes**:
   - Major features, API changes, or architectural shifts must first be proposed using the [RFC / Proposal Template](.github/ISSUE_TEMPLATE/proposal.yml) following our [Proposal Process](docs/proposals.md).
   - Significant architectural decisions are documented as **Architecture Decision Records (ADRs)** in [`docs/adr/`](docs/adr/).
3. **Maintainer Consensus**:
   - Decisions affecting security policies, release versions, breaking API changes, or governance require explicit consensus among Maintainers.

---

## 5. Conflict Resolution

Disagreements are natural in software development and should be addressed constructively:

1. **Technical Disagreements**:
   - Focus on data, benchmarks, code readability, user experience, and architecture principles.
   - Seek input from other team members and Reviewers on GitHub.
2. **Tie-Breaker**:
   - If consensus cannot be reached after thorough discussion, the **Project Admin ([@Muskankr](https://github.com/Muskankr))** holds the final deciding vote to unblock the project.
3. **Conduct Violations**:
   - In cases of interpersonal conflict or harassment, the procedures in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) apply. The maintainers will take appropriate action (warnings, temporary bans, or permanent expulsion).
