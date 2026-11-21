import {
  escapeMarkdownTableCell,
  getIssueScore,
  formatIssuesAsCsv,
  formatIssuesAsMarkdown,
  getExportIssuesFilename,
  getExportIssuesMimeType,
  exportRecommendedIssues,
} from "../utils/exportIssues";
import type { IssueRecommendation } from "../types/api";

describe("exportIssues formatters and utils", () => {
  const sampleIssues: IssueRecommendation[] = [
    {
      id: 101,
      title: "Add dark mode toggle support",
      repository: "vercel/next.js",
      url: "https://github.com/vercel/next.js/issues/101",
      state: "open",
      labels: ["good first issue", "enhancement"],
      comments: 5,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-02T00:00:00Z",
      language: "TypeScript",
      match_score: 94.6,
    },
    {
      id: 102,
      title: 'Fix "Connection Reset" in HTTP client',
      repository: "tiangolo/fastapi",
      url: "https://github.com/tiangolo/fastapi/issues/102",
      state: "open",
      labels: ["bug", "help wanted"],
      comments: 2,
      created_at: "2026-10-03T00:00:00Z",
      updated_at: "2026-10-04T00:00:00Z",
      language: "Python",
      score: 82.2,
    },
    {
      id: 103,
      title: "Optimize regex parser | pipeline",
      repository: "BurntSushi/ripgrep",
      url: "https://github.com/BurntSushi/ripgrep/issues/103",
      state: "open",
      labels: [],
      comments: 0,
      created_at: "2026-10-05T00:00:00Z",
      updated_at: "2026-10-06T00:00:00Z",
      language: "Rust",
    },
  ];

  describe("escapeMarkdownTableCell", () => {
    it("handles null and undefined safely", () => {
      expect(escapeMarkdownTableCell(null)).toBe("");
      expect(escapeMarkdownTableCell(undefined)).toBe("");
    });

    it("escapes vertical bar / pipe characters to prevent breaking table structure", () => {
      expect(escapeMarkdownTableCell("A | B | C")).toBe("A \\| B \\| C");
    });

    it("replaces line breaks with single space", () => {
      expect(escapeMarkdownTableCell("First line\nSecond line\r\nThird")).toBe(
        "First line Second line Third"
      );
    });
  });

  describe("getIssueScore", () => {
    it("prefers match_score and rounds to integer", () => {
      expect(getIssueScore(sampleIssues[0])).toBe(95);
    });

    it("falls back to score property when match_score is missing", () => {
      expect(getIssueScore(sampleIssues[1])).toBe(82);
    });

    it("defaults to 0 when neither match_score nor score is present", () => {
      expect(getIssueScore(sampleIssues[2])).toBe(0);
    });
  });

  describe("formatIssuesAsCsv", () => {
    it("generates valid RFC 4180 CSV with required header", () => {
      const csv = formatIssuesAsCsv(sampleIssues);
      const lines = csv.split("\r\n");

      expect(lines[0]).toBe("Title,Repository,Link,Labels,Match Score");
      expect(lines).toHaveLength(4); // Header + 3 issues
    });

    it("includes title, repository, link, labels, and match score for each issue", () => {
      const csv = formatIssuesAsCsv(sampleIssues);

      // First issue: labels contain comma, so RFC 4180 quotes them
      expect(csv).toContain(
        'Add dark mode toggle support,vercel/next.js,https://github.com/vercel/next.js/issues/101,"good first issue, enhancement",95%'
      );

      // Second issue: title has quotes which should be escaped
      expect(csv).toContain(
        '"Fix ""Connection Reset"" in HTTP client",tiangolo/fastapi,https://github.com/tiangolo/fastapi/issues/102,"bug, help wanted",82%'
      );

      // Third issue: no labels
      expect(csv).toContain(
        "Optimize regex parser | pipeline,BurntSushi/ripgrep,https://github.com/BurntSushi/ripgrep/issues/103,,0%"
      );
    });

    it("returns only header when issues list is empty", () => {
      const csv = formatIssuesAsCsv([]);
      expect(csv).toBe("Title,Repository,Link,Labels,Match Score");
    });
  });

  describe("formatIssuesAsMarkdown", () => {
    it("generates markdown table including title, repository, labels, match score, and link", () => {
      const md = formatIssuesAsMarkdown(sampleIssues, {
        username: "octocat",
        date: "2026-11-20",
      });

      expect(md).toContain("# Recommended Open-Source Issues");
      expect(md).toContain("**User**: @octocat");
      expect(md).toContain("**Export Date**: 2026-11-20");
      expect(md).toContain("**Total Issues**: 3");
      expect(md).toContain("| Title | Repository | Labels | Match Score | Link |");

      // Verify issue 1
      expect(md).toContain(
        "| Add dark mode toggle support | vercel/next.js | good first issue, enhancement | 95% | [View Issue](https://github.com/vercel/next.js/issues/101) |"
      );

      // Verify issue 3 with pipe escaped
      expect(md).toContain(
        "| Optimize regex parser \\| pipeline | BurntSushi/ripgrep | - | 0% | [View Issue](https://github.com/BurntSushi/ripgrep/issues/103) |"
      );
    });

    it("renders fallback row when issues list is empty", () => {
      const md = formatIssuesAsMarkdown([], { date: "2026-11-20" });

      expect(md).toContain("| No recommended issues found | - | - | - | - |");
      expect(md).toContain("**Total Issues**: 0");
    });

    it("omits user header when username option is not provided", () => {
      const md = formatIssuesAsMarkdown(sampleIssues);
      expect(md).not.toContain("**User**:");
    });
  });

  describe("getExportIssuesFilename", () => {
    it("generates filename with sanitized username and date", () => {
      expect(getExportIssuesFilename("csv", "octocat", "2026-11-20")).toBe(
        "opensourcemate-recommended-issues-octocat-2026-11-20.csv"
      );

      expect(getExportIssuesFilename("markdown", "octocat", "2026-11-20")).toBe(
        "opensourcemate-recommended-issues-octocat-2026-11-20.md"
      );
    });

    it("generates generic filename when username is omitted", () => {
      expect(getExportIssuesFilename("csv", undefined, "2026-11-20")).toBe(
        "opensourcemate-recommended-issues-2026-11-20.csv"
      );
    });

    it("sanitizes special characters in username", () => {
      expect(getExportIssuesFilename("markdown", "Super/User*Name!", "2026-11-20")).toBe(
        "opensourcemate-recommended-issues-superusername-2026-11-20.md"
      );
    });
  });

  describe("getExportIssuesMimeType", () => {
    it("returns correct MIME types for csv and markdown", () => {
      expect(getExportIssuesMimeType("csv")).toBe("text/csv;charset=utf-8");
      expect(getExportIssuesMimeType("markdown")).toBe("text/markdown;charset=utf-8");
    });
  });

  describe("exportRecommendedIssues download orchestration", () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = jest.fn(() => "mock-blob-url");
      URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      jest.restoreAllMocks();
    });

    it("formats and triggers CSV download with link click and cleanup", () => {
      const appendChildSpy = jest.spyOn(document.body, "appendChild");
      const removeChildSpy = jest.spyOn(document.body, "removeChild");

      exportRecommendedIssues(sampleIssues, "csv", {
        username: "testuser",
        date: "2026-11-20",
      });

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-blob-url");

      const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(link.download).toBe("opensourcemate-recommended-issues-testuser-2026-11-20.csv");
      expect(link.href).toContain("mock-blob-url");
    });

    it("formats and triggers Markdown download with link click and cleanup", () => {
      const appendChildSpy = jest.spyOn(document.body, "appendChild");
      const removeChildSpy = jest.spyOn(document.body, "removeChild");

      exportRecommendedIssues(sampleIssues, "markdown", {
        username: "testuser",
        date: "2026-11-20",
      });

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-blob-url");

      const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(link.download).toBe("opensourcemate-recommended-issues-testuser-2026-11-20.md");
      expect(link.href).toContain("mock-blob-url");
    });
  });
});
