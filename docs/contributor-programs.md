# Contributor Programs Configuration & Issue Filtering

## Overview

Many open-source contributors participate in structured programs such as **NSoC / NWOC (NJACK Winter of Code)**, **Hacktoberfest**, **Google Summer of Code (GSoC)**, **Outreachy**, and **LFX Mentorship**. During these events, contributors specifically seek issues that carry eligible program labels or belong to repositories tagged with the corresponding topic.

OpenSourceMate provides a unified, data-driven **Contributor Program Selector** in the recommendations view that lets users filter recommended issues by program.

---

## Configuration Architecture (`data/programs.json`)

All programs are defined in a central JSON configuration file located at:
```
data/programs.json
```
(mirrored in `backend/app/data/programs.json` and `frontend/data/programs.json` for standalone builds).

### Program Object Schema

Each program entry in `data/programs.json` defines the following fields:

```json
{
  "id": "hacktoberfest",
  "name": "Hacktoberfest",
  "description": "DigitalOcean's annual global celebration of open-source software.",
  "labels": ["hacktoberfest", "hacktoberfest-accepted"],
  "topics": ["hacktoberfest"],
  "website": "https://hacktoberfest.com"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Unique URL-friendly slug (e.g. `hacktoberfest`, `nsoc`). Passed in API query `?program=<id>`. |
| `name` | `string` | Yes | Human-readable program title displayed in the frontend dropdown selector. |
| `description` | `string` | No | Short summary of the program. |
| `labels` | `string[]` | Yes | Issue labels that qualify an issue for this program (case-insensitive). |
| `topics` | `string[]` | Yes | Repository topics that qualify issues for this program (case-insensitive). |
| `website` | `string` | No | Official program homepage or participation guidelines. |

---

## How to Add a New Program (Config File Only)

You can add a new contributor program **by editing `data/programs.json` only**, without modifying any backend Python or frontend TypeScript code!

### Step 1: Open `data/programs.json`
Locate the `programs` array in `data/programs.json`.

### Step 2: Add your Program Definition
Append a new JSON object with the program's unique ID, display name, tracked GitHub labels, and repository topics:

```json
{
  "id": "kwoc",
  "name": "Kharagpur Winter of Code (KWoC)",
  "description": "Month-long open-source program organized by KOSS, IIT Kharagpur.",
  "labels": ["kwoc", "kwoc2026", "kwoc-accepted"],
  "topics": ["kwoc", "kwoc2026"],
  "website": "https://kossiitkgp.org/kwoc"
}
```

### Step 3: Verify Instantly
- **Backend API**: The backend automatically reloads the modified `programs.json` on the next request. Querying `GET /api/matching/programs` will immediately return the new program, and `GET /api/matching/users/{username}/issues?program=kwoc` will filter for its labels and topics.
- **Frontend UI**: The Program selector dynamically fetches programs from the backend (or bundled config) and populates the new option automatically.

---

## Matching & Filtering Rules

When a program is selected:
1. **Label Matching**: An issue is included if any of its labels (e.g. `hacktoberfest-accepted`, `nsoc2026`) match any label in the program's configured `labels` list (case-insensitive).
2. **Topic Matching**: An issue is included if its repository topics or issue topics match any topic in the program's configured `topics` list (case-insensitive).
3. **Empty Selector Behavior**: When the program selector is left empty, `"all"`, or not specified, the system preserves default recommendation behavior without filtering.

---

## Acceptance Criteria Verification

- [x] **Selecting a program returns only issues carrying its labels or topics**: Verified across unit tests in `frontend/__tests__/programs.test.ts` and `backend/tests/test_program_service.py`.
- [x] **A new program can be added by editing the config file only**: Both backend and frontend load programs dynamically from `programs.json` without hardcoding program names or IDs in code.
- [x] **Leaving the selector empty keeps the current behaviour**: Leaving the parameter null or empty returns full unfiltered recommendations.
