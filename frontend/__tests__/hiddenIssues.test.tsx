import { act, renderHook } from "@testing-library/react";
import type { IssueRecommendation } from "../types/api";
import {
  hiddenIssueId,
  parseHiddenIssueIds,
  serializeHiddenIssues,
  useHiddenIssues,
  STORAGE_KEY,
  STORAGE_VERSION,
  MAX_HIDDEN_ISSUES,
} from "../hooks/useHiddenIssues";

const sampleIssue = {
  id: 42,
  repository: "octocat/hello-world",
  url: "https://github.com/octocat/hello-world/issues/42",
  title: "Fix timeout",
} as IssueRecommendation;

const sampleIssue2 = {
  id: 99,
  repository: "octocat/hello-world",
  url: "https://github.com/octocat/hello-world/issues/99",
  title: "Add logging",
} as IssueRecommendation;

beforeEach(() => {
  window.localStorage.clear();
});

describe("useHiddenIssues & Storage Helper (Issue #448)", () => {
  describe("Stable ID Generation", () => {
    it("uses a stable repository-qualified issue ID", () => {
      expect(hiddenIssueId(sampleIssue)).toBe("octocat/hello-world#42");
      expect(hiddenIssueId({ ...sampleIssue, repository: "other/repo" })).not.toBe(
        hiddenIssueId(sampleIssue)
      );
    });

    it("falls back to url#title if id is missing", () => {
      const noIdIssue = {
        url: "https://github.com/foo/bar/issues/1",
        title: "Bug",
      } as IssueRecommendation;
      expect(hiddenIssueId(noIdIssue)).toBe("https://github.com/foo/bar/issues/1#Bug");
    });
  });

  describe("Versioned Schema & Parsing", () => {
    it("parses valid versioned schema payload", () => {
      const payload = JSON.stringify({
        version: STORAGE_VERSION,
        ids: ["repo#1", "repo#2"],
        updatedAt: 123456789,
      });
      expect(parseHiddenIssueIds(payload)).toEqual(["repo#1", "repo#2"]);
    });

    it("serializes to versioned schema", () => {
      const raw = serializeHiddenIssues(["repo#1", "repo#2"]);
      const parsed = JSON.parse(raw);
      expect(parsed.version).toBe(STORAGE_VERSION);
      expect(parsed.ids).toEqual(["repo#1", "repo#2"]);
      expect(typeof parsed.updatedAt).toBe("number");
    });

    it("parses legacy plain array format for backward compatibility", () => {
      const legacyPayload = JSON.stringify(["repo#1", "repo#2", "repo#1"]);
      expect(parseHiddenIssueIds(legacyPayload)).toEqual(["repo#1", "repo#2"]);
    });

    it("deduplicates IDs and removes invalid/empty string entries", () => {
      const payload = JSON.stringify({
        version: 1,
        ids: ["a", "a", "", "   ", 123, null, undefined, "b"],
      });
      expect(parseHiddenIssueIds(payload)).toEqual(["a", "b"]);
    });

    it("caps the stored list at MAX_HIDDEN_ISSUES", () => {
      const manyIds = Array.from({ length: 300 }, (_, i) => `repo#${i}`);
      const payload = JSON.stringify({
        version: 1,
        ids: manyIds,
      });
      const parsed = parseHiddenIssueIds(payload);
      expect(parsed).toHaveLength(MAX_HIDDEN_ISSUES);
      expect(parsed[0]).toBe("repo#0");
      expect(parsed[MAX_HIDDEN_ISSUES - 1]).toBe(`repo#${MAX_HIDDEN_ISSUES - 1}`);

      const serialized = serializeHiddenIssues(manyIds);
      const serializedObj = JSON.parse(serialized);
      expect(serializedObj.ids).toHaveLength(MAX_HIDDEN_ISSUES);
    });
  });

  describe("Corrupt Storage Resiliency (Acceptance Criterion 3)", () => {
    it("safely handles null and empty string input", () => {
      expect(parseHiddenIssueIds(null)).toEqual([]);
      expect(parseHiddenIssueIds("")).toEqual([]);
    });

    it("ignores malformed JSON without throwing or crashing", () => {
      expect(parseHiddenIssueIds("not valid json {[]}")).toEqual([]);
      expect(parseHiddenIssueIds("{invalid: true}")).toEqual([]);
    });

    it("ignores unexpected JSON structures (numbers, booleans, invalid objects)", () => {
      expect(parseHiddenIssueIds("12345")).toEqual([]);
      expect(parseHiddenIssueIds("true")).toEqual([]);
      expect(parseHiddenIssueIds('"string"')).toEqual([]);
      expect(parseHiddenIssueIds('{"unexpected": "schema"}')).toEqual([]);
      expect(parseHiddenIssueIds('{"version": "not a number", "ids": "not array"}')).toEqual([]);
      expect(parseHiddenIssueIds('{"version": 1, "ids": null}')).toEqual([]);
    });
  });

  describe("Hook Functionality (Acceptance Criteria 1 & 2)", () => {
    it("hides issue and persists across hook reload (Acceptance Criterion 1)", () => {
      const { result, unmount } = renderHook(useHiddenIssues);

      expect(result.current.isHidden(sampleIssue)).toBe(false);
      act(() => {
        result.current.hideIssue(sampleIssue);
      });

      expect(result.current.isHidden(sampleIssue)).toBe(true);
      expect(result.current.hiddenIds).toContain("octocat/hello-world#42");
      expect(result.current.count).toBe(1);

      // Verify stored schema in localStorage
      const rawStored = window.localStorage.getItem(STORAGE_KEY);
      expect(rawStored).toBeTruthy();
      const storedObj = JSON.parse(rawStored!);
      expect(storedObj.version).toBe(STORAGE_VERSION);
      expect(storedObj.ids).toEqual(["octocat/hello-world#42"]);

      // Unmount and re-render (simulating page reload)
      unmount();
      const reloaded = renderHook(useHiddenIssues);
      expect(reloaded.result.current.isHidden(sampleIssue)).toBe(true);
      expect(reloaded.result.current.count).toBe(1);
    });

    it("restores hidden issue (Acceptance Criterion 2)", () => {
      const { result } = renderHook(useHiddenIssues);

      act(() => {
        result.current.hideIssue(sampleIssue);
        result.current.hideIssue(sampleIssue2);
      });
      expect(result.current.count).toBe(2);

      act(() => {
        result.current.restoreIssue(sampleIssue);
      });
      expect(result.current.isHidden(sampleIssue)).toBe(false);
      expect(result.current.isHidden(sampleIssue2)).toBe(true);
      expect(result.current.count).toBe(1);
    });

    it("clears all hidden issues via clearAll (Acceptance Criterion 2)", () => {
      const { result } = renderHook(useHiddenIssues);

      act(() => {
        result.current.hideIssue(sampleIssue);
        result.current.hideIssue(sampleIssue2);
      });
      expect(result.current.count).toBe(2);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.count).toBe(0);
      expect(result.current.isHidden(sampleIssue)).toBe(false);
      expect(result.current.isHidden(sampleIssue2)).toBe(false);
      expect(result.current.hiddenIds).toEqual([]);
    });

    it("does not affect other localStorage keys (e.g. bookmarks or saved issues)", () => {
      window.localStorage.setItem("opensourcemate_saved_issues", '[{"id":42}]');
      const { result } = renderHook(useHiddenIssues);

      act(() => {
        result.current.hideIssue(sampleIssue);
      });

      expect(window.localStorage.getItem("opensourcemate_saved_issues")).toBe('[{"id":42}]');
    });

    it("handles localStorage quota/security errors gracefully", () => {
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(useHiddenIssues);

      // Should not throw
      expect(() => {
        act(() => {
          result.current.hideIssue(sampleIssue);
        });
      }).not.toThrow();

      setItemSpy.mockRestore();
    });
  });
});
