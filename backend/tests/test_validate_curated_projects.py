import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.validate_curated_projects import (
    DEFAULT_DATA_PATH,
    DEFAULT_SCHEMA_PATH,
    validate_curated_projects,
)


class TestValidateCuratedProjects(unittest.TestCase):
    def test_curated_projects_json_passes_validation(self):
        """Verify that the official data/curated-projects.json passes all validations."""
        errors, stats = validate_curated_projects(DEFAULT_DATA_PATH, DEFAULT_SCHEMA_PATH)
        self.assertFalse(errors, f"Validation errors found: {errors}")
        self.assertGreaterEqual(stats["total_projects"], 15)
        self.assertIn("GSoC", stats["programs"])
        self.assertIn("Outreachy", stats["programs"])
        self.assertIn("Hacktoberfest", stats["programs"])

    def test_missing_data_file(self):
        """Verify error reporting when file does not exist."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            fake_path = Path(tmp_dir) / "nonexistent.json"
            errors, stats = validate_curated_projects(fake_path, DEFAULT_SCHEMA_PATH)
            self.assertTrue(any("Data file not found" in e for e in errors))
            self.assertEqual(stats["total_projects"], 0)

    def test_invalid_json_file(self):
        """Verify error reporting for corrupted JSON syntax."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            bad_file = Path(tmp_dir) / "bad.json"
            bad_file.write_text("{ broken json: true", encoding="utf-8")
            errors, stats = validate_curated_projects(bad_file, DEFAULT_SCHEMA_PATH)
            self.assertTrue(any("Invalid JSON syntax" in e for e in errors))

    def test_invalid_repo_format(self):
        """Verify detection of malformed repository slugs."""
        with DEFAULT_DATA_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)

        data_copy = copy.deepcopy(data)
        data_copy["projects"][0]["repo"] = "invalid_repo_slug_without_slash"

        with tempfile.TemporaryDirectory() as tmp_dir:
            test_file = Path(tmp_dir) / "test.json"
            test_file.write_text(json.dumps(data_copy), encoding="utf-8")

            errors, _ = validate_curated_projects(test_file, DEFAULT_SCHEMA_PATH)
            self.assertTrue(any("must match 'owner/repository' format" in e for e in errors))

    def test_duplicate_repo_detection(self):
        """Verify error reporting on duplicate project repositories."""
        with DEFAULT_DATA_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)

        data_copy = copy.deepcopy(data)
        data_copy["projects"].append(copy.deepcopy(data_copy["projects"][0]))

        with tempfile.TemporaryDirectory() as tmp_dir:
            test_file = Path(tmp_dir) / "test.json"
            test_file.write_text(json.dumps(data_copy), encoding="utf-8")

            errors, _ = validate_curated_projects(test_file, DEFAULT_SCHEMA_PATH)
            self.assertTrue(any("duplicate repository" in e for e in errors))

    def test_invalid_program_tag_name(self):
        """Verify rejection of unrecognized program tag names."""
        with DEFAULT_DATA_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)

        data_copy = copy.deepcopy(data)
        data_copy["projects"][0]["programs"].append(
            {"name": "UnknownFakeProgram", "source": "https://example.com/proof"}
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            test_file = Path(tmp_dir) / "test.json"
            test_file.write_text(json.dumps(data_copy), encoding="utf-8")

            errors, _ = validate_curated_projects(test_file, DEFAULT_SCHEMA_PATH)
            self.assertTrue(any("program name must be one of" in e for e in errors))

    def test_invalid_program_source_url(self):
        """Verify acceptance criterion: every tag must have a verifiable source URL."""
        with DEFAULT_DATA_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)

        data_copy = copy.deepcopy(data)
        data_copy["projects"][0]["programs"][0]["source"] = "not-a-valid-url"

        with tempfile.TemporaryDirectory() as tmp_dir:
            test_file = Path(tmp_dir) / "test.json"
            test_file.write_text(json.dumps(data_copy), encoding="utf-8")

            errors, _ = validate_curated_projects(test_file, DEFAULT_SCHEMA_PATH)
            self.assertTrue(any("must be a verifiable HTTP/HTTPS link" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
