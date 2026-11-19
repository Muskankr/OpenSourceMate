#!/usr/bin/env python3
"""Generate and validate third-party dependency licence notices."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
NOTICE_PATH = ROOT / "THIRD_PARTY_NOTICES.md"

# These licences are permissive and compatible with distributing an MIT project
# when their attribution and notice requirements are retained. Unknown values
# deliberately fail validation instead of being treated as permissive.
ALLOWED_LICENSES = {
    "0BSD",
    "Apache-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "BSD License",
    "CC0-1.0",
    "CC-BY-4.0",
    "ISC",
    "LGPL-3.0-or-later",
    "MIT",
    "MIT-0",
    "MPL-2.0",
    "PSF-2.0",
    "Unlicense",
}

ALIASES = {
    "0bsd": "0BSD",
    "apache license 2.0": "Apache-2.0",
    "apache software license": "Apache-2.0",
    "apache software license 2.0": "Apache-2.0",
    "bsd 2-clause license": "BSD-2-Clause",
    "bsd 3-clause license": "BSD-3-Clause",
    "bsd license": "BSD License",
    "cc0 1.0 universal": "CC0-1.0",
    "isc license": "ISC",
    "mozilla public license 2.0": "MPL-2.0",
    "mozilla public license 2.0 (mpl 2.0)": "MPL-2.0",
    "mit license": "MIT",
    "mit-0": "MIT-0",
    "python software foundation license": "PSF-2.0",
    "python software foundation license 2.0": "PSF-2.0",
    "the unlicense": "Unlicense",
    "unlicense": "Unlicense",
}


def executable(name: str) -> str:
    """Use the Windows executable suffix when running locally on Windows."""

    if os.name != "nt":
        return name
    return f"{name}.cmd" if name in {"npm", "npx"} else f"{name}.exe"


def run_json(command: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> Any:
    result = subprocess.run(
        command,
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=env,
    )
    if result.returncode:
        raise RuntimeError(
            f"Command failed ({result.returncode}): {' '.join(command)}\n"
            f"{result.stderr.strip()}"
        )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Command did not return JSON: {' '.join(command)}\n"
            f"{result.stdout[:500]}"
        ) from exc


def frontend_packages() -> list[dict[str, str]]:
    with tempfile.TemporaryDirectory(prefix="license-checker-cache-") as cache:
        env = os.environ.copy()
        env["npm_config_cache"] = cache
        data = run_json(
            [
                executable("npx"),
                "--yes",
                "--package=license-checker@25.0.1",
                "license-checker",
                "--json",
                "--production",
                "--start",
                str(ROOT / "frontend"),
            ],
            cwd=ROOT / "frontend",
            env=env,
        )
    packages = []
    project_name = json.loads(
        (ROOT / "frontend" / "package.json").read_text(encoding="utf-8")
    )["name"]
    for package_key, metadata in data.items():
        name, separator, version = package_key.rpartition("@")
        if not separator:
            name, version = package_key, "unknown"
        if name == project_name:
            continue
        if name.startswith("@img/sharp-libvips-"):
            name = "@img/sharp-libvips-platform-variants"
        elif name.startswith("@img/sharp-"):
            name = "@img/sharp-platform-variants"
        raw_license = metadata.get("licenses")
        packages.append(
            {
                "name": name,
                "version": version,
                "license": license_value(raw_license),
                "url": metadata.get("repository", ""),
            }
        )
    return sorted(packages, key=lambda package: (package["name"].lower(), package["version"]))


def backend_packages() -> list[dict[str, str]]:
    data = run_json(
        [sys.executable, "-m", "piplicenses", "--format=json", "--with-urls"],
        cwd=ROOT / "backend",
    )
    packages = []
    for metadata in data:
        packages.append(
            {
                "name": metadata.get("Name", ""),
                "version": metadata.get("Version", "unknown"),
                "license": license_value(metadata.get("License")),
                "url": metadata.get("URL", ""),
            }
        )
    return sorted(packages, key=lambda package: (package["name"].lower(), package["version"]))


def license_value(raw_value: Any) -> str:
    if isinstance(raw_value, list):
        return " OR ".join(str(value).strip() for value in raw_value if value)
    if raw_value is None:
        return "Unknown"
    return str(raw_value).strip() or "Unknown"


def normalize_license(value: str) -> str | None:
    normalized = re.sub(r"\s+", " ", value.strip()).lower()
    return ALIASES.get(normalized) or (value.strip() if value.strip() in ALLOWED_LICENSES else None)


def license_is_compatible(value: str) -> bool:
    if not value or value.lower() in {"unknown", "none", "n/a"}:
        return False
    alternatives = re.split(r"\s+OR\s+|\s*;\s*", value, flags=re.IGNORECASE)
    for alternative in alternatives:
        required = re.split(r"\s+AND\s+|\s*&\s*", alternative, flags=re.IGNORECASE)
        if all(normalize_license(part) in ALLOWED_LICENSES for part in required):
            return True
    return False


def validate(packages: list[dict[str, str]], source: str) -> list[str]:
    failures = []
    for package in packages:
        if not license_is_compatible(package["license"]):
            failures.append(
                f"{source}: {package['name']}@{package['version']} "
                f"has unverified/incompatible licence {package['license']!r}"
            )
    return failures


def package_table(packages: list[dict[str, str]]) -> str:
    lines = [
        "| Package | Version | Licence identifier | Project URL |",
        "| --- | --- | --- | --- |",
    ]
    for package in packages:
        url = package["url"] or ""
        url_cell = f"[Project]({url})" if url.startswith(("http://", "https://")) else ""
        lines.append(
            f"| `{package['name']}` | `{package['version']}` | "
            f"`{package['license']}` | {url_cell} |"
        )
    return "\n".join(lines)


def render(frontend: list[dict[str, str]], backend: list[dict[str, str]]) -> str:
    return f"""# Third-Party Dependency Notices

