import {
  getProgramsConfig,
  findProgram,
  issueMatchesProgram,
  filterIssuesByProgram,
  DEFAULT_PROGRAMS,
} from "../utils/programs";
import type { ContributorProgram, IssueRecommendation } from "../types/api";

describe("Contributor Programs Filtering (Acceptance Criteria)", () => {
  const sampleIssues: IssueRecommendation[] = [
    {
      id: 1,
      title: "Fix responsive navbar for Hacktoberfest contributors",
      repository: "octocat/hello-world",
      url: "https://github.com/octocat/hello-world/issues/1",
      state: "open",
      labels: ["good first issue", "hacktoberfest"],
      comments: 2,
      created_at: "2026-10-01T12:00:00Z",
      updated_at: "2026-10-05T15:00:00Z",
      language: "TypeScript",
      match_score: 95,
    },
    {
      id: 2,
      title: "Add Pydantic v2 support for NSoC students",
      repository: "tiangolo/fastapi",
      url: "https://github.com/tiangolo/fastapi/issues/2",
      state: "open",
      labels: ["help wanted", "nsoc2026"],
      comments: 5,
      created_at: "2026-10-02T12:00:00Z",
      updated_at: "2026-10-06T15:00:00Z",
      language: "Python",
      match_score: 88,
    },
    {
      id: 3,
      title: "Improve CLI diagnostics with repository topic nwoc",
      repository: "BurntSushi/ripgrep",
      url: "https://github.com/BurntSushi/ripgrep/issues/3",
      state: "open",
      labels: ["cli", "rust"],
      topics: ["nwoc2026"],
      comments: 1,
      created_at: "2026-10-03T12:00:00Z",
      updated_at: "2026-10-07T15:00:00Z",
      language: "Rust",
      match_score: 90,
    },
    {
      id: 4,
      title: "General refactor with no program tags",
      repository: "facebook/react",
      url: "https://github.com/facebook/react/issues/4",
      state: "open",
      labels: ["enhancement"],
      comments: 0,
      created_at: "2026-10-04T12:00:00Z",
      updated_at: "2026-10-08T15:00:00Z",
      language: "JavaScript",
      match_score: 82,
    },
  ];

  describe("Acceptance Criterion 1: Selecting a program returns only issues carrying its labels or topics", () => {
    it("returns only issues with Hacktoberfest labels or topics", () => {
      const results = filterIssuesByProgram(sampleIssues, "hacktoberfest");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
      expect(results[0].labels).toContain("hacktoberfest");
    });

    it("returns only issues with NSoC labels or topics (e.g. nsoc2026 or nwoc2026)", () => {
      const results = filterIssuesByProgram(sampleIssues, "nsoc");
      expect(results).toHaveLength(2);
      expect(results.map((i) => i.id)).toEqual([2, 3]);
    });

    it("correctly identifies label match case-insensitively", () => {
      const issueWithUppercaseLabel: IssueRecommendation = {
        ...sampleIssues[0],
        labels: ["HACKTOBERFEST-ACCEPTED"],
      };
      expect(issueMatchesProgram(issueWithUppercaseLabel, "hacktoberfest")).toBe(true);
    });

    it("correctly identifies repository topic match case-insensitively", () => {
      const issueWithTopic: IssueRecommendation = {
        ...sampleIssues[3],
        topics: ["HACKTOBERFEST"],
      };
      expect(issueMatchesProgram(issueWithTopic, "hacktoberfest")).toBe(true);
    });

    it("rejects issues carrying neither program label nor topic", () => {
      expect(issueMatchesProgram(sampleIssues[3], "hacktoberfest")).toBe(false);
      expect(issueMatchesProgram(sampleIssues[3], "nsoc")).toBe(false);
    });
  });

  describe("Acceptance Criterion 2: A new program can be added by editing the config file only", () => {
    it("allows dynamically adding a custom program and filtering by it without modifying code", () => {
      const customPrograms: ContributorProgram[] = [
        ...DEFAULT_PROGRAMS,
        {
          id: "kwoc",
          name: "Kharagpur Winter of Code",
          labels: ["kwoc", "kwoc2026"],
          topics: ["kwoc"],
          website: "https://kossiitkgp.org/kwoc",
        },
      ];

      const kwocIssue: IssueRecommendation = {
        id: 99,
        title: "KWoC beginner task",
        repository: "koss/project",
        url: "https://github.com/koss/project/issues/99",
        state: "open",
        labels: ["kwoc2026", "good first issue"],
        comments: 0,
        created_at: "2026-11-01T10:00:00Z",
        updated_at: "2026-11-02T10:00:00Z",
      };

      const testList = [...sampleIssues, kwocIssue];

      // Finding the newly configured program succeeds
      const found = findProgram("kwoc", customPrograms);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Kharagpur Winter of Code");

      // Filtering with the custom program list returns only the new program's issue
      const filtered = filterIssuesByProgram(testList, "kwoc", customPrograms);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(99);
      expect(filtered[0].labels).toContain("kwoc2026");
    });
  });

  describe("Acceptance Criterion 3: Leaving the selector empty keeps the current behaviour", () => {
    it("returns all issues unchanged when program is empty string", () => {
      const results = filterIssuesByProgram(sampleIssues, "");
      expect(results).toHaveLength(sampleIssues.length);
      expect(results).toEqual(sampleIssues);
    });

    it("returns all issues unchanged when program is null or undefined", () => {
      expect(filterIssuesByProgram(sampleIssues, null)).toEqual(sampleIssues);
      expect(filterIssuesByProgram(sampleIssues, undefined)).toEqual(sampleIssues);
    });

    it("returns all issues unchanged when program is 'all'", () => {
      expect(filterIssuesByProgram(sampleIssues, "all")).toEqual(sampleIssues);
      expect(filterIssuesByProgram(sampleIssues, "ALL")).toEqual(sampleIssues);
    });
  });

  describe("Default Configuration Integrity", () => {
    it("loads default programs with NSoC and Hacktoberfest", () => {
      const programs = getProgramsConfig();
      expect(programs.length).toBeGreaterThanOrEqual(2);

      const nsoc = findProgram("nsoc");
      expect(nsoc).toBeDefined();
      expect(nsoc?.labels).toContain("nsoc");
      expect(nsoc?.labels).toContain("nwoc");

      const hacktoberfest = findProgram("hacktoberfest");
      expect(hacktoberfest).toBeDefined();
      expect(hacktoberfest?.labels).toContain("hacktoberfest");
    });
  });
});
