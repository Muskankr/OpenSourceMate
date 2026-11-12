# Tutorial: Add a Skill Mapping

This tutorial explains how to add a programming language to an existing technology group or introduce a new group in OpenSourceMate.

The repository uses a JSON configuration file for language grouping and noise filtering. This allows contributors to extend language mappings without changing the Python service logic.

## 1. Understand the relevant files

The following files are involved:

| File | Purpose |
|---|---|
| `backend/app/data/skill_mappings.json` | Defines language groups, group descriptions, and languages to ignore |
| `backend/app/services/skill_service.py` | Loads the configuration and resolves a language to its group |
| `backend/tests/test_skill_service.py` | Contains tests for skill analysis and language detection |
| `backend/tests/test_skill_grouping_and_noise.py` | Contains tests for grouping and noise filtering |

The main functions to understand in `skill_service.py` are:

- `load_skill_mappings()` — loads the JSON configuration.
- `get_group_mappings()` — converts the configured groups into a language-to-group mapping.
- `resolve_group_for_skill()` — returns the group associated with a skill.
- `analyze_skills()` — analyzes repository languages and frameworks and optionally consolidates related skills.

## 2. Open the skill mapping configuration

Navigate to the backend directory:

```bash
cd backend
```

Open:

```text
app/data/skill_mappings.json
```

The configuration contains three important sections:

- `ignore_languages`: languages or file types excluded when noise filtering is enabled.
- `groups`: technology groups and their member languages.
- `descriptions`: descriptions associated with each group.

An existing example is:

```json
"Systems & Embedded": [
  "Rust",
  "Zig"
]
```

## 3. Add a language to an existing group

Suppose you want to include Go in the existing `Systems & Embedded` group.

Find the group in `skill_mappings.json` and update it:

```json
"Systems & Embedded": [
  "Rust",
  "Zig",
  "Go"
]
```

Save the file.

The language name should match the name returned by the GitHub repository language data. The service normalizes names to lowercase when resolving groups, so matching is case-insensitive.

## 4. Add a new technology group

You can also introduce a completely new group.

For example, add a `Scientific Computing` group:

```json
"Scientific Computing": [
  "Julia",
  "Fortran"
]
```

Add a corresponding description inside the `descriptions` section:

```json
"Scientific Computing": "Languages used for scientific and numerical computing"
```

Make sure the JSON remains valid. In particular:

- Use double quotes around keys and string values.
- Separate entries with commas.
- Do not leave a trailing comma after the final item.

You do not need to modify `skill_service.py` for a language-group change because the service reads these groups from the JSON file.

## 5. Understand how the service resolves groups

The `get_group_mappings()` function reads the configured groups and creates a mapping from each member language to its group.

For example, the configuration:

```json
"Systems & Embedded": [
  "Rust",
  "Zig",
  "Go"
]
```

is converted conceptually into:

```python
{
    "rust": "Systems & Embedded",
    "zig": "Systems & Embedded",
    "go": "Systems & Embedded"
}
```

The `resolve_group_for_skill()` function uses this mapping:

```python
resolve_group_for_skill("Go")
```

It returns:

```text
Systems & Embedded
```

If a skill is not present in any configured group, the function returns `None`.

## 6. Add a test for the new mapping

Open:

```text
backend/tests/test_skill_grouping_and_noise.py
```

This file already imports `resolve_group_for_skill` and contains tests for language-to-group mappings.

It also defines an automatic fixture that clears the cached skill mapping configuration before each test. This ensures tests use the current JSON configuration.

For the new `Scientific Computing` group, add:

```python
def test_scientific_computing_group_mapping():
    assert resolve_group_for_skill("Julia") == "Scientific Computing"
    assert resolve_group_for_skill("Fortran") == "Scientific Computing"
```

If you added Go to the existing `Systems & Embedded` group instead, add:

```python
def test_go_resolves_to_systems_embedded_group():
    assert resolve_group_for_skill("Go") == "Systems & Embedded"
```

Use the test that corresponds to the mapping you actually changed.

The test verifies that the service reads the configuration and resolves the language to the expected group without requiring changes to the Python service.

## 7. Understand framework mappings

Language grouping and framework detection are separate mechanisms.

If you want to add a framework such as a new JavaScript or Python framework, inspect these dictionaries in:

```text
backend/app/services/skill_service.py
```

- `TOPIC_SKILLS` maps GitHub repository topics to skill names.
- `DEPENDENCY_SKILLS` maps dependency names to skill names.

For example:

```python
"react": "React"
```

A framework mapping may require changes to these Python dictionaries rather than `skill_mappings.json`.

Do not add framework entries to the JSON language groups unless the intention is to associate that skill with an existing technology group.

## 8. Run the tests

From the repository root, run:

```bash
cd backend
python -m pytest tests/test_skill_service.py -v
```

You can also run the grouping and noise-filtering tests:

```bash
python -m pytest tests/test_skill_grouping_and_noise.py -v
```

To run the complete backend test suite:

```bash
python -m pytest
```

If a test fails, check the JSON syntax, spelling of the language name, group name, and expected test result.

## 9. Common mistakes

**Invalid JSON syntax**

A missing comma or mismatched quotation mark prevents the configuration from loading correctly.

**Using an incorrect language name**

Use the canonical language name returned by GitHub repository language data.

**Editing Python when only a group change is needed**

For a language-group change, update the JSON configuration rather than duplicating group definitions in Python.

**Confusing language grouping with framework detection**

Framework detection uses `TOPIC_SKILLS` and `DEPENDENCY_SKILLS`. These are separate from the JSON language-group configuration.

**Forgetting tests**

A mapping change should have a test that verifies the expected language-to-group result.

## 10. Completion checklist

- [ ] Identified the relevant configuration and service files.
- [ ] Added the language to the appropriate group or created a new group.
- [ ] Added a description if a new group was created.
- [ ] Verified that the JSON syntax is valid.
- [ ] Added a test for the new mapping.
- [ ] Ran the relevant backend tests.
- [ ] Confirmed that unrelated application files were not modified.

The skill mapping change is complete when the configuration is valid and the tests confirm that the new language resolves to the expected group.