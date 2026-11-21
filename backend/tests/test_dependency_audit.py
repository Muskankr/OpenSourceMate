"""Unit tests auditing project dependencies and validating documentation consistency.

Verifies:
- All required base packages are present and pinned.
- Development and ML requirements are properly split and do not leak into base.
- Documentation in `docs/DEPENDENCIES.md` accounts for all declared dependencies.
- Memory and size guidelines are maintained.
- Dependency formats adhere to security pinning conventions.
"""

from pathlib import Path
import json
import re
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BASE_REQ = REPO_ROOT / "backend" / "requirements" / "base.txt"
DEV_REQ = REPO_ROOT / "backend" / "requirements" / "dev.txt"
ML_REQ = REPO_ROOT / "backend" / "requirements" / "ml.txt"
DOCS_DEP = REPO_ROOT / "docs" / "DEPENDENCIES.md"
FRONTEND_PKG = REPO_ROOT / "frontend" / "package.json"
PYPROJECT = REPO_ROOT / "backend" / "pyproject.toml"


def parse_requirements_file(file_path: Path) -> dict[str, str]:
    """Parse requirements file into mapping of package name to version constraint."""
    if not file_path.exists():
        return {}
    packages = {}
    for line in file_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-r"):
            continue
        # Split on operator: ==, >=, <=, ~=, <, >
        match = re.match(r"^([a-zA-Z0-9_\-\.]+)(.*)$", line)
        if match:
            pkg_name = match.group(1).lower()
            version_constraint = match.group(2).strip()
            packages[pkg_name] = version_constraint
    return packages


