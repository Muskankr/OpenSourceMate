# Maintainer Guide – OpenSourceMate

This guide provides practical instructions for repository maintainers on managing issues, triaging incoming contributions, executing releases, and maintaining repository health.

For governance rules, roles, and promotion criteria, refer to [GOVERNANCE.md](../GOVERNANCE.md).

---

## 1. Maintainer Responsibilities & Privileges

Maintainers hold write and administration access to OpenSourceMate. With this access comes the responsibility to:

- Keep the `main` branch healthy, buildable, and test-passing at all times.
- Ensure timely and empathetic triage and review of community contributions.
- Enforce code quality, accessibility, test coverage, and security standards.
- Safeguard the community environment per the [Code of Conduct](../CODE_OF_CONDUCT.md).

Code ownership across key repository paths is defined in [`.github/CODEOWNERS`](../.github/CODEOWNERS).

---

## 2. Issue Triage Workflow

Maintainers should triage incoming issues regularly (recommended daily or every 48 hours):

1. **Verify Clarity & Reproduction**:
   - Check if bug reports provide environment details, expected vs. actual behavior, and reproduction steps.
   - For feature requests, ensure problem statements are articulated before discussing implementation.
2. **Apply Appropriate Labels** (see [`docs/LABELS.md`](LABELS.md)):
   - **Type**: `bug`, `feature`, `documentation`, `chore`.
   - **Difficulty / Level**: `level 1 (beginner)`, `level 2 (intermediate)`, `level 3 (advanced)`.
   - **Scope**: `backend`, `frontend`, `accessibility`, `testing`.
   - **Contributor Tags**: Add `good first issue` or `help wanted` where applicable.
3. **Assigning Issues**:
   - Do not assign issues without confirming that the contributor has read the requirements and stated their approach.
   - Limit contributors to **one assigned issue at a time** to give everyone an opportunity to contribute.
4. **Monitoring Inactive Assignments**:
   - The automated workflow [`.github/workflows/check-inactive-assignees.yml`](../.github/workflows/check-inactive-assignees.yml) nudges assignees after 5 days of inactivity and unassigns after 7 days.
   - If a contributor requests an extension for valid reasons (e.g. exams, awaiting reviews), add the `on-hold` label to prevent automated unassignment.

---

## 3. Pull Request Review & Merge Protocol

All pull requests must follow the [Pull Request Review Guide & Checklist](REVIEWING.md).

### Pre-Merge Requirements

- [ ] At least one approving review from a maintainer or designated code owner ([`.github/CODEOWNERS`](../.github/CODEOWNERS)).
- [ ] All automated CI checks green (Ruff, Prettier, TypeScript, backend pytest, frontend Jest).
- [ ] Code coverage thresholds satisfied (Backend $\ge$ 80%, Frontend $\ge$ 50%).
- [ ] All review conversations marked resolved.
- [ ] Branch up to date with `main` without merge conflicts.

### Merging Strategy

- Always use **Squash and Merge** unless there is a specific architectural reason to preserve explicit commits.
- Format the commit title following [Conventional Commits](https://www.conventionalcommits.org/):
  ```text
  feat(backend): add endpoint for matching skill recommendations (#184)
  ```
- Ensure the commit body includes references to resolved issues (`Fixes #184`).
- Automatically or manually delete the feature branch once merged.

---

## 4. Release Management & Versioning

OpenSourceMate follows [Semantic Versioning (SemVer)](https://semver.org/):

- `MAJOR` (x.0.0): Incompatible API or structural breaking changes.
- `MINOR` (0.x.0): Backwards-compatible new features.
- `PATCH` (0.0.x): Backwards-compatible bug fixes and documentation.

### Steps to Cut a Release:

1. **Update `CHANGELOG.md`**:
   - Move entries from `[Unreleased]` into a new section titled `## [X.Y.Z] - YYYY-MM-DD`.
   - Ensure changes are categorized under `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, or `Security`.
2. **Version Bump**:
   - Update version fields in `backend/pyproject.toml` and `frontend/package.json` if applicable.
3. **Draft GitHub Release**:
   - Tag the release commit as `vX.Y.Z` on `main`.
   - Use GitHub's **Generate release notes** button which leverages categories from [`.github/release.yml`](../.github/release.yml).
   - Publish the release.

---

## 5. Security & Vulnerability Handling

- Do not discuss undisclosed security vulnerabilities in public issues or PRs.
- Vulnerability reports are submitted privately via GitHub Security Advisories or as detailed in [SECURITY.md](../SECURITY.md).
- Maintainers must:
  1. Acknowledge receipt within 48 hours.
  2. Create a private GitHub Security Advisory and fork to collaborate on the fix.
  3. Validate the patch with regression tests.
  4. Release a patch release and publish the advisory with CVE assignment if appropriate.

---

## 6. Escalations & Code of Conduct

If an issue arises involving harassment, toxic behavior, or unresolved conflict:

1. Promptly de-escalate discussions in public threads. If necessary, lock the conversation temporarily.
2. Refer to the conflict resolution guidelines in [GOVERNANCE.md](../GOVERNANCE.md) and enforcement procedures in [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md).
3. If necessary, email the maintainer team at `governance@opensourcemate.dev` (or reach out directly to `@Muskankr`).
