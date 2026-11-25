import {
  applyRepoDiversityCap,
  DEFAULT_REPO_CAP,
  normalizeRepoName,
} from "../utils/repoDiversity";
import type { IssueRecommendation } from "../types/api";

function createMockIssue(
  id: number,
  repository: string,
  score: number = 80,
  title?: string
): IssueRecommendation {
  return {
    id,
    title: title || `Issue ${id} in ${repository}`,
    repository,
    url: `https://github.com/${repository}/issues/${id}`,
    state: "open",
    labels: ["good first issue"],
    comments: 2,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-20T00:00:00Z",
    match_score: score,
    score,
  };
}

describe("Repository Diversity Cap Utility (#446)", () => {
  it("uses a default repository cap of 3", () => {
    expect(DEFAULT_REPO_CAP).toBe(3);
  });

  it("normalizes repository names correctly", () => {
    expect(normalizeRepoName("Facebook/React")).toBe("facebook/react");
    expect(normalizeRepoName("  owner/repo  ")).toBe("owner/repo");
    expect(normalizeRepoName(undefined)).toBe("unknown");
  });

  it("caps issues from the same repository to the default cap (3)", () => {
    const issues = [
      createMockIssue(1, "octocat/hello-world", 95),
      createMockIssue(2, "octocat/hello-world", 90),
      createMockIssue(3, "octocat/hello-world", 85),
      createMockIssue(4, "octocat/hello-world", 80),
      createMockIssue(5, "octocat/hello-world", 75),
    ];

    const result = applyRepoDiversityCap(issues, 3);

    expect(result.visibleIssues).toHaveLength(3);
    expect(result.hiddenIssues).toHaveLength(2);
    expect(result.visibleIssues.map((i) => i.id)).toEqual([1, 2, 3]);
    expect(result.hiddenIssues.map((i) => i.id)).toEqual([4, 5]);

    const normalizedRepo = "octocat/hello-world";
    expect(result.hiddenByRepo[normalizedRepo]).toHaveLength(2);
    expect(result.hiddenByRepo[normalizedRepo].map((i) => i.id)).toEqual([4, 5]);
  });

  it("strictly preserves the relative ordering of kept items across mixed repositories", () => {
    // Interleaved list sorted by score descending
    const issues = [
      createMockIssue(1, "org/repo-a", 99), // 1st for A (kept)
      createMockIssue(2, "org/repo-a", 95), // 2nd for A (kept)
      createMockIssue(3, "org/repo-b", 92), // 1st for B (kept)
      createMockIssue(4, "org/repo-a", 90), // 3rd for A (kept)
      createMockIssue(5, "org/repo-b", 88), // 2nd for B (kept)
      createMockIssue(6, "org/repo-c", 85), // 1st for C (kept)
      createMockIssue(7, "org/repo-a", 82), // 4th for A (hidden)
      createMockIssue(8, "org/repo-b", 80), // 3rd for B (kept)
      createMockIssue(9, "org/repo-a", 78), // 5th for A (hidden)
      createMockIssue(10, "org/repo-c", 75), // 2nd for C (kept)
    ];

    const result = applyRepoDiversityCap(issues, 3);

    // No repo appears >3 times in visible list
    const counts: Record<string, number> = {};
    for (const issue of result.visibleIssues) {
      counts[issue.repository] = (counts[issue.repository] || 0) + 1;
      expect(counts[issue.repository]).toBeLessThanOrEqual(3);
    }

    // Relative order of kept items is strictly preserved
    expect(result.visibleIssues.map((i) => i.id)).toEqual([1, 2, 3, 4, 5, 6, 8, 10]);

    // Hidden items are correctly segregated
    expect(result.hiddenIssues.map((i) => i.id)).toEqual([7, 9]);
    expect(result.hiddenByRepo["org/repo-a"].map((i) => i.id)).toEqual([7, 9]);
  });

  it("lifts the cap for expanded repositories while maintaining relative ordering", () => {
    const issues = [
      createMockIssue(1, "org/repo-a", 99),
      createMockIssue(2, "org/repo-a", 95),
      createMockIssue(3, "org/repo-b", 92),
      createMockIssue(4, "org/repo-a", 90),
      createMockIssue(5, "org/repo-a", 82), // would be hidden if not expanded
      createMockIssue(6, "org/repo-b", 80),
    ];

    // Expand repo-a
    const result = applyRepoDiversityCap(issues, 3, new Set(["org/repo-a"]));

    // All 4 issues from repo-a should be visible in their original positions
    expect(result.visibleIssues).toHaveLength(6);
    expect(result.visibleIssues.map((i) => i.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.hiddenIssues).toHaveLength(0);
  });

  it("handles custom cap values and non-positive cap (no limit)", () => {
    const issues = [
      createMockIssue(1, "repo/a", 90),
      createMockIssue(2, "repo/a", 80),
      createMockIssue(3, "repo/b", 70),
    ];

    // Cap = 1
    const resCap1 = applyRepoDiversityCap(issues, 1);
    expect(resCap1.visibleIssues.map((i) => i.id)).toEqual([1, 3]);
    expect(resCap1.hiddenIssues.map((i) => i.id)).toEqual([2]);

    // Cap = 0 (no cap)
    const resNoCap = applyRepoDiversityCap(issues, 0);
    expect(resNoCap.visibleIssues).toHaveLength(3);
    expect(resNoCap.hiddenIssues).toHaveLength(0);
  });

  it("handles empty issues list cleanly", () => {
    const result = applyRepoDiversityCap([]);
    expect(result.visibleIssues).toEqual([]);
    expect(result.hiddenIssues).toEqual([]);
    expect(result.hiddenByRepo).toEqual({});
  });
});
