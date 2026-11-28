import { getMockRecommendedIssues, MOCK_RECOMMENDED_ISSUES } from "../data/mockIssues";
import { generateMockMatchedIssues } from "../mocks/fixtures/issues";

describe("Custom Skills Matching Logic", () => {
  const detectedSkills = ["TypeScript", "Python"];

  describe("Removing a skill removes its issues from the results", () => {
    it("removes Python issues when Python skill is removed", () => {
      // Initially, with detected skills [TypeScript, Python]
      const initialIssues = getMockRecommendedIssues(detectedSkills, { filterBySkills: true });
      const hasPythonBefore = initialIssues.some(
        (issue) => issue.language?.toLowerCase() === "python"
      );
      const hasTypeScriptBefore = initialIssues.some(
        (issue) => issue.language?.toLowerCase() === "typescript"
      );

      expect(hasPythonBefore).toBe(true);
      expect(hasTypeScriptBefore).toBe(true);

      // User removes Python -> remaining skills: [TypeScript]
      const updatedSkills = ["TypeScript"];
      const updatedIssues = getMockRecommendedIssues(updatedSkills, { filterBySkills: true });

      const hasPythonAfter = updatedIssues.some(
        (issue) => issue.language?.toLowerCase() === "python"
      );
      const hasTypeScriptAfter = updatedIssues.some(
        (issue) => issue.language?.toLowerCase() === "typescript"
      );

      expect(hasPythonAfter).toBe(false);
      expect(hasTypeScriptAfter).toBe(true);
      expect(updatedIssues.find((i) => i.repository === "tiangolo/fastapi")).toBeUndefined();
    });

    it("returns empty recommendations when all skills are removed", () => {
      const emptyIssues = getMockRecommendedIssues([], { filterBySkills: true });
      expect(emptyIssues).toEqual([]);
    });

    it("filters mock matched issues fixture correctly when a skill is removed", () => {
      const allMatched = generateMockMatchedIssues("octocat", ["JavaScript", "Ruby"]);
      expect(allMatched.recommendations.some((i) => i.language === "Ruby")).toBe(true);

      // Remove Ruby
      const rubyRemoved = generateMockMatchedIssues("octocat", ["JavaScript"]);
      expect(rubyRemoved.skills).toEqual(["JavaScript"]);
      expect(rubyRemoved.recommendations.some((i) => i.language === "Ruby")).toBe(false);
      expect(rubyRemoved.recommendations.every((i) => i.language === "JavaScript")).toBe(true);
    });
  });

  describe("Added skills are used by the matcher", () => {
    it("includes and scores issues matching newly added skills", () => {
      // User starts with [TypeScript], adds [Rust]
      const withTypeScript = getMockRecommendedIssues(["TypeScript"], { filterBySkills: true });
      expect(withTypeScript.some((i) => i.language === "Rust")).toBe(false);

      // User adds Rust
      const withRust = getMockRecommendedIssues(["TypeScript", "Rust"], { filterBySkills: true });
      const rustIssue = withRust.find((i) => i.language === "Rust");

      expect(rustIssue).toBeDefined();
      expect(rustIssue?.repository).toBe("BurntSushi/ripgrep");
      expect(rustIssue?.match_score).toBeGreaterThanOrEqual(80);
    });

    it("includes added skills in generateMockMatchedIssues fixture response", () => {
      const result = generateMockMatchedIssues("custom-user", ["Go", "Rust"]);
      expect(result.skills).toEqual(["Go", "Rust"]);
      expect(result.recommendations.some((i) => i.language === "Rust")).toBe(true);
    });
  });

  describe("Resetting restores the detected list and results", () => {
    it("restoring detected skills brings back original recommendations", () => {
      const originalIssues = getMockRecommendedIssues(detectedSkills, { filterBySkills: true });

      // User edited: removed Python, added Rust
      const editedIssues = getMockRecommendedIssues(["TypeScript", "Rust"], {
        filterBySkills: true,
      });
      expect(editedIssues.some((i) => i.language === "Python")).toBe(false);

      // User clicks reset: restores detectedSkills
      const restoredIssues = getMockRecommendedIssues(detectedSkills, { filterBySkills: true });
      expect(restoredIssues.map((i) => i.id)).toEqual(originalIssues.map((i) => i.id));
    });
  });
});
