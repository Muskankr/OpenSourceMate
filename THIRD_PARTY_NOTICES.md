# Third-Party Dependency Notices

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

| Package | Version | Licence identifier | Project URL |
| --- | --- | --- | --- |
| `@img/colour` | `1.1.0` | `MIT` | [Project](https://github.com/lovell/colour) |
| `@img/sharp-platform-variants` | `0.35.5` | `Apache-2.0 AND LGPL-3.0-or-later` | [Project](https://github.com/lovell/sharp) |
| `@next/env` | `16.4.6` | `MIT` | [Project](https://github.com/vercel/next.js) |
| `@next/swc-win32-x64-msvc` | `16.4.6` | `MIT` | [Project](https://github.com/vercel/next.js) |
| `@swc/helpers` | `0.5.23` | `Apache-2.0` | [Project](https://github.com/swc-project/swc) |
| `baseline-browser-mapping` | `2.11.21` | `Apache-2.0` | [Project](https://github.com/web-platform-dx/baseline-browser-mapping) |
| `caniuse-lite` | `1.0.30001810` | `CC-BY-4.0` | [Project](https://github.com/browserslist/caniuse-lite) |
| `client-only` | `0.0.1` | `MIT` |  |
| `detect-libc` | `2.1.2` | `Apache-2.0` | [Project](https://github.com/lovell/detect-libc) |
| `nanoid` | `3.3.18` | `MIT` | [Project](https://github.com/ai/nanoid) |
| `next` | `16.4.6` | `MIT` | [Project](https://github.com/vercel/next.js) |
| `picocolors` | `1.1.1` | `ISC` | [Project](https://github.com/alexeyraspopov/picocolors) |
| `postcss` | `8.5.23` | `MIT` | [Project](https://github.com/postcss/postcss) |
| `react` | `19.3.1` | `MIT` | [Project](https://github.com/react/react) |
| `react-dom` | `19.3.1` | `MIT` | [Project](https://github.com/react/react) |
| `scheduler` | `0.28.0` | `MIT` | [Project](https://github.com/react/react) |
| `semver` | `7.8.5` | `ISC` | [Project](https://github.com/npm/node-semver) |
| `sharp` | `0.35.5` | `Apache-2.0` | [Project](https://github.com/lovell/sharp) |
| `source-map-js` | `1.2.2` | `BSD-3-Clause` | [Project](https://github.com/7rulnik/source-map-js) |
| `styled-jsx` | `5.1.6` | `MIT` | [Project](https://github.com/vercel/styled-jsx) |
| `tslib` | `2.8.1` | `0BSD` | [Project](https://github.com/Microsoft/tslib) |

## Backend dependencies

| Package | Version | Licence identifier | Project URL |
| --- | --- | --- | --- |
| `annotated-doc` | `0.0.7` | `MIT` | [Project](https://github.com/fastapi/annotated-doc) |
| `annotated-types` | `0.8.0` | `MIT` | [Project](https://github.com/annotated-types/annotated-types) |
| `anyio` | `4.16.0` | `MIT` | [Project](https://anyio.readthedocs.io/en/stable/versionhistory.html) |
| `certifi` | `2026.10.23` | `Mozilla Public License 2.0 (MPL 2.0)` | [Project](https://github.com/certifi/python-certifi) |
| `click` | `8.5.1` | `BSD-3-Clause` | [Project](https://github.com/pallets/click/) |
| `colorama` | `0.4.6` | `BSD License` | [Project](https://github.com/tartley/colorama) |
| `fastapi` | `0.162.7` | `MIT` | [Project](https://github.com/fastapi/fastapi) |
| `h11` | `0.16.0` | `MIT License` | [Project](https://github.com/python-hyper/h11) |
| `httpcore` | `1.0.9` | `BSD-3-Clause` | [Project](https://www.encode.io/httpcore/) |
| `httpcore2` | `2.16.2` | `BSD-3-Clause` | [Project](https://github.com/pydantic/httpx2) |
| `httpx` | `0.28.1` | `BSD License` | [Project](https://github.com/encode/httpx) |
| `httpx2` | `2.16.2` | `BSD-3-Clause` | [Project](https://github.com/pydantic/httpx2) |
| `idna` | `3.20` | `BSD-3-Clause` | [Project](https://github.com/kjd/idna) |
| `iniconfig` | `2.3.1` | `MIT` | [Project](https://github.com/pytest-dev/iniconfig) |
| `jiter` | `0.19.0` | `MIT` | [Project](https://github.com/pydantic/jiter/) |
| `openai` | `3.46.0` | `Apache-2.0` | [Project](https://github.com/openai/openai-python) |
| `opentelemetry-api` | `1.45.2` | `Apache-2.0` | [Project](https://github.com/open-telemetry/opentelemetry-python/tree/main/opentelemetry-api) |
| `packaging` | `26.3` | `Apache-2.0 OR BSD-2-Clause` | [Project](https://github.com/pypa/packaging) |
| `pluggy` | `1.7.0` | `MIT License` | [Project](https://github.com/pytest-dev/pluggy) |
| `pydantic` | `2.14.2` | `MIT` | [Project](https://github.com/pydantic/pydantic) |
| `pydantic-settings` | `2.16.2` | `MIT` | [Project](https://github.com/pydantic/pydantic-settings) |
| `pydantic_core` | `2.50.2` | `MIT` | [Project](https://github.com/pydantic/pydantic) |
| `Pygments` | `2.21.0` | `BSD-2-Clause` | [Project](https://pygments.org) |
| `pytest` | `9.2.0` | `MIT` | [Project](https://docs.pytest.org/en/latest/) |
| `pytest-asyncio` | `1.5.0` | `Apache-2.0` | [Project](https://github.com/pytest-dev/pytest-asyncio) |
| `python-dotenv` | `1.2.4` | `BSD-3-Clause` | [Project](https://github.com/theskumar/python-dotenv) |
| `sniffio` | `1.3.1` | `Apache Software License; MIT License` | [Project](https://github.com/python-trio/sniffio) |
| `starlette` | `1.10.0` | `BSD-3-Clause` | [Project](https://github.com/Kludex/starlette) |
| `truststore` | `0.10.5` | `MIT` | [Project](https://github.com/sethmlarson/truststore) |
| `typing-inspection` | `0.4.5` | `MIT` | [Project](https://github.com/pydantic/typing-inspection) |
| `typing_extensions` | `4.16.0` | `PSF-2.0` | [Project](https://github.com/python/typing_extensions) |
| `uvicorn` | `0.54.0` | `BSD-3-Clause` | [Project](https://uvicorn.dev/) |

## Regenerating this report

From the repository root, create a clean environment for the production
backend dependencies, install the report tools, and run:

```bash
npm --prefix frontend ci
python -m venv .license-venv
npm exec --yes --package=license-checker@25.0.1 -- license-checker --version
# Windows PowerShell:
.license-venv\Scripts\python.exe -m pip install -r backend/requirements.txt pip-licenses==5.5.0
.license-venv\Scripts\python.exe scripts/third_party_licenses.py --write
.license-venv\Scripts\python.exe scripts/third_party_licenses.py --check
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
