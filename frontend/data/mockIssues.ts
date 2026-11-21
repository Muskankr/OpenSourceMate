import type { IssueRecommendation, SkillItem } from "../types/api";
import { rankIssuesForLearningMode } from "../utils/learningMode";

export type IssueDifficulty = "Beginner" | "Intermediate" | "Advanced";

/**
 * Infers an issue's difficulty level from its labels and metadata.
 */
export function inferIssueDifficulty(labels: string[] = []): IssueDifficulty {
  const normalizedLabels = labels.map((l) => l.toLowerCase());

  // Beginner signals
  if (
    normalizedLabels.some(
      (l) =>
        l.includes("good first") ||
        l.includes("good-first-issue") ||
        l.includes("beginner") ||
        l.includes("easy") ||
        l.includes("starter") ||
        l.includes("first-timers") ||
        l.includes("documentation") ||
        l.includes("docs")
    )
  ) {
    return "Beginner";
  }

  // Advanced signals
  if (
    normalizedLabels.some(
      (l) =>
        l.includes("architecture") ||
        l.includes("performance") ||
        l.includes("expert") ||
        l.includes("hard") ||
        l.includes("complex") ||
        l.includes("rfc") ||
        l.includes("breaking") ||
        l.includes("core")
    )
  ) {
    return "Advanced";
  }

  // Default to Intermediate
  return "Intermediate";
}

/**
 * Realistic repository of open-source issues used for demo and fallback states
 * when the backend matching endpoint is not yet ready or in development.
 */
export const MOCK_RECOMMENDED_ISSUES: IssueRecommendation[] = [
  {
    id: 1001,
    title: "Add dark mode toggle keyboard accessibility shortcut (Ctrl/Cmd + J)",
    repository: "vercel/next.js",
    url: "https://github.com/vercel/next.js/issues/1001",
    state: "open",
    labels: ["good first issue", "accessibility", "frontend"],
    comments: 4,
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-10-28T14:30:00Z",
    language: "TypeScript",
    match_score: 94,
    match_reasons: [
      "Matched primary skill: TypeScript",
      "Tag matched: accessibility / good first issue",
      "Repository matches high-frequency frontend activity",
    ],
    explanation:
      "This issue directly matches your TypeScript experience and has clear acceptance criteria suitable for getting started in Next.js core.",
    difficulty: "Beginner",
    is_mock: true,
  },
  {
    id: 1002,
    title: "Support Pydantic v2 recursive model validation in dependency injection",
    repository: "tiangolo/fastapi",
    url: "https://github.com/tiangolo/fastapi/issues/1002",
    state: "open",
    labels: ["help wanted", "enhancement", "pydantic-v2"],
    comments: 12,
    created_at: "2026-10-18T08:15:00Z",
    updated_at: "2026-10-29T11:20:00Z",
    language: "Python",
    match_score: 89,
    match_reasons: [
      "Matched primary skill: Python",
      "FastAPI architecture aligns with your backend repositories",
      "Active discussion with maintainer feedback provided",
    ],
    explanation:
      "A great match for backend Python developers comfortable with type annotations and modern async frameworks.",
    difficulty: "Intermediate",
    is_mock: true,
  },
  {
    id: 1003,
    title: "Optimize SVG rendering pipeline for heavy node tree diagrams",
    repository: "facebook/react",
    url: "https://github.com/facebook/react/issues/1003",
    state: "open",
    labels: ["performance", "component", "advanced"],
    comments: 19,
    created_at: "2026-09-20T16:45:00Z",
    updated_at: "2026-10-30T09:10:00Z",
    language: "JavaScript",
    match_score: 85,
    match_reasons: ["Matched skill: React and JavaScript", "Performance optimization focus"],
    explanation:
      "Deep dive into React DOM reconciliation and SVG layout recalculation under heavy rendering workloads.",
    difficulty: "Advanced",
    is_mock: true,
  },
  {
    id: 1004,
    title: "Implement zero-allocation TCP connection pooling for gRPC client",
    repository: "golang/go",
    url: "https://github.com/golang/go/issues/1004",
    state: "open",
    labels: ["net/http", "performance", "help wanted"],
    comments: 8,
    created_at: "2026-10-05T12:00:00Z",
    updated_at: "2026-10-27T17:00:00Z",
    language: "Go",
    match_score: 91,
    match_reasons: ["Matched primary skill: Go", "Network systems programming alignment"],
    explanation: "Requires familiarity with Go's net package and sync.Pool memory reuse patterns.",
    difficulty: "Advanced",
    is_mock: true,
  },
  {
    id: 1005,
    title: "Improve CLI help messages and error formatting for missing config file",
    repository: "BurntSushi/ripgrep",
    url: "https://github.com/BurntSushi/ripgrep/issues/1005",
    state: "open",
    labels: ["good first issue", "cli", "docs"],
    comments: 3,
    created_at: "2026-10-22T09:30:00Z",
    updated_at: "2026-10-31T15:00:00Z",
    language: "Rust",
    match_score: 88,
    match_reasons: ["Matched skill: Rust", "Beginner-friendly issue labeled good first issue"],
    explanation:
      "Straightforward Rust enhancement updating clap CLI error reporting and user guide documentation.",
    difficulty: "Beginner",
    is_mock: true,
  },
  {
    id: 1006,
    title: "Add arbitrary precision decimal formatting utility with i18n support",
    repository: "tailwindlabs/tailwindcss",
    url: "https://github.com/tailwindlabs/tailwindcss/issues/1006",
    state: "open",
    labels: ["enhancement", "help wanted"],
    comments: 7,
    created_at: "2026-10-10T14:10:00Z",
    updated_at: "2026-10-29T18:40:00Z",
    language: "TypeScript",
    match_score: 82,
    match_reasons: ["Matched skill: TypeScript and CSS", "Utility library expansion"],
    explanation:
      "Builds on Tailwind compiler internals to format dynamic unit values across international locales.",
    difficulty: "Intermediate",
    is_mock: true,
  },
];

