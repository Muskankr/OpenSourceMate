# Security Scanning

The **Security** workflow (`.github/workflows/security.yml`) runs on every pull request to `main`, on every push to `main`, every Monday at 05:00 UTC, and on demand from the Actions tab (**Run workflow**).

## What runs

| Job | Tool | Scope | Fails the job on |
|---|---|---|---|
| `npm-audit` | `npm audit` | `frontend/package-lock.json` | high or critical advisory in a production dependency |
| `pip-audit` | [pip-audit](https://github.com/pypa/pip-audit) | `backend/requirements.txt` and what it installs | any known vulnerability that is not on the ignore list in the workflow |
| `bandit` | [Bandit](https://bandit.readthedocs.io/) | `backend/app` | medium or high severity finding |
| `codeql` | [GitHub CodeQL](https://codeql.github.com/) | Python and JavaScript/TypeScript | see below |

Some steps are report only (`continue-on-error`): `npm audit` including dev dependencies, and Bandit low severity findings. They show a warning on the job and the full output is in the log, but they do not fail it.

CodeQL results are uploaded to **Security > Code scanning**. On a pull request GitHub marks the check as failed for new alerts of high or critical security severity by default. Lower severity alerts are listed in the check but do not block.

## Which severities block a merge

| Severity | Blocks a merge? |
|---|---|
| Critical or high (npm production dependency, pip-audit, CodeQL, Bandit high) | Yes, fix it or get a maintainer to accept the risk in the PR |
| Medium (Bandit, CodeQL) | Bandit medium blocks. CodeQL medium does not block, but fix it if it is in code you changed |
| Low, moderate or informational | No. Fix it when it is cheap, otherwise open an issue |

The jobs only fail. To actually stop a merge, a maintainer has to mark the jobs as required status checks in the branch protection rules for `main`.

## Triaging a finding

1. Open the failed job and read the report. Work out whether the finding is in code or a dependency that your pull request touched, or something that was already on `main`.
2. **Dependency advisory (npm audit, pip-audit)**
   - Check the fixed version in the report. For npm, `cd frontend && npm audit fix` bumps the lockfile for compatible fixes; look at the diff before committing it and do not use `--force` without discussing it. For Python, bump the pin in `backend/requirements.txt` and run the backend tests.
   - If the fix needs a major upgrade or a code change, open an issue with the advisory id, the affected package and the fix version. Only then add the id to the ignore list in `security.yml` (the `--ignore-vuln` lines of the pip-audit step) with a comment that says why. Remove it again when the fix lands.
3. **Bandit**
   - Fix the code if the finding is real.
   - If it is a false positive, add `# nosec B###` on that line with a one line reason, for example `# nosec B324 - not used for security`. Reviewers should be able to see why.
4. **CodeQL**
   - Open the alert under **Security > Code scanning** and read the data flow shown for it.
   - Fix real problems. If the alert is a false positive, dismiss it in the alert page with the reason "false positive" or "won't fix" and a note. Do not dismiss an alert without a note.
5. **Real vulnerabilities in the project itself**: do not discuss exploitable details in a public issue or pull request. Follow [SECURITY.md](../SECURITY.md).

Findings that are not fixed in the same pull request must be tracked in an issue, so they do not silently pile up.

## Running the scans locally

```bash
# frontend (needs only package-lock.json)
cd frontend
npm audit --omit=dev --audit-level=high

# backend
pip install pip-audit bandit
pip-audit -r backend/requirements.txt
bandit -r backend/app -ll
```

CodeQL only runs on GitHub.
