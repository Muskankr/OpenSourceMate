import {
  calculateLearningScore,
  rankIssuesForLearningMode,
  isIssueMatchingSkill,
  findMatchingTargetSkill,
  COMMON_TARGET_SKILLS,
} from "../utils/learningMode";
import { MOCK_RECOMMENDED_ISSUES } from "../data/mockIssues";
import type { IssueRecommendation } from "../types/api";

describe("Learning Mode Scoring and Ranking Module", () => {
  const sampleIssues: IssueRecommendation[] = [
    {
      id: 1,
      title: "Add unit tests for API error handler",
      repository: "vercel/next.js",
      url: "https://github.com/vercel/next.js/issues/1",
      state: "open",
      labels: ["good first issue", "typescript"],
      comments: 3,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-02T00:00:00Z",
      language: "TypeScript",
      match_score: 94,
      difficulty: "Beginner",
      explanation: "Matches your TypeScript profile.",
      match_reasons: ["TypeScript primary skill"],
    },
    {
      id: 2,
      title: "Refactor async database session pool",
      repository: "tiangolo/fastapi",
      url: "https://github.com/tiangolo/fastapi/issues/2",
      state: "open",
      labels: ["help wanted", "python"],
      comments: 7,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-02T00:00:00Z",
      language: "Python",
      match_score: 89,
      difficulty: "Intermediate",
      explanation: "Matches Python backend experience.",
      match_reasons: ["Python backend skill"],
    },
    {
      id: 3,
      title: "Implement zero-copy memory mapped file reader in Rust",
      repository: "BurntSushi/ripgrep",
      url: "https://github.com/BurntSushi/ripgrep/issues/3",
      state: "open",
      labels: ["good-first-issue", "rust"],
      comments: 2,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-02T00:00:00Z",
      language: "Rust",
      match_score: 72,
      difficulty: "Beginner",
      explanation: "Fast command-line tool.",
      match_reasons: ["Low-level systems code"],
    },
    {
      id: 4,
      title: "Design architectural RFC for distributed consensus",
      repository: "BurntSushi/ripgrep",
      url: "https://github.com/BurntSushi/ripgrep/issues/4",
      state: "open",
      labels: ["architecture", "hard", "rust"],
      comments: 15,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-02T00:00:00Z",
      language: "Rust",
      match_score: 70,
      difficulty: "Advanced",
      explanation: "High complexity architecture task.",
      match_reasons: ["Architecture RFC"],
    },
  ];

  describe("Skill matching helper functions", () => {
    it("matches skills by language case-insensitively", () => {
      expect(isIssueMatchingSkill(sampleIssues[0], "typescript")).toBe(true);
      expect(isIssueMatchingSkill(sampleIssues[0], "TypeScript")).toBe(true);
      expect(isIssueMatchingSkill(sampleIssues[1], "python")).toBe(true);
      expect(isIssueMatchingSkill(sampleIssues[2], "rust")).toBe(true);
      expect(isIssueMatchingSkill(sampleIssues[0], "Rust")).toBe(false);
    });

    it("matches skills by label substring", () => {
      expect(isIssueMatchingSkill(sampleIssues[1], "python")).toBe(true);
      expect(isIssueMatchingSkill(sampleIssues[3], "architecture")).toBe(true);
    });

    it("matches skills by title or repository", () => {
      expect(isIssueMatchingSkill(sampleIssues[2], "ripgrep")).toBe(true);
      expect(isIssueMatchingSkill(sampleIssues[1], "fastapi")).toBe(true);
    });

    it("finds the first matching target skill from an array", () => {
      expect(findMatchingTargetSkill(sampleIssues[2], ["Go", "Rust", "Python"])).toBe("Rust");
      expect(findMatchingTargetSkill(sampleIssues[0], ["Go", "Rust"])).toBeNull();
    });

    it("defines COMMON_TARGET_SKILLS with popular learning technologies", () => {
      expect(COMMON_TARGET_SKILLS).toContain("Python");
      expect(COMMON_TARGET_SKILLS).toContain("Rust");
      expect(COMMON_TARGET_SKILLS).toContain("Go");
      expect(COMMON_TARGET_SKILLS).toContain("TypeScript");
    });
  });

  describe("calculateLearningScore", () => {
    it("penalizes non-matching issues so chosen skills are favored", () => {
      const result = calculateLearningScore(sampleIssues[0], ["Rust"]);
      expect(result.isTargetMatch).toBe(false);
      expect(result.matchedSkill).toBeNull();
      expect(result.score).toBeLessThan(70);
    });

    it("ranks beginner-friendly issues in target skills with highest score (>= 95)", () => {
      const result = calculateLearningScore(sampleIssues[2], ["Rust"]);
      expect(result.isTargetMatch).toBe(true);
      expect(result.matchedSkill).toBe("Rust");
      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.explanation).toContain(
        "beginner-friendly starter issue to help you learn and grow into Rust"
      );
      expect(result.reasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Target learning skill: Rust"),
          expect.stringContaining("Beginner difficulty: ideal for learning new technologies"),
        ])
      );
    });

    it("assigns intermediate difficulty in target skills a moderate score (85-92)", () => {
      const result = calculateLearningScore(sampleIssues[1], ["Python"]);
      expect(result.isTargetMatch).toBe(true);
      expect(result.matchedSkill).toBe("Python");
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.score).toBeLessThan(95);
      expect(result.explanation).toContain(
        "intermediate Python issue to build your hands-on experience"
      );
    });

    it("assigns advanced difficulty in target skills lower score than beginner or intermediate", () => {
      const resultAdvanced = calculateLearningScore(sampleIssues[3], ["Rust"]);
      const resultBeginner = calculateLearningScore(sampleIssues[2], ["Rust"]);
      expect(resultAdvanced.score).toBeLessThan(resultBeginner.score);
    });
  });

  describe("rankIssuesForLearningMode", () => {
    it("keeps ranking strictly unchanged when learning mode is OFF", () => {
      const result = rankIssuesForLearningMode(sampleIssues, ["Rust"], false);
      expect(result).toEqual(sampleIssues);
      expect(result[0].id).toBe(1); // Original top issue unchanged
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
      expect(result[3].id).toBe(4);
    });

    it("keeps ranking strictly unchanged when target skills list is empty", () => {
      const resultEmpty = rankIssuesForLearningMode(sampleIssues, [], true);
      expect(resultEmpty).toEqual(sampleIssues);

      const resultWhitespace = rankIssuesForLearningMode(sampleIssues, ["  "], true);
      expect(resultWhitespace).toEqual(sampleIssues);
    });

    it("favours the chosen target skills when learning mode is ON", () => {
      // User normally uses TypeScript (issue 1 has match_score 94), but wants to learn Rust
      const ranked = rankIssuesForLearningMode(sampleIssues, ["Rust"], true);

      // The top issue MUST be a Rust issue, not the original TypeScript issue
      expect(ranked[0].language).toBe("Rust");
      expect(ranked[0].is_learning_mode).toBe(true);
      expect(ranked[0].learning_skill).toBe("Rust");
      expect(ranked[0].match_score).toBeGreaterThanOrEqual(95);

      // Non-target issues should be placed lower in the ranking
      const nonTarget = ranked.find((i) => i.language === "TypeScript");
      expect(nonTarget).toBeDefined();
      expect(nonTarget?.match_score).toBeLessThan(ranked[0].match_score!);
    });

    it("ranks beginner-friendly issues higher than intermediate and advanced in the chosen skill", () => {
      // sampleIssues has:
      // Issue 3: Rust, Beginner (original score 72)
      // Issue 4: Rust, Advanced (original score 70)
      const ranked = rankIssuesForLearningMode(sampleIssues, ["Rust"], true);

      const beginnerRustIdx = ranked.findIndex((i) => i.id === 3);
      const advancedRustIdx = ranked.findIndex((i) => i.id === 4);

      expect(beginnerRustIdx).toBe(0); // Beginner Rust is #1
      expect(advancedRustIdx).toBeGreaterThan(beginnerRustIdx); // Advanced Rust is ranked lower
      expect(ranked[beginnerRustIdx].match_score!).toBeGreaterThan(
        ranked[advancedRustIdx].match_score!
      );
    });

    it("explains on each picked card why it was picked for learning mode", () => {
      const ranked = rankIssuesForLearningMode(sampleIssues, ["Python"], true);

      const pythonIssue = ranked.find((i) => i.id === 2);
      expect(pythonIssue).toBeDefined();
      expect(pythonIssue?.is_learning_mode).toBe(true);
      expect(pythonIssue?.learning_skill).toBe("Python");
      expect(pythonIssue?.explanation).toMatch(/Picked for Learning Mode: .* Python/i);
      expect(pythonIssue?.match_reasons).toEqual(
        expect.arrayContaining([expect.stringContaining("Target learning skill: Python")])
      );
    });

    it("handles multiple chosen skills properly", () => {
      const ranked = rankIssuesForLearningMode(sampleIssues, ["Rust", "Python"], true);

      // Top items should be Rust and Python issues
      const topLanguages = ranked.slice(0, 3).map((i) => i.language);
      expect(topLanguages).toContain("Rust");
      expect(topLanguages).toContain("Python");
      expect(topLanguages).not.toContain("TypeScript");
    });

    it("works seamlessly with MOCK_RECOMMENDED_ISSUES dataset", () => {
      const ranked = rankIssuesForLearningMode(MOCK_RECOMMENDED_ISSUES, ["Rust"], true);
      expect(ranked[0].repository).toBe("BurntSushi/ripgrep");
      expect(ranked[0].difficulty).toBe("Beginner");
      expect(ranked[0].is_learning_mode).toBe(true);
      expect(ranked[0].match_score).toBeGreaterThanOrEqual(95);
    });
  });
});
