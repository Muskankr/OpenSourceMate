# OpenSourceMate Command-Line Client (`osm`)

The **OpenSourceMate CLI (`osm`)** is a lightweight, zero-dependency Python command-line utility for interacting directly with the OpenSourceMate backend API from your terminal. It enables developers, mentors, and script runners to inspect technical skill profiles, output formatted tables or machine-readable JSON, and integrate with automated tooling.

---

## 1. Installation & Setup

The CLI is included in the OpenSourceMate repository under `backend/osm`.

### Option A: Direct Execution (No Installation Required)

You can run the CLI script directly using Python 3:

```bash
# From repository root
python scripts/osm.py analyze <username>
```

### Option B: Local Editable Installation

To install the `osm` command globally into your active virtual environment:

```bash
cd backend
pip install -e .
```

After installation, the `osm` binary is available directly on your `PATH`:

```bash
osm --help
```

---

## 2. Command Reference

### Root Command: `osm`

```bash
osm [options] <command>
```

#### Global Options:

- `-h`, `--help`: Display root help message with available commands.
- `-v`, `--version`: Display CLI version and exit.

---

### Subcommand: `osm analyze <username>`

Fetches and displays a GitHub user's analyzed technical skills profile.

```bash
osm analyze <username> [options]
```

#### Arguments & Options:

| Argument / Flag   | Description                                                                                     | Default                 |
| :---------------- | :---------------------------------------------------------------------------------------------- | :---------------------- |
| `<username>`      | **Required.** Target GitHub handle (e.g. `octocat`, `torvalds`).                                | _(none)_                |
| `--api-url <url>` | Base URL of OpenSourceMate backend API. Can also be set via `OSM_API_URL` environment variable. | `http://localhost:8000` |
| `--json`          | Output response as formatted JSON instead of a human-readable table.                            | `false`                 |
| `--refresh`       | Bypass the API cache to re-analyze fresh data from GitHub.                                      | `false`                 |
| `--timeout <sec>` | Network request timeout in seconds.                                                             | `15.0`                  |

---

## 3. Usage Examples

### Example 1: View Skill Profile as a Terminal Table

```bash
osm analyze octocat
```

**Output:**

```text
Skill Profile: @octocat
Analyzed Repositories: 12
Timestamp: 2026-11-22T12:00:00Z

--------------------------------------------------------------------------------
Skill         Repositories  Percentage  Proficiency
--------------------------------------------------------------------------------
Ruby                     8       55.2%  Strong (8.5/10)
JavaScript               4       28.1%  Comfortable (6.2/10)
Shell                    2       16.7%  Learning (3.0/10)
--------------------------------------------------------------------------------
```

---

### Example 2: Output as Machine-Readable JSON

Use `--json` to pipe into `jq` or process programmatically:

```bash
osm analyze octocat --json
```

**Output:**

```json
{
  "username": "octocat",
  "analyzed_at": "2026-11-22T12:00:00Z",
  "total_repositories_analyzed": 12,
  "skills": [
    {
      "name": "Ruby",
      "repository_count": 8,
      "percentage": 55.2,
      "type": "language",
      "proficiency": "Strong",
      "proficiency_score": 8.5
    },
    {
      "name": "JavaScript",
      "repository_count": 4,
      "percentage": 28.1,
      "type": "language",
      "proficiency": "Comfortable",
      "proficiency_score": 6.2
    }
  ]
}
```

Extract the top skill using `jq`:

```bash
osm analyze octocat --json | jq -r '.skills[0].name'
# Output: Ruby
```

---

### Example 3: Target a Remote or Staging API Instance

Specify a remote server or alternate port using `--api-url` or the `OSM_API_URL` environment variable:

```bash
# Using CLI flag
osm analyze octocat --api-url https://api.opensourcemate.org

# Using environment variable
export OSM_API_URL="https://api.opensourcemate.org"
osm analyze octocat
```

---

### Example 4: Force Cache Invalidation

To guarantee fresh data from the GitHub API:

```bash
osm analyze octocat --refresh
```

---

## 4. Exit Codes & Error Handling

The CLI returns predictable UNIX exit codes for seamless scripting and pipeline integration:

| Exit Code | Meaning               | Example Cause                                                     |
| :-------: | :-------------------- | :---------------------------------------------------------------- |
|    `0`    | **Success**           | Query completed successfully and output printed.                  |
|    `1`    | **Execution Failure** | User not found, invalid username syntax, API down, or rate limit. |
|    `2`    | **Syntax Error**      | Missing required positional argument or unknown flag.             |

### Error Message Examples:

- **Invalid Username:**

  ```text
  Error: Invalid GitHub username 'invalid@user!'. Usernames must be 1-39 characters, contain only alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.
  ```

- **User Not Found (404):**

  ```text
  Error: GitHub user 'nonexistent-user-xyz' was not found. (GitHub user not found)
  ```

- **Backend Offline / Connection Error:**
  ```text
  Connection Error: Could not connect to OpenSourceMate API at 'http://localhost:8000'.
  Troubleshooting:
    1. Verify that the backend server is running (e.g. 'uvicorn app.main:app --port 8000').
    2. If using a custom URL, pass '--api-url <url>' or set the OSM_API_URL environment variable.
  ```

---

## 5. Running Tests

The test suite validates CLI argument parsing, table/JSON formatting, exit codes, and mocked API responses:

```bash
python -m unittest backend/tests/test_osm_cli.py
```
