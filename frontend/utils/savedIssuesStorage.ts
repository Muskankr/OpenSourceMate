/**
 * Client-side storage helper for Saved Issues (Issue #419).
 *
 * Requirements:
 * - Versioned schema stored strictly in browser localStorage (no account or server storage).
 * - Enforces maximum item limit to protect localStorage quotas.
 * - Resilient error handling: corrupted or old/unrecognized storage data is ignored gracefully.
 * - Supports private notes and statuses: "Interested" | "Working on it" | "Done".
 * - Full JSON export and import round-trip capability without data loss.
 * - Dispatches 'osm_saved_issues_updated' and 'osm_bookmarks_updated' events for reactive UI.
 */

export type SavedIssueStatus = "Interested" | "Working on it" | "Done";

export const VALID_SAVED_STATUSES: readonly SavedIssueStatus[] = [
  "Interested",
  "Working on it",
  "Done",
] as const;

export interface SavedIssue {
  id: number;
  title: string;
  repository: string;
  url: string;
  state?: string;
  language?: string;
  labels?: string[];
  comments?: number;
  match_score?: number;
  difficulty?: string;
  savedAt: string;
  note: string;
  status: SavedIssueStatus;
}

export interface SavedIssuesStorageEnvelope {
  version: number;
  updatedAt: string;
  items: SavedIssue[];
}

export const SAVED_ISSUES_STORAGE_KEY = "opensourcemate_saved_issues";
export const CURRENT_SCHEMA_VERSION = 1;
export const MAX_SAVED_ISSUES = 100;

export const SAVED_ISSUES_UPDATED_EVENT = "osm_saved_issues_updated";

function notifyChange(): void {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event(SAVED_ISSUES_UPDATED_EVENT));
      // Also dispatch legacy bookmark event for backward compatibility
      window.dispatchEvent(new Event("osm_bookmarks_updated"));
    } catch {
      // Ignore event dispatch failure in non-standard test environments
    }
  }
}

/**
 * Validates and normalizes an unknown object into a valid SavedIssue, or returns null.
 */
export function sanitizeSavedIssue(item: unknown): SavedIssue | null {
  if (!item || typeof item !== "object") return null;

  const raw = item as Record<string, unknown>;

  const id = typeof raw.id === "number" ? raw.id : parseInt(String(raw.id), 10);
  if (!Number.isFinite(id)) return null;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const repository = typeof raw.repository === "string" ? raw.repository.trim() : "";
  const url = typeof raw.url === "string" ? raw.url.trim() : "";

  if (!title || !repository || !url) return null;

  const status: SavedIssueStatus =
    typeof raw.status === "string" &&
    (VALID_SAVED_STATUSES as readonly string[]).includes(raw.status)
      ? (raw.status as SavedIssueStatus)
      : "Interested";

  const note = typeof raw.note === "string" ? raw.note : "";

  let savedAt: string;
  if (typeof raw.savedAt === "string" && !Number.isNaN(Date.parse(raw.savedAt))) {
    savedAt = raw.savedAt;
  } else {
    savedAt = new Date().toISOString();
  }

  const issue: SavedIssue = {
    id,
    title,
    repository,
    url,
    savedAt,
    note,
    status,
  };

  if (typeof raw.state === "string") issue.state = raw.state;
  if (typeof raw.language === "string") issue.language = raw.language;
  if (Array.isArray(raw.labels)) {
    issue.labels = raw.labels.filter((l): l is string => typeof l === "string");
  }
  if (typeof raw.comments === "number" && Number.isFinite(raw.comments)) {
    issue.comments = raw.comments;
  }
  if (typeof raw.match_score === "number" && Number.isFinite(raw.match_score)) {
    issue.match_score = raw.match_score;
  }
  if (typeof raw.difficulty === "string") issue.difficulty = raw.difficulty;

  return issue;
}

/**
 * Reads and parses saved issues from localStorage with versioned schema checks.
 * Corrupt or old/invalid storage data is ignored gracefully without throwing errors or crashing.
 */
export function getSavedIssues(): SavedIssue[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(SAVED_ISSUES_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return [];
    }

    let candidateList: unknown[] = [];

    // Versioned envelope schema check
    if ("version" in parsed && typeof (parsed as { version: unknown }).version === "number") {
      const envelope = parsed as SavedIssuesStorageEnvelope;
      // Future schema versions that cannot be handled are safely ignored
      if (envelope.version > CURRENT_SCHEMA_VERSION) {
        return [];
      }
      if (Array.isArray(envelope.items)) {
        candidateList = envelope.items;
      }
    } else if (Array.isArray(parsed)) {
      // Backward-compatibility: legacy unversioned array format
      candidateList = parsed;
    } else {
      return [];
    }

    const validIssues: SavedIssue[] = [];
    for (const item of candidateList) {
      const sanitized = sanitizeSavedIssue(item);
      if (sanitized && !validIssues.some((existing) => existing.id === sanitized.id)) {
        validIssues.push(sanitized);
        if (validIssues.length >= MAX_SAVED_ISSUES) break;
      }
    }

    return validIssues;
  } catch {
    // Corrupted JSON or storage failure: return empty array without crashing
    return [];
  }
}

/**
 * Writes the saved issues list to localStorage using the versioned envelope.
 */
