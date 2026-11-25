# Hidden Issues & Not Interested Storage (Issue #448)

## Overview

When developers re-run profile analyses or browse recommendations, they often encounter issues they have already evaluated and decided not to work on. Re-displaying rejected issues creates noise and clutters the interface.

To solve this, OpenSourceMate allows users to mark recommendations as **"Not interested"**, persisting rejected issue IDs in the browser's `localStorage` across reloads without requiring server-side account storage.

---

## Architecture & Versioned Schema

Hidden issue IDs are persisted in browser `localStorage` under the key:
`opensourcemate_hidden_issue_ids`

### Versioned Storage Schema (`HiddenIssuesStorageSchema`)

```typescript
export interface HiddenIssuesStorageSchema {
  version: number;
  ids: string[];
  updatedAt?: number;
}
```

Example stored payload:
```json
{
  "version": 1,
  "ids": [
    "octocat/hello-world#42",
    "pallets/flask#102"
  ],
  "updatedAt": 1732580000000
}
```

### Key Guarantees

1. **Deterministic Unique Identification**:
   - Issues are identified by repository-qualified IDs (`${issue.repository}#${issue.id}`), preventing collisions between issues sharing numerical IDs across different projects.
2. **Cap on Stored Issues**:
   - The stored list is capped at `MAX_HIDDEN_ISSUES = 200` to prevent unbounded `localStorage` growth.
3. **Resilience to Corrupt Storage**:
   - `parseHiddenIssueIds` safely catches malformed JSON, invalid data structures, non-array fields, and null/undefined values, returning an empty list `[]` without crashing the application.
4. **Backward Compatibility**:
   - Automatically parses legacy plain JSON array representations (`["repo#1", ...]`) and migrates them to the versioned schema on next modification.

---

## User Controls & Workflow

1. **"Not interested" Action on Cards**:
   - Every issue card has a dedicated **"Not interested"** action.
   - Clicking it hides the issue immediately from the recommendation list.
2. **"Hidden (n)" Control**:
   - When issues are hidden, a dedicated control bar appears displaying `Hidden (n)`.
   - Clicking toggles review mode to view hidden issues.
3. **"Undo" (Restore)**:
   - Hidden cards display an **"Undo"** action to unhide that specific issue.
4. **"Clear all" Action**:
   - A one-click **"Clear all"** action restores all hidden issues at once and resets the storage.