export interface MockIssuesOptions {
  learningMode?: boolean;
  targetSkills?: string[];
}

/**
 * Returns mock recommended issues filtered or prioritized by user skills.
 * Falls back to the full mock set if no skills match.
 *
 * When options.learningMode is true with chosen targetSkills, ranks
 * beginner-friendly issues in the chosen skills higher.
 */
export function getMockRecommendedIssues(
  skills?: string[] | SkillItem[] | null,
  options?: MockIssuesOptions
): IssueRecommendation[] {
  let baseList: IssueRecommendation[];

  if (!skills || skills.length === 0) {
    baseList = MOCK_RECOMMENDED_ISSUES.map((issue) => ({
      ...issue,
      difficulty: issue.difficulty || inferIssueDifficulty(issue.labels),
      is_mock: true,
    }));
  } else {
    // Extract skill names in lowercase
    const userSkillNames = new Set(
      skills.map((s) => (typeof s === "string" ? s.toLowerCase() : s.name.toLowerCase()))
    );

    // Score mock issues based on user's skills
    const scored = MOCK_RECOMMENDED_ISSUES.map((issue) => {
      const langMatch = issue.language && userSkillNames.has(issue.language.toLowerCase());
      const labelMatch = issue.labels?.some((lbl) => userSkillNames.has(lbl.toLowerCase()));

      let score = issue.match_score ?? 75;
      if (langMatch) score = Math.min(98, score + 10);
      if (labelMatch) score = Math.min(99, score + 5);

      return {
        ...issue,
        match_score: score,
        difficulty: issue.difficulty || inferIssueDifficulty(issue.labels),
        is_mock: true,
      };
    });

    baseList = scored.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
  }

  if (options?.learningMode && options?.targetSkills && options.targetSkills.length > 0) {
    return rankIssuesForLearningMode(baseList, options.targetSkills, true);
  }

  return baseList;
}
