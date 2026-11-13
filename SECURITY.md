# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues, pull requests, or discussions.

Please submit vulnerability reports privately through GitHub:

1. Open the repository's **Security** tab.
2. Select **Report a vulnerability** under **Advisories**, if that option is available.
3. Include a description of the issue, its potential impact, steps to reproduce, and any relevant logs or proof of concept. Do not include real secrets or other people's private data.

If GitHub's private vulnerability reporting option is not available, contact the repository maintainer privately through their GitHub profile: [@Muskankr](https://github.com/Muskankr). Do not disclose the vulnerability publicly while seeking a private reporting channel.

The maintainers will review reports and may ask for additional details. Please allow time for investigation and a fix before making details public.

## Scope

This policy applies to security vulnerabilities in OpenSourceMate's code and services. Please report suspected issues even if you are unsure whether they are exploitable.

## Automated scanning

Pull requests and the `main` branch are scanned with `npm audit`, pip-audit, Bandit and CodeQL. See [docs/security-scanning.md](docs/security-scanning.md) for what runs, which findings block a merge and how to triage them.
