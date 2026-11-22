# Automated Releases & Changelog Guide (release-please)

OpenSourceMate uses [Google release-please](https://github.com/googleapis/release-please) to automate changelog maintenance, version bumping, Git tagging, and GitHub Releases based on [Conventional Commits](https://www.conventionalcommits.org/).

This system replaces the manual `CHANGELOG.md` updates previously required from contributors (Round 3 #47).

---

## 1. How It Works: The Automated Release Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Contributor opens PR with Conventional Commit Title          │
│    (Checked by .github/workflows/pr-title.yml)                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Maintainer squash-merges PR into `main`                      │
│    (Squash commit message retains the PR title)                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. `release-please` runs automatically on `main` push           │
│    - Analyzes new Conventional Commits                          │
│    - Opens or updates Release PR: `chore(main): release vX.Y.Z` │
│    - Bumps CHANGELOG.md, frontend/package.json, pyproject.toml │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Maintainer merges the Release PR                             │
│    - Creates Git tag `vX.Y.Z`                                   │
│    - Publishes GitHub Release with categorized release notes    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Commit & PR Title Conventions

Because release-please creates release notes from commits on `main`, pull request titles must strictly follow Conventional Commits:

| Prefix             | Semantic Meaning                           | Version Impact (SemVer)            | Changelog Section        |
| :----------------- | :----------------------------------------- | :--------------------------------- | :----------------------- |
| `feat:`            | New feature or functionality               | **Minor** bump (`0.1.0` → `0.2.0`) | Features                 |
| `fix:`             | Bug fix or regression patch                | **Patch** bump (`0.1.0` → `0.1.1`) | Bug Fixes                |
| `perf:`            | Performance optimization                   | **Patch** bump (`0.1.0` → `0.1.1`) | Performance Improvements |
| `feat!:` / `fix!:` | Breaking change                            | **Major** bump (or minor pre-1.0)  | Features / Bug Fixes     |
| `docs:`            | Documentation update                       | None (included in notes)           | Documentation            |
| `refactor:`        | Code restructuring without bug fix/feature | None (included in notes)           | Code Refactoring         |
| `test:`            | Adding or fixing test suites               | None (included in notes)           | Tests                    |
| `ci:`              | CI/CD automation and workflow updates      | None (included in notes)           | Continuous Integration   |
| `chore:`           | Tooling, dependencies, or configuration    | None (included in notes)           | Miscellaneous Chores     |

The [PR Title workflow](file:///e:/OpenSourceMate/.github/workflows/pr-title.yml) verifies each PR title automatically and provides helpful feedback if formatting is invalid.

---

## 3. Maintainer Instructions

### Merging Community Pull Requests

When merging pull requests into `main`:

1. Use **Squash and Merge**.
2. Ensure the squash commit title matches the validated Conventional Commit title (e.g., `feat(ui): add mobile navigation menu (#320)`).
3. Do **not** ask contributors to manually edit `CHANGELOG.md` in their PR.

### Managing the Release Pull Request

1. Whenever conventional commits land on `main`, the [Release Automation workflow](file:///e:/OpenSourceMate/.github/workflows/release.yml) runs.
2. If unreleased changes exist, `release-please` will open or update a Release PR titled `chore(main): release X.Y.Z`.
3. The Release PR contains:
   - Clean entries in `CHANGELOG.md` derived from commit messages.
   - Synchronized version updates in `frontend/package.json` and `backend/pyproject.toml`.
   - Updated `.release-please-manifest.json`.
4. As more features or fixes are merged into `main`, release-please will continuously update the same open Release PR.
5. **To cut a release**: Simply review the Release PR diff and merge it!
6. Once merged, release-please creates the Git tag (e.g. `v0.2.0`) and publishes the official GitHub Release.

---

## 4. Testing & Running on a Fork

Maintainers and contributors can test this workflow on a personal fork:

1. **Enable GitHub Actions**:
   - Go to your fork's **Settings > Actions > General**.
   - Under **Workflow permissions**, choose **Read and write permissions**.
   - Check **Allow GitHub Actions to create and approve pull requests**.
2. **Trigger the Workflow**:
   - Push a commit to `main` with a Conventional Commit prefix (e.g. `feat: test release automation on fork`).
   - Alternatively, navigate to **Actions > Release Automation (release-please)** and click **Run workflow**.
3. **Verify the Output**:
   - Check the **Pull requests** tab on your fork: `release-please[bot]` will open a `chore(main): release 0.2.0` pull request.
   - Merging that PR will publish a release on your fork under **Releases** and create tag `v0.2.0`.

---

## 5. Configuration Reference

- **Workflow**: [`.github/workflows/release.yml`](file:///e:/OpenSourceMate/.github/workflows/release.yml)
- **Manifest File**: [`.release-please-manifest.json`](file:///e:/OpenSourceMate/.release-please-manifest.json) — Tracks current version for the repository root (`"."`).
- **Configuration**: [`.github/release-please-config.json`](file:///e:/OpenSourceMate/.github/release-please-config.json) — Specifies package release type (`node`), changelog path (`CHANGELOG.md`), extra versioned files (`frontend/package.json`, `backend/pyproject.toml`), and changelog section headings.
- **PR Title Checker**: [`.github/workflows/pr-title.yml`](file:///e:/OpenSourceMate/.github/workflows/pr-title.yml) — Validates PR titles against Conventional Commits.