export function setSavedIssues(issues: SavedIssue[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    const sanitizedList: SavedIssue[] = [];
    for (const item of issues) {
      const sanitized = sanitizeSavedIssue(item);
      if (sanitized && !sanitizedList.some((existing) => existing.id === sanitized.id)) {
        sanitizedList.push(sanitized);
        if (sanitizedList.length >= MAX_SAVED_ISSUES) break;
      }
    }

    const envelope: SavedIssuesStorageEnvelope = {
      version: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      items: sanitizedList,
    };

    localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, JSON.stringify(envelope));
    notifyChange();
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks whether an issue id is currently saved.
 */
export function isIssueSaved(id: number): boolean {
  return getSavedIssues().some((issue) => issue.id === id);
}

/**
 * Saves a new issue or updates an existing one. Enforces MAX_SAVED_ISSUES limit.
 */
export function saveIssue(
  issue: Omit<SavedIssue, "savedAt" | "status" | "note"> & {
    savedAt?: string;
    status?: SavedIssueStatus;
    note?: string;
  }
): boolean {
  const current = getSavedIssues();
  const existingIndex = current.findIndex((item) => item.id === issue.id);

  if (existingIndex >= 0) {
    // Update existing item
    const existing = current[existingIndex];
    current[existingIndex] = {
      ...existing,
      ...issue,
      note: issue.note !== undefined ? issue.note : existing.note,
      status: issue.status || existing.status || "Interested",
      savedAt: issue.savedAt || existing.savedAt,
    };
    return setSavedIssues(current);
  }

  // Adding a new item: enforce limit
  if (current.length >= MAX_SAVED_ISSUES) {
    return false;
  }

  const newItem: SavedIssue = {
    ...issue,
    note: issue.note ?? "",
    status: issue.status || "Interested",
    savedAt: issue.savedAt || new Date().toISOString(),
  };

  return setSavedIssues([newItem, ...current]);
}

/**
 * Removes a saved issue by its id.
 */
export function removeSavedIssue(id: number): boolean {
  const current = getSavedIssues();
  const filtered = current.filter((item) => item.id !== id);
  if (filtered.length === current.length) return false;
  return setSavedIssues(filtered);
}

/**
 * Toggles the saved status of an issue.
 */
export function toggleSaveIssue(
  issue: Omit<SavedIssue, "savedAt" | "status" | "note"> & {
    status?: SavedIssueStatus;
    note?: string;
  }
): { saved: boolean; issue?: SavedIssue } {
  if (isIssueSaved(issue.id)) {
    removeSavedIssue(issue.id);
    return { saved: false };
  }
  const ok = saveIssue(issue);
  return {
    saved: ok,
    issue: ok ? getSavedIssues().find((i) => i.id === issue.id) : undefined,
  };
}

/**
 * Updates a saved issue's private note and/or status.
 */
export function updateSavedIssue(
  id: number,
  updates: { note?: string; status?: SavedIssueStatus }
): boolean {
  const current = getSavedIssues();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return false;

  const existing = current[index];
  current[index] = {
    ...existing,
    note: updates.note !== undefined ? updates.note : existing.note,
    status: updates.status !== undefined ? updates.status : existing.status,
  };

  return setSavedIssues(current);
}

/**
 * Clears all saved issues from browser storage.
 */
export function clearAllSavedIssues(): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: SavedIssuesStorageEnvelope = {
      version: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      items: [],
    };
    localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, JSON.stringify(envelope));
    notifyChange();
  } catch {
    // Ignore clear errors
  }
}

/**
 * Serializes the full saved issues list to JSON for export.
 */
export function exportSavedIssuesJson(): string {
  const issues = getSavedIssues();
  const exportPayload = {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    itemCount: issues.length,
    items: issues,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  totalCount: number;
  error?: string;
}

/**
 * Imports saved issues from a JSON string.
 * Round-trips cleanly without losing notes, statuses, or metadata.
 * Validates schema and avoids crashes on corrupted or malformed data.
 */
export function importSavedIssuesJson(jsonString: string): ImportResult {
  if (!jsonString || typeof jsonString !== "string") {
    return { success: false, importedCount: 0, totalCount: getSavedIssues().length, error: "Empty or invalid input." };
  }

  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, importedCount: 0, totalCount: getSavedIssues().length, error: "Invalid JSON format." };
    }

    let candidates: unknown[] = [];
    if ("items" in parsed && Array.isArray((parsed as { items: unknown }).items)) {
      candidates = (parsed as { items: unknown[] }).items;
    } else if (Array.isArray(parsed)) {
      candidates = parsed;
    } else {
      return { success: false, importedCount: 0, totalCount: getSavedIssues().length, error: "No issues array found in JSON." };
    }

    const current = getSavedIssues();
    const currentMap = new Map<number, SavedIssue>(current.map((i) => [i.id, i]));
    let importedCount = 0;

    for (const raw of candidates) {
      const sanitized = sanitizeSavedIssue(raw);
      if (!sanitized) continue;

      // Merge: imported issue updates existing or adds new
      if (currentMap.has(sanitized.id)) {
        const prev = currentMap.get(sanitized.id)!;
        currentMap.set(sanitized.id, {
          ...prev,
          ...sanitized,
          note: sanitized.note || prev.note,
          status: sanitized.status || prev.status,
          savedAt: sanitized.savedAt || prev.savedAt,
        });
        importedCount += 1;
      } else if (currentMap.size < MAX_SAVED_ISSUES) {
        currentMap.set(sanitized.id, sanitized);
        importedCount += 1;
      }
    }

    const mergedList = Array.from(currentMap.values());
    setSavedIssues(mergedList);

    return {
      success: true,
      importedCount,
      totalCount: mergedList.length,
    };
  } catch (err) {
    return {
      success: false,
      importedCount: 0,
      totalCount: getSavedIssues().length,
      error: err instanceof Error ? err.message : "Malformed JSON syntax.",
    };
  }
}
