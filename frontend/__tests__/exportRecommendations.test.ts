import {
  escapeCsvCell,
  formatActiveFilters,
  generateRecommendationsCsv,
  generateRecommendationsMarkdown,
  generateRecommendationsJson,
  getRecommendationsExportFilename,
  getRecommendationsMimeType,
  exportRecommendationsData,
  type RecommendationExportOptions,
} from "../utils/exportRecommendations";
import type { IssueRecommendation } from "../types/api";

describe("exportRecommendations utils (Issue #450)", () => {
  const sampleIssues: IssueRecommendation[] = [
    {
      id: 101,
      title: "Add dark mode support",
      repository: "facebook/react",
      url: "https://github.com/facebook/react/issues/101",
      state: "open",
      labels: ["good first issue", "ui"],
      comments: 5,
      created_at: "2026-01-10T10:00:00Z",
      updated_at: "2026-01-15T12:00:00Z",
      language: "TypeScript",
      difficulty: "beginner",
      match_score: 95,
      match_reasons: ["Matches top skill TypeScript"],
    },
    {
      id: 202,
      title: "=SUM(A1:A10) Formula Injection Test",
      repository: "org/security-calc",
      url: "https://github.com/org/security-calc/issues/202",
      state: "open",
      labels: ["security"],
      comments: 2,
      created_at: "2026-02-01T08:00:00Z",
      updated_at: "2026-02-05T09:00:00Z",
      language: "Python",
      difficulty: "intermediate",
      match_score: 80,
    },
    {
      id: 303,
      title: "+CMD|' /C calc'!A0 payload",
      repository: "org/injection-plus",
      url: "https://github.com/org/injection-plus/issues/303",
      state: "open",
      labels: ["bug"],
      comments: 0,
      created_at: "2026-02-10T08:00:00Z",
      updated_at: "2026-02-10T08:00:00Z",
      language: "Go",
      difficulty: "advanced",
      score: 70,
    },
    {
      id: 404,
      title: "-10% discount issue",
      repository: "org/minus-prefix",
      url: "https://github.com/org/minus-prefix/issues/404",
      state: "open",
      labels: [],
      comments: 1,
      created_at: "2026-02-11T08:00:00Z",
      updated_at: "2026-02-11T08:00:00Z",
      language: "Rust",
    },
    {
      id: 505,
      title: "@mention notification error",
      repository: "org/at-prefix",
      url: "https://github.com/org/at-prefix/issues/505",
      state: "open",
      labels: [],
      comments: 3,
      created_at: "2026-02-12T08:00:00Z",
      updated_at: "2026-02-12T08:00:00Z",
    },
  ];

  const defaultOptions: RecommendationExportOptions = {
    username: "octocat",
    date: "2026-11-26",
    filters: {
      language: "TypeScript",
      difficulty: "beginner",
      minScore: 50,
      program: "gsoc",
      searchQuery: "dark mode",
    },
    issues: sampleIssues,
  };

  describe("escapeCsvCell - CSV Formula Injection prevention", () => {
    it("returns empty string for null and undefined", () => {
      expect(escapeCsvCell(null)).toBe("");
      expect(escapeCsvCell(undefined)).toBe("");
    });

    it("leaves safe text unchanged", () => {
      expect(escapeCsvCell("Normal Title")).toBe("Normal Title");
      expect(escapeCsvCell(123)).toBe("123");
    });

    it("escapes cells starting with '=' with a leading single quote", () => {
      const result = escapeCsvCell("=1+1");
      expect(result).toBe("'=1+1");
    });

    it("escapes cells starting with '+' with a leading single quote", () => {
      const result = escapeCsvCell("+2*3");
      expect(result).toBe("'+2*3");
    });

    it("escapes cells starting with '-' with a leading single quote", () => {
      const result = escapeCsvCell("-5");
      expect(result).toBe("'-5");
    });

    it("escapes cells starting with '@' with a leading single quote", () => {
      const result = escapeCsvCell("@SUM");
      expect(result).toBe("'@SUM");
    });

    it("handles leading whitespace before formula characters", () => {
      const result = escapeCsvCell("   =1+1");
      expect(result).toBe("'   =1+1");
    });

    it("applies standard RFC 4180 quotes when commas or quotes exist", () => {
      const commaText = escapeCsvCell("Hello, World");
      expect(commaText).toBe('"Hello, World"');

      const quoteText = escapeCsvCell('Said "Hello"');
      expect(quoteText).toBe('"Said ""Hello"""');

      const formulaWithComma = escapeCsvCell("=SUM(A1, B1)");
      expect(formulaWithComma).toBe('"\'=SUM(A1, B1)"');
    });
  });

  describe("formatActiveFilters", () => {
    it("returns 'None' when no filters are present", () => {
      expect(formatActiveFilters(undefined)).toBe("None");
      expect(formatActiveFilters({})).toBe("None");
      expect(
        formatActiveFilters({
          language: "all",
          difficulty: "all",
          label: "all",
          minScore: 0,
        })
      ).toBe("None");
    });

    it("formats active filters correctly", () => {
      const filters = {
        language: "Python",
        difficulty: "beginner",
        minScore: 70,
        program: "Hacktoberfest",
        searchQuery: "docs",
        learningMode: true,
        targetSkills: ["Rust", "Go"],
      };
      const formatted = formatActiveFilters(filters);
      expect(formatted).toContain("Language: Python");
      expect(formatted).toContain("Difficulty: beginner");
      expect(formatted).toContain("Min Score: 70");
      expect(formatted).toContain("Program: Hacktoberfest");
      expect(formatted).toContain('Search: "docs"');
      expect(formatted).toContain("Learning Mode: enabled (Rust, Go)");
    });
  });

  describe("generateRecommendationsCsv", () => {
    it("includes header metadata with date, username, and active filters", () => {
      const csv = generateRecommendationsCsv(defaultOptions);

      expect(csv).toContain("# OpenSourceMate Recommendations Export");
      expect(csv).toContain("# Date: 2026-11-26");
      expect(csv).toContain("# User: @octocat");
      expect(csv).toContain("# Active Filters: Language: TypeScript; Difficulty: beginner; Min Score: 50; Program: gsoc; Search: \"dark mode\"");
      expect(csv).toContain("# Total Issues: 5");
    });

    it("contains column header and properly escaped rows", () => {
      const csv = generateRecommendationsCsv(defaultOptions);

      expect(csv).toContain("Repository,Issue Number,Title,URL,Language,Difficulty,Score,Comments,Labels");
      expect(csv).toContain("facebook/react,101,Add dark mode support,https://github.com/facebook/react/issues/101,TypeScript,beginner,95,5");

      // Verify formula-escaped cells
      expect(csv).toContain("org/security-calc,202,'=SUM(A1:A10) Formula Injection Test");
      expect(csv).toContain("org/injection-plus,303,'+CMD|' /C calc'!A0 payload");
      expect(csv).toContain("org/minus-prefix,404,'-10% discount issue");
      expect(csv).toContain("org/at-prefix,505,'@mention notification error");
    });
  });

  describe("generateRecommendationsMarkdown", () => {
    it("generates markdown task list with links and header metadata", () => {
      const md = generateRecommendationsMarkdown(defaultOptions);

      expect(md).toContain("# OpenSourceMate Issue Recommendations");
      expect(md).toContain("- **Date**: 2026-11-26");
      expect(md).toContain("- **User**: @octocat");
      expect(md).toContain("- **Active Filters**: Language: TypeScript; Difficulty: beginner; Min Score: 50; Program: gsoc; Search: \"dark mode\"");
      expect(md).toContain("- **Total Recommendations**: 5");
      expect(md).toContain("## Recommendations Task List");

      // Check task list items
      expect(md).toContain(
        "- [ ] [facebook/react#101: Add dark mode support](https://github.com/facebook/react/issues/101) - `TypeScript` • [beginner] • Score: 95%"
      );
      expect(md).toContain(
        "- [ ] [org/security-calc#202: =SUM(A1:A10) Formula Injection Test](https://github.com/org/security-calc/issues/202)"
      );
    });

    it("handles empty issues gracefully in markdown", () => {
      const md = generateRecommendationsMarkdown({
        ...defaultOptions,
        issues: [],
      });
      expect(md).toContain("_No visible recommendations to export._");
    });
  });

  describe("generateRecommendationsJson", () => {
    it("generates structured JSON representation with metadata and issue objects", () => {
      const jsonStr = generateRecommendationsJson(defaultOptions);
      const data = JSON.parse(jsonStr);

      expect(data.app).toBe("OpenSourceMate");
      expect(data.exportedAt).toBe("2026-11-26");
      expect(data.username).toBe("octocat");
      expect(data.totalCount).toBe(5);
      expect(data.activeFilters.language).toBe("TypeScript");
      expect(data.recommendations).toHaveLength(5);
      expect(data.recommendations[0].id).toBe(101);
      expect(data.recommendations[0].repository).toBe("facebook/react");
      expect(data.recommendations[0].score).toBe(95);
      expect(data.recommendations[0].labels).toEqual(["good first issue", "ui"]);
    });
  });

  describe("filenames and mime types", () => {
    it("generates expected filenames", () => {
      expect(getRecommendationsExportFilename("OctoCat", "csv", "2026-11-26")).toBe(
        "opensourcemate-octocat-issues-2026-11-26.csv"
      );
      expect(getRecommendationsExportFilename("OctoCat", "markdown", "2026-11-26")).toBe(
        "opensourcemate-octocat-issues-2026-11-26.md"
      );
      expect(getRecommendationsExportFilename("OctoCat", "json", "2026-11-26")).toBe(
        "opensourcemate-octocat-issues-2026-11-26.json"
      );
    });

    it("generates expected mime types", () => {
      expect(getRecommendationsMimeType("csv")).toBe("text/csv;charset=utf-8");
      expect(getRecommendationsMimeType("markdown")).toBe("text/markdown;charset=utf-8");
      expect(getRecommendationsMimeType("json")).toBe("application/json;charset=utf-8");
    });
  });

  describe("exportRecommendationsData browser execution", () => {
    it("calls window.URL.createObjectURL and link.click without throwing", () => {
      const createObjectURLMock = jest.fn(() => "blob:http://localhost/mock");
      const revokeObjectURLMock = jest.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      exportRecommendationsData(defaultOptions, "csv");
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();

      exportRecommendationsData(defaultOptions, "markdown");
      expect(createObjectURLMock).toHaveBeenCalledTimes(2);

      exportRecommendationsData(defaultOptions, "json");
      expect(createObjectURLMock).toHaveBeenCalledTimes(3);

      clickSpy.mockRestore();
    });
  });
});
