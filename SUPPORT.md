# Getting Support for OpenSourceMate

Thank you for using and contributing to **OpenSourceMate**! We are committed to fostering a welcoming and helpful community. This document outlines the best channels for getting help, what information to provide, and critical guidelines on protecting sensitive credentials.

---

## Where to Ask Questions

To keep discussions organized and ensure issues remain actionable, please direct your questions to the appropriate channel:

### 1. GitHub Discussions (Recommended for Help & Ideas)

When the repository’s **Discussions** tab is enabled, use it for general help, design discussions, and open-ended exploration. If the tab is unavailable, check the existing documentation and issues for answers; enabling Discussions requires a maintainer. The Issues policy below still applies.

Discussions topics include:

- **🙏 Q&A**: If you need help with:
  - Setting up your local development environment (Node.js, Python, virtual environments).
  - Troubleshooting installation errors or dependency conflicts.
  - Understanding the matching algorithm, APIs, or architectural decisions.
- **💡 Ideas & RFCs**: If you want to:
  - Brainstorm new feature concepts before opening a formal issue.
  - Propose architectural improvements or UX enhancements.
- **🙌 Show and Tell**: Share successful pull requests or milestones you've accomplished.

### 2. GitHub Issues (Bugs & Approved Feature Tasks)

Use [**GitHub Issues**](https://github.com/Muskankr/OpenSourceMate/issues) **only** when you have an actionable, reproducible bug or an approved task:

- **Bug Reports**: Unexpected crashes, broken UI components, broken API endpoints, or failing tests with reproducible steps.
- **Feature Requests**: Well-scoped, concrete feature additions aligned with the [Roadmap](ROADMAP.md).
- _Please avoid opening GitHub issues solely for general troubleshooting questions; use GitHub Discussions when it is available._

---

## What Information to Include

When requesting support or filing a bug report, providing detailed context helps maintainers and community members resolve your problem quickly:

1. **Clear Problem Description**: What were you trying to do, what did you expect to happen, and what happened instead?
2. **Environment & System Details**:
   - Operating System (e.g., Windows 11, macOS Sequoia, Ubuntu 24.04).
   - Node.js & npm versions (`node -v`, `npm -v`).
   - Python version (`python --version`).
   - Browser & version (for frontend visual or interaction issues).
3. **Step-by-Step Reproduction**:
   - Numbered steps starting from a clean checkout or page load.
4. **Sanitized Logs & Error Output**:
   - Copy and paste the full traceback or console error log inside triple backtick markdown code blocks (```).
5. **Screenshots or Screen Recordings**:
   - For visual bugs or UI anomalies, attach a clear screenshot or brief screen recording.

---

## ⚠️ Important: Never Post Secrets or Sensitive Data

**Never share sensitive credentials or private information in public GitHub issues, discussions, pull requests, or commit messages.**

### Secrets Include:

- GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`)
- OpenAI API Keys (`sk-...`)
- Google Gemini / AI Provider Keys
- Production `SECRET_KEY` values
- Local environment files containing real credentials (`.env`, `.env.local`)
- Passwords, database connection strings, or personal private emails

### How to Sanitize Output:

Before pasting terminal outputs, logs, or `.env` examples, replace all sensitive values with `<REDACTED>` or placeholder text (e.g., `GITHUB_TOKEN=your_token_here`).

### What If You Accidentally Post a Secret?

1. **Revoke the credential immediately**: Assume any secret posted publicly is compromised. Regenerate the API key or token right away on GitHub, OpenAI, or your provider dashboard.
2. **Edit or delete the comment**: Remove the sensitive snippet from GitHub.
3. **Notify Maintainers**: If a credential was committed into Git history, notify a maintainer immediately so the commit can be scrubbed using tools like `git-filter-repo`.

---

## Security Vulnerabilities

If you discover a potential security vulnerability (such as an authorization bypass, injection flaw, or remote code execution risk), **do not report it publicly**.

Please follow our [**Security Policy**](SECURITY.md) to submit a private vulnerability report via GitHub Security Advisories or by contacting the project admin privately at [@Muskankr](https://github.com/Muskankr).

---

## Community Guidelines

All interactions in OpenSourceMate community spaces are governed by our [**Code of Conduct**](CODE_OF_CONDUCT.md). Please be respectful, considerate, and welcoming to all participants regardless of background or experience level.
