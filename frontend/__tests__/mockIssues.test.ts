import {
  inferIssueDifficulty,
  getMockRecommendedIssues,
  MOCK_RECOMMENDED_ISSUES,
} from "../data/mockIssues";

describe("mockIssues module", () => {
  describe("inferIssueDifficulty", () => {
    it("identifies Beginner difficulty from beginner labels", () => {
      expect(inferIssueDifficulty(["good first issue", "bug"])).toBe("Beginner");
      expect(inferIssueDifficulty(["good-first-issue"])).toBe("Beginner");
      expect(inferIssueDifficulty(["documentation"])).toBe("Beginner");
      expect(inferIssueDifficulty(["easy", "starter"])).toBe("Beginner");
      expect(inferIssueDifficulty(["first-timers-only"])).toBe("Beginner");
    });

    it("identifies Advanced difficulty from advanced labels", () => {
      expect(inferIssueDifficulty(["architecture", "enhancement"])).toBe("Advanced");
      expect(inferIssueDifficulty(["performance", "needs-triage"])).toBe("Advanced");
      expect(inferIssueDifficulty(["breaking-change"])).toBe("Advanced");
      expect(inferIssueDifficulty(["core", "rfc"])).toBe("Advanced");
      expect(inferIssueDifficulty(["expert-needed"])).toBe("Advanced");
    });

    it("defaults to Intermediate for standard or unclassified labels", () => {
      expect(inferIssueDifficulty(["enhancement"])).toBe("Intermediate");
      expect(inferIssueDifficulty(["help wanted"])).toBe("Intermediate");
      expect(inferIssueDifficulty(["bug"])).toBe("Intermediate");
      expect(inferIssueDifficulty([])).toBe("Intermediate");
    });
  });

  describe("getMockRecommendedIssues", () => {
    it("returns all mock issues with difficulty and mock flags when skills are empty", () => {
      const issues = getMockRecommendedIssues([]);
      expect(issues.length).toBe(MOCK_RECOMMENDED_ISSUES.length);
      issues.forEach((issue) => {
        expect(issue.difficulty).toBeDefined();
        expect(issue.is_mock).toBe(true);
      });
    });

    it("boosts match score and sorts issues matching user skills", () => {
      const pythonIssues = getMockRecommendedIssues(["Python"]);
      expect(pythonIssues.length).toBeGreaterThan(0);

      // Top issue should match Python (fastapi issue)
      const topIssue = pythonIssues[0];
      expect(topIssue.language).toBe("Python");
      expect(topIssue.match_score).toBeGreaterThanOrEqual(90);
    });

    it("handles SkillItem objects with name field", () => {
      const skills = [
        { name: "TypeScript", repository_count: 5, percentage: 50 },
        { name: "React", repository_count: 3, percentage: 30 },
      ];

      const issues = getMockRecommendedIssues(skills);
      expect(issues[0].language).toBe("TypeScript");
    });

    it("safely handles null or undefined inputs", () => {
      const issuesNull = getMockRecommendedIssues(null);
      expect(issuesNull.length).toBe(MOCK_RECOMMENDED_ISSUES.length);

      const issuesUndefined = getMockRecommendedIssues(undefined);
      expect(issuesUndefined.length).toBe(MOCK_RECOMMENDED_ISSUES.length);
    });

    it("favours target skills and beginner issues when learningMode is active", () => {
      // User has existing heavy TypeScript skills
      const defaultRanking = getMockRecommendedIssues(["TypeScript"]);
      expect(defaultRanking[0].language).toBe("TypeScript");

      // User switches on Learning Mode with target skill "Rust"
      const learningRanking = getMockRecommendedIssues(["TypeScript"], {
        learningMode: true,
        targetSkills: ["Rust"],
      });

      expect(learningRanking[0].language).toBe("Rust");
      expect(learningRanking[0].difficulty).toBe("Beginner");
      expect(learningRanking[0].is_learning_mode).toBe(true);
      expect(learningRanking[0].learning_skill).toBe("Rust");
      expect(learningRanking[0].match_score).toBeGreaterThanOrEqual(95);
    });

    it("keeps ranking unchanged when learningMode is explicitly false", () => {
      const defaultRanking = getMockRecommendedIssues(["TypeScript"]);
      const withFalseOption = getMockRecommendedIssues(["TypeScript"], {
        learningMode: false,
        targetSkills: ["Rust"],
      });

      expect(withFalseOption[0].id).toBe(defaultRanking[0].id);
      expect(withFalseOption[0].match_score).toBe(defaultRanking[0].match_score);
    });
  });
});