This report is generated from the installed dependency environments. It covers
the frontend production dependency tree installed by `frontend/package-lock.json`
and the backend production dependencies installed by `backend/requirements.txt`.
Developer-only tools from `backend/requirements-dev.txt`, optional ML
dependencies in `backend/requirements-optional.txt`, and notebook dependencies
are not redistributed by the application and are outside this report.

The licence identifiers below are metadata summaries, not a replacement for
the full licence text or any package-specific attribution notice. Review the
upstream package licence when redistributing a dependency.

## Obligations requiring full-text review

Identifiers alone do not satisfy licence obligations. In particular, retain
the upstream attribution and licence text for `caniuse-lite` (CC-BY-4.0),
`certifi` (MPL-2.0), and the Sharp platform package (Apache-2.0 AND
LGPL-3.0-or-later). The generated table records package names, versions, and
project URLs, but it does not embed every upstream licence or NOTICE file.
Those texts must remain available from the installed packages or be included
in any redistributable artifact according to the package's terms.

Optional platform-specific Sharp packages are represented as stable
`@img/sharp-*-platform-variants` rows so the report does not change between
Windows, macOS, and Linux installations. The row preserves the shared version,
licence, and project attribution for those variants.

## Frontend dependencies

{package_table(frontend)}

## Backend dependencies

{package_table(backend)}

## Regenerating this report

From the repository root, create a clean environment for the production
backend dependencies, install the report tools, and run:

```bash
npm --prefix frontend ci
python -m venv .license-venv
npm exec --yes --package=license-checker@25.0.1 -- license-checker --version
# Windows PowerShell:
.license-venv\\Scripts\\python.exe -m pip install -r backend/requirements.txt pip-licenses==5.5.0
.license-venv\\Scripts\\python.exe scripts/third_party_licenses.py --write
.license-venv\\Scripts\\python.exe scripts/third_party_licenses.py --check
# macOS/Linux:
.license-venv/bin/python -m pip install -r backend/requirements.txt pip-licenses==5.5.0
.license-venv/bin/python scripts/third_party_licenses.py --write
.license-venv/bin/python scripts/third_party_licenses.py --check
```

`--check` regenerates the report in memory and fails if this file is stale or
if a dependency has missing, unknown, or unverified licence metadata. The
validator accepts common permissive or notice-bearing licences compatible with
distributing this MIT project: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause,
ISC, 0BSD, PSF-2.0, CC0-1.0, MIT-0, Unlicense, CC-BY-4.0, MPL-2.0, and
LGPL-3.0-or-later. The latter licences carry attribution, file-level, or
library-level obligations; this report does not replace review of their full
licence texts. Dual-licence expressions pass only when they provide a known
compatible option; unknown licence values are never silently accepted.
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="write the generated report")
    mode.add_argument("--check", action="store_true", help="validate report freshness")
    args = parser.parse_args()

    try:
        frontend = frontend_packages()
        backend = backend_packages()
        failures = validate(frontend, "frontend") + validate(backend, "backend")
        report = render(frontend, backend)
        if failures:
            print("Licence validation failed:", file=sys.stderr)
            print("\n".join(f"- {failure}" for failure in failures), file=sys.stderr)
            return 1
        if args.check:
            if not NOTICE_PATH.exists() or NOTICE_PATH.read_text(encoding="utf-8") != report:
                print(f"{NOTICE_PATH} is stale; run with --write", file=sys.stderr)
                return 1
        else:
            NOTICE_PATH.write_text(report, encoding="utf-8", newline="\n")
            print(f"Wrote {NOTICE_PATH}")
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