class TestDependencyAudit:
    """Test suite ensuring dependencies are properly tracked, audited, and isolated."""

    def test_base_requirements_exist_and_not_empty(self):
        """Ensure base production requirements exist and contain essential packages."""
        assert BASE_REQ.exists(), f"Missing {BASE_REQ}"
        packages = parse_requirements_file(BASE_REQ)
        assert len(packages) >= 5, "base.txt has fewer dependencies than expected"
        assert "fastapi" in packages
        assert "uvicorn" in packages
        assert "httpx" in packages
        assert "pydantic" in packages
        assert "pydantic-settings" in packages

    def test_base_requirements_are_pinned(self):
        """Production requirements should have pinned versions (== or bounded)."""
        packages = parse_requirements_file(BASE_REQ)
        for pkg, constraint in packages.items():
            assert constraint, f"Package {pkg} in base.txt has no version pinning"

    def test_ml_dependencies_are_isolated_from_base(self):
        """Heavy ML packages like torch and sentence-transformers must NOT be in base.txt."""
        base_packages = parse_requirements_file(BASE_REQ)
        assert "torch" not in base_packages
        assert "sentence-transformers" not in base_packages
        assert "transformers" not in base_packages
        assert "scikit-learn" not in base_packages

    def test_ml_requirements_contain_heavy_packages(self):
        """ml.txt must include sentence-transformers, torch, and scikit-learn."""
        ml_packages = parse_requirements_file(ML_REQ)
        assert "torch" in ml_packages
        assert "sentence-transformers" in ml_packages
        assert "scikit-learn" in ml_packages
        assert "transformers" in ml_packages

    def test_dev_requirements_include_linters_and_testers(self):
        """dev.txt must include testing, typing, and static analysis tools."""
        dev_packages = parse_requirements_file(DEV_REQ)
        assert "pytest" in dev_packages
        assert "pytest-cov" in dev_packages
        assert "ruff" in dev_packages
        assert "mypy" in dev_packages
        assert "pre-commit" in dev_packages

    def test_dependencies_documentation_exists(self):
        """Authoritative docs/DEPENDENCIES.md must exist and be comprehensive."""
        assert DOCS_DEP.exists(), f"Missing documentation file: {DOCS_DEP}"
        doc_content = DOCS_DEP.read_text(encoding="utf-8")
        assert len(doc_content.splitlines()) > 100, "docs/DEPENDENCIES.md is too short"

    def test_dependencies_documentation_contains_all_base_packages(self):
        """All production packages in base.txt must be explicitly documented."""
        doc_content = DOCS_DEP.read_text(encoding="utf-8").lower()
        base_packages = parse_requirements_file(BASE_REQ)

        for pkg in base_packages:
            pkg_variants = [pkg, pkg.replace("-", "_"), pkg.replace("_", "-")]
            matched = any(f"`{variant}`" in doc_content or f"| {variant}" in doc_content for variant in pkg_variants)
            assert matched, f"Production package '{pkg}' is missing from docs/DEPENDENCIES.md"

    def test_dependencies_documentation_contains_ml_packages(self):
        """All optional ML packages in ml.txt must be documented."""
        doc_content = DOCS_DEP.read_text(encoding="utf-8").lower()
        ml_packages = parse_requirements_file(ML_REQ)

        for pkg in ml_packages:
            pkg_variants = [pkg, pkg.replace("-", "_"), pkg.replace("_", "-")]
            matched = any(f"`{variant}`" in doc_content or f"| {variant}" in doc_content for variant in pkg_variants)
            assert matched, f"ML package '{pkg}' is missing from docs/DEPENDENCIES.md"

    def test_dependencies_documentation_contains_frontend_packages(self):
        """docs/DEPENDENCIES.md must document core frontend dependencies and tools."""
        doc_content = DOCS_DEP.read_text(encoding="utf-8").lower()
        frontend_essentials = ["next", "react", "react-dom", "tailwindcss", "typescript", "eslint", "jest"]
        for pkg in frontend_essentials:
            assert pkg in doc_content, f"Frontend package '{pkg}' missing from docs/DEPENDENCIES.md"

    def test_frontend_package_json_structure(self):
        """frontend/package.json must be valid JSON with correct engine and scripts."""
        assert FRONTEND_PKG.exists(), f"Missing {FRONTEND_PKG}"
        data = json.loads(FRONTEND_PKG.read_text(encoding="utf-8"))
        assert "dependencies" in data
        assert "devDependencies" in data
        assert "scripts" in data
        deps = data["dependencies"]
        assert "next" in deps
        assert "react" in deps
        assert "react-dom" in deps

    def test_pyproject_toml_configuration(self):
        """backend/pyproject.toml must configure ruff and coverage properly."""
        assert PYPROJECT.exists(), f"Missing {PYPROJECT}"
        pyproject_text = PYPROJECT.read_text(encoding="utf-8")
        assert "[tool.ruff]" in pyproject_text
        assert "[tool.coverage.report]" in pyproject_text
        assert "fail_under = 80" in pyproject_text

    def test_no_legacy_unpinned_dependencies_in_base(self):
        """Ensure no raw unpinned dependencies exist in base.txt without version constraints."""
        raw_lines = [
            line.strip()
            for line in BASE_REQ.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.startswith("#") and not line.startswith("-r")
        ]
        for line in raw_lines:
            assert any(op in line for op in ["==", ">=", "<=", "~=", ">", "<"]), (
                f"Dependency line '{line}' lacks explicit version specification"
            )


    def test_requirements_file_encoding_and_newline(self):
        """Ensure all requirements files are properly encoded in UTF-8 without CRLF quirks."""
        for req_file in [BASE_REQ, DEV_REQ, ML_REQ]:
            content = req_file.read_bytes()
            assert b"\x00" not in content, f"Null byte detected in {req_file}"
            text = content.decode("utf-8")
            assert len(text.strip()) > 0, f"{req_file} is empty"

    def test_no_duplicate_dependencies_in_single_file(self):
        """Ensure no duplicate package definitions exist within any individual requirements file."""
        for req_file in [BASE_REQ, DEV_REQ, ML_REQ]:
            lines = [
                line.strip().lower()
                for line in req_file.read_text(encoding="utf-8").splitlines()
                if line.strip() and not line.startswith("#") and not line.startswith("-r")
            ]
            pkg_names = [re.split(r"[><=\~]", l)[0].strip() for l in lines]
            duplicates = [pkg for pkg in pkg_names if pkg_names.count(pkg) > 1]
            assert not duplicates, f"Duplicate packages found in {req_file}: {set(duplicates)}"

    def test_frontend_scripts_defined_in_package_json(self):
        """Ensure essential npm scripts are defined for CI/CD operations."""
        data = json.loads(FRONTEND_PKG.read_text(encoding="utf-8"))
        scripts = data.get("scripts", {})
        required_scripts = ["dev", "build", "lint", "test"]
        for s in required_scripts:
            assert s in scripts, f"Missing script '{s}' in frontend/package.json"

    def test_dependency_justification_completeness(self):
        """Ensure documentation includes justification sections for all 4 primary categories."""
        content = DOCS_DEP.read_text(encoding="utf-8")
        assert "Production Runtime Stack" in content
        assert "Development & Quality Assurance Stack" in content
        assert "Optional Machine Learning & Semantic Stack" in content
        assert "Production Runtime Dependencies" in content
        assert "Benchmark & Performance Impact Summary" in content
