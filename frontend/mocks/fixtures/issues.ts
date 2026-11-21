import type { MatchedIssuesResponse } from "../../types/api";

export const MOCK_MATCHED_ISSUES: Record<string, MatchedIssuesResponse> = {
  octocat: {
    username: "octocat",
    skills: ["Ruby", "JavaScript", "HTML", "CSS"],
    recommendations: [
      {
        id: 201,
        title: "Fix responsive navbar hamburger menu contrast in dark mode",
        repository: "github/docs",
        url: "https://github.com/github/docs/issues/201",
        state: "open",
        labels: ["good first issue", "accessibility", "frontend"],
        comments: 3,
        created_at: "2026-10-14T09:00:00Z",
        updated_at: "2026-10-25T11:20:00Z",
        language: "JavaScript",
        match_score: 93,
        match_reasons: ["Matched skill: JavaScript & CSS", "Tagged good first issue"],
        explanation:
          "Great introductory issue for improving GitHub docs accessibility contrast ratios.",
        difficulty: "Beginner",
      },
      {
        id: 202,
        title: "Migrate Rails model callbacks to active support notifications",
        repository: "rails/rails",
        url: "https://github.com/rails/rails/issues/202",
        state: "open",
        labels: ["activerecord", "help wanted"],
        comments: 14,
        created_at: "2026-10-10T14:15:00Z",
        updated_at: "2026-10-29T16:45:00Z",
        language: "Ruby",
        match_score: 87,
        match_reasons: ["Matched primary skill: Ruby", "Active Record architectural improvement"],
        explanation: "Refactors internal callback lifecycle events to clean event notifications.",
        difficulty: "Intermediate",
      },
    ],
    total: 2,
  },
  torvalds: {
    username: "torvalds",
    skills: ["C", "Shell", "Assembly"],
    recommendations: [
      {
        id: 301,
        title: "Refactor x86_64 TLB invalidation handler for virtualized guests",
        repository: "torvalds/linux",
        url: "https://github.com/torvalds/linux/issues/301",
        state: "open",
        labels: ["arch/x86", "performance", "kernel"],
        comments: 26,
        created_at: "2026-09-18T10:00:00Z",
        updated_at: "2026-10-30T12:00:00Z",
        language: "C",
        match_score: 99,
        match_reasons: [
          "Exact match for primary language: C",
          "Kernel memory architecture alignment",
        ],
        explanation: "High-performance low-level page table caching enhancement for hypervisors.",
        difficulty: "Advanced",
      },
    ],
    total: 1,
  },
};

export function generateMockMatchedIssues(
  username: string,
  explicitSkills?: string[]
): MatchedIssuesResponse {
  const normalized = username.toLowerCase().trim();
  const baseData: MatchedIssuesResponse = MOCK_MATCHED_ISSUES[normalized] || {
    username,
    skills: ["TypeScript", "Python", "React"],
    recommendations: [
      {
        id: 101,
        title: "Add TypeScript type definitions for options parser",
        repository: "vercel/next.js",
        url: "https://github.com/vercel/next.js/issues/101",
        state: "open",
        labels: ["good first issue", "typescript"],
        comments: 2,
        created_at: "2026-10-12T10:00:00Z",
        updated_at: "2026-10-20T14:00:00Z",
        language: "TypeScript",
        match_score: 95,
        match_reasons: ["Matched primary skill: TypeScript", "Beginner friendly issue"],
        explanation: "Enhance type safety in the command-line options parser.",
        difficulty: "Beginner",
      },
      {
        id: 102,
        title: "Improve async connection pool error handling in client",
        repository: "tiangolo/fastapi",
        url: "https://github.com/tiangolo/fastapi/issues/102",
        state: "open",
        labels: ["help wanted", "enhancement"],
        comments: 6,
        created_at: "2026-10-15T11:00:00Z",
        updated_at: "2026-10-26T16:30:00Z",
        language: "Python",
        match_score: 88,
        match_reasons: ["Matched skill: Python", "Async client architecture"],
        explanation: "Robust retry handling for dropped database connections.",
        difficulty: "Intermediate",
      },
      {
        id: 103,
        title: "Implement zero-copy memory mapped file reader in Rust",
        repository: "BurntSushi/ripgrep",
        url: "https://github.com/BurntSushi/ripgrep/issues/103",
        state: "open",
        labels: ["good first issue", "rust"],
        comments: 2,
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-28T14:00:00Z",
        language: "Rust",
        match_score: 92,
        match_reasons: ["Matched skill: Rust", "Fast file system utilities"],
        explanation: "High performance memory mapping in ripgrep.",
        difficulty: "Beginner",
      },
    ],
    total: 3,
  };

  if (explicitSkills !== undefined) {
    if (explicitSkills.length === 0) {
      return {
        username,
        skills: [],
        recommendations: [],
        total: 0,
      };
    }

    const explicitLower = new Set(explicitSkills.map((s) => s.toLowerCase().trim()));
    const filteredRecs = baseData.recommendations.filter((rec) => {
      const langMatch = rec.language && explicitLower.has(rec.language.toLowerCase());
      const labelMatch = rec.labels?.some((lbl) => explicitLower.has(lbl.toLowerCase()));
      const titleMatch = explicitSkills.some((s) =>
        rec.title.toLowerCase().includes(s.toLowerCase())
      );
      return langMatch || labelMatch || titleMatch;
    });

    return {
      username,
      skills: explicitSkills,
      recommendations: filteredRecs,
      total: filteredRecs.length,
    };
  }

  return baseData;
}
