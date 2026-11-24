import {
  getSavedIssues,
  setSavedIssues,
  saveIssue,
  removeSavedIssue,
  toggleSaveIssue,
  updateSavedIssue,
  clearAllSavedIssues,
  isIssueSaved,
  exportSavedIssuesJson,
  importSavedIssuesJson,
  sanitizeSavedIssue,
  SAVED_ISSUES_STORAGE_KEY,
  MAX_SAVED_ISSUES,
  CURRENT_SCHEMA_VERSION,
  type SavedIssue,
} from "../utils/savedIssuesStorage";

describe("Saved Issues Storage Helper (Issue #419)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  const sampleIssue = {
    id: 101,
    title: "Add dark mode toggle for mobile devices",
    repository: "owner/repo",
    url: "https://github.com/owner/repo/issues/101",
    language: "TypeScript",
    labels: ["good first issue", "frontend"],
    comments: 3,
    match_score: 92,
  };

  describe("Basic save, get, remove, and update operations", () => {
    it("saves an issue and assigns default status and empty note", () => {
      const ok = saveIssue(sampleIssue);
      expect(ok).toBe(true);

      const saved = getSavedIssues();
      expect(saved.length).toBe(1);
      expect(saved[0].id).toBe(101);
      expect(saved[0].title).toBe("Add dark mode toggle for mobile devices");
      expect(saved[0].status).toBe("Interested");
      expect(saved[0].note).toBe("");
      expect(saved[0].savedAt).toBeDefined();
      expect(isIssueSaved(101)).toBe(true);
      expect(isIssueSaved(999)).toBe(false);
    });

    it("survives a page reload by reading accurately from localStorage", () => {
      saveIssue({
        ...sampleIssue,
        status: "Working on it",
        note: "Created local branch feat/dark-mode",
      });

      // Simulate a page reload by re-reading through getSavedIssues
      const reloadedIssues = getSavedIssues();
      expect(reloadedIssues.length).toBe(1);
      expect(reloadedIssues[0].id).toBe(101);
      expect(reloadedIssues[0].status).toBe("Working on it");
      expect(reloadedIssues[0].note).toBe("Created local branch feat/dark-mode");
    });

    it("updates existing issue note and status without duplicate entries", () => {
      saveIssue(sampleIssue);

      const updateResult = updateSavedIssue(101, {
        status: "Done",
        note: "Merged in PR #52",
      });
      expect(updateResult).toBe(true);

      const saved = getSavedIssues();
      expect(saved.length).toBe(1);
      expect(saved[0].status).toBe("Done");
      expect(saved[0].note).toBe("Merged in PR #52");
    });

    it("removes a saved issue by id", () => {
      saveIssue(sampleIssue);
      expect(isIssueSaved(101)).toBe(true);

      const removed = removeSavedIssue(101);
      expect(removed).toBe(true);
      expect(isIssueSaved(101)).toBe(false);
      expect(getSavedIssues()).toEqual([]);
    });

    it("toggles saving state cleanly", () => {
      // First toggle: save
      const res1 = toggleSaveIssue(sampleIssue);
      expect(res1.saved).toBe(true);
      expect(isIssueSaved(101)).toBe(true);

      // Second toggle: remove
      const res2 = toggleSaveIssue(sampleIssue);
      expect(res2.saved).toBe(false);
      expect(isIssueSaved(101)).toBe(false);
    });

    it("deletes all saved issues via clearAllSavedIssues", () => {
      saveIssue(sampleIssue);
      saveIssue({ ...sampleIssue, id: 102, title: "Second issue" });
      expect(getSavedIssues().length).toBe(2);

      clearAllSavedIssues();
      expect(getSavedIssues()).toEqual([]);
    });

    it("enforces MAX_SAVED_ISSUES limit", () => {
      const issues: SavedIssue[] = [];
      for (let i = 1; i <= MAX_SAVED_ISSUES; i++) {
        issues.push({
          id: i,
          title: `Issue ${i}`,
          repository: "test/repo",
          url: `https://github.com/test/repo/issues/${i}`,
          savedAt: new Date().toISOString(),
          note: "",
          status: "Interested",
        });
      }
      setSavedIssues(issues);
      expect(getSavedIssues().length).toBe(MAX_SAVED_ISSUES);

      // Trying to add one more when at capacity returns false
      const overflowAdded = saveIssue({
        id: 9999,
        title: "Overflow Issue",
        repository: "test/repo",
        url: "https://github.com/test/repo/issues/9999",
      });
      expect(overflowAdded).toBe(false);
      expect(isIssueSaved(9999)).toBe(false);
    });
  });

  describe("Resilience to corrupt or old storage data", () => {
    it("gracefully returns empty array on invalid JSON syntax without crashing", () => {
      localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, "{ invalid json; not matching");
      expect(() => getSavedIssues()).not.toThrow();
      expect(getSavedIssues()).toEqual([]);
    });

    it("gracefully handles null, primitive, or non-object storage value", () => {
      localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, "null");
      expect(getSavedIssues()).toEqual([]);

      localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, '"just a string"');
      expect(getSavedIssues()).toEqual([]);

      localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, "42");
      expect(getSavedIssues()).toEqual([]);
    });

    it("safely ignores storage envelope with unsupported higher schema version", () => {
      const futureEnvelope = {
        version: CURRENT_SCHEMA_VERSION + 99,
        items: [sampleIssue],
      };
      localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, JSON.stringify(futureEnvelope));
      expect(getSavedIssues()).toEqual([]);
    });

    it("filters out corrupted or missing fields in item list", () => {
      const mixedData = {
        version: 1,
        items: [
          sampleIssue,
          null,
          { id: "invalid", title: "Missing repo and url" },
          { id: 202, title: "Valid issue 2", repository: "repo2", url: "https://example.com/2" },
        ],
      };
      localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, JSON.stringify(mixedData));
      const result = getSavedIssues();
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(101);
      expect(result[1].id).toBe(202);
    });

    it("migrates legacy unversioned array format safely", () => {
      const legacyArray = [
        {
          id: 50,
          title: "Legacy bookmarked issue",
          repository: "legacy/repo",
          url: "https://github.com/legacy/repo/issues/50",
        },
      ];
      localStorage.setItem(SAVED_ISSUES_STORAGE_KEY, JSON.stringify(legacyArray));
      const result = getSavedIssues();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(50);
      expect(result[0].status).toBe("Interested");
      expect(result[0].note).toBe("");
    });
  });

  describe("JSON Export and Import Round-Trip", () => {
    it("exports and imports saved issues round-trip without losing notes, statuses, or metadata", () => {
      saveIssue({
        ...sampleIssue,
        status: "Working on it",
        note: "Need to write tests for mobile touch handling",
      });
      saveIssue({
        id: 202,
        title: "Fix memory leak in websocket event pool",
        repository: "backend/server",
        url: "https://github.com/backend/server/issues/202",
        language: "Go",
        labels: ["bug", "help wanted"],
        status: "Done",
        note: "Reviewed upstream PR and verified fix locally",
      });

      const jsonExport = exportSavedIssuesJson();
      expect(jsonExport).toContain("Add dark mode toggle for mobile devices");
      expect(jsonExport).toContain("Fix memory leak in websocket event pool");
      expect(jsonExport).toContain("Need to write tests for mobile touch handling");
      expect(jsonExport).toContain("Working on it");

      // Clear storage
      clearAllSavedIssues();
      expect(getSavedIssues()).toEqual([]);

      // Import exported JSON
      const importResult = importSavedIssuesJson(jsonExport);
      expect(importResult.success).toBe(true);
      expect(importResult.importedCount).toBe(2);

      // Verify complete data preservation
      const restored = getSavedIssues();
      expect(restored.length).toBe(2);

      const issue101 = restored.find((i) => i.id === 101);
      expect(issue101).toBeDefined();
      expect(issue101?.status).toBe("Working on it");
      expect(issue101?.note).toBe("Need to write tests for mobile touch handling");
      expect(issue101?.language).toBe("TypeScript");

      const issue202 = restored.find((i) => i.id === 202);
      expect(issue202).toBeDefined();
      expect(issue202?.status).toBe("Done");
      expect(issue202?.note).toBe("Reviewed upstream PR and verified fix locally");
      expect(issue202?.language).toBe("Go");
    });

    it("handles invalid or corrupted JSON during import gracefully", () => {
      const result = importSavedIssuesJson("broken { json");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.importedCount).toBe(0);
    });

    it("handles non-array or empty import content safely", () => {
      expect(importSavedIssuesJson("").success).toBe(false);
      expect(importSavedIssuesJson("{}").success).toBe(false);
      expect(importSavedIssuesJson(JSON.stringify({ notItems: [] })).success).toBe(false);
    });
  });

  describe("sanitizeSavedIssue helper", () => {
    it("normalizes invalid or missing status to 'Interested'", () => {
      const sanitized = sanitizeSavedIssue({
        id: 1,
        title: "Test",
        repository: "test/test",
        url: "https://example.com/1",
        status: "UnknownStatus",
      });
      expect(sanitized).not.toBeNull();
      expect(sanitized?.status).toBe("Interested");
    });

    it("returns null when required fields are missing", () => {
      expect(sanitizeSavedIssue(null)).toBeNull();
      expect(sanitizeSavedIssue({ id: 1, title: "" })).toBeNull();
      expect(sanitizeSavedIssue({ id: 1, title: "Title", repository: "" })).toBeNull();
      expect(sanitizeSavedIssue({ id: "not_a_number", title: "Title", repository: "r", url: "u" })).toBeNull();
    });
  });
});
