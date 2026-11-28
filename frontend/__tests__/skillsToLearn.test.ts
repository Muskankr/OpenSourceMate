import {
  getSkillsToLearn,
  normalizeSkillName,
  extractSkillsMapping,
  defaultSkillsMapping,
  calculateUnlockedIssues,
  SkillsMapping,
} from "../utils/skillsToLearn";
import { SkillItem } from "../types/api";

describe("skillsToLearn utility", () => {
  describe("normalizeSkillName", () => {
    it("lowercases and trims string values", () => {
      expect(normalizeSkillName("  TypeScript  ")).toBe("typescript");
      expect(normalizeSkillName("React.js")).toBe("react.js");
      expect(normalizeSkillName("C++")).toBe("c++");
    });

    it("handles null, undefined, and non-string values safely", () => {
      expect(normalizeSkillName("")).toBe("");
      expect(normalizeSkillName(null as unknown as string)).toBe("");
      expect(normalizeSkillName(undefined as unknown as string)).toBe("");
      expect(normalizeSkillName(123 as unknown as string)).toBe("");
    });
  });

  describe("extractSkillsMapping", () => {
    it("extracts direct dictionary mapping and strips metadata keys", () => {
      const raw = {
        $schema: "./schema.json",
        title: "Test Mapping",
        description: "Test description",
        Python: ["FastAPI", "Django"],
        React: ["Next.js", "Redux"],
      };

      const extracted = extractSkillsMapping(raw);
      expect(extracted).toEqual({
        Python: ["FastAPI", "Django"],
        React: ["Next.js", "Redux"],
      });
      expect(extracted.$schema).toBeUndefined();
      expect(extracted.title).toBeUndefined();
      expect(extracted.description).toBeUndefined();
    });

    it("extracts nested mappings when structured with mappings key", () => {
      const raw = {
        mappings: {
          Go: ["Kubernetes", "Docker", "gRPC"],
        },
      };

      const extracted = extractSkillsMapping(raw);
      expect(extracted).toEqual({
        Go: ["Kubernetes", "Docker", "gRPC"],
      });
    });

    it("safely handles null, undefined, and primitive values", () => {
      expect(extractSkillsMapping(null)).toEqual({});
      expect(extractSkillsMapping(undefined)).toEqual({});
      expect(extractSkillsMapping("invalid")).toEqual({});
      expect(extractSkillsMapping(42)).toEqual({});
    });
  });

  describe("calculateUnlockedIssues", () => {
    it("calculates extra matching issues unlocked by candidate skill not matched by user skills", () => {
      const mockIssues = [
        { language: "FastAPI", labels: ["good first issue"], title: "Fix dependency injection" },
        { language: "FastAPI", labels: ["enhancement"], title: "Add OpenAPI schema validation" },
        { language: "Python", labels: ["bug"], title: "Python core issue" },
      ];

      const userSkills = new Set(["python"]);
      // FastAPI unlocks 2 issues that Python did not match by language
      const count = calculateUnlockedIssues("FastAPI", userSkills, mockIssues);
      expect(count).toBe(2);
    });

    it("falls back to baseline catalog count when issues pool is empty or not provided", () => {
      const userSkills = new Set(["python"]);
      const count = calculateUnlockedIssues("FastAPI", userSkills);
      expect(count).toBeGreaterThan(0);
      expect(count).toBe(18); // FastAPI baseline
    });
  });

  describe("getSkillsToLearn", () => {
    const mockMapping: SkillsMapping = {
      Python: ["FastAPI", "Django", "Pandas", "PyTorch", "Celery", "Flask"],
      JavaScript: ["TypeScript", "React", "Node.js"],
      React: ["Next.js", "TypeScript", "Tailwind CSS", "Redux", "GraphQL"],
      TypeScript: ["Next.js", "Node.js", "NestJS", "Prisma"],
    };

    it("returns empty array for empty, null, or undefined skills without error", () => {
      expect(getSkillsToLearn(null, mockMapping)).toEqual([]);
      expect(getSkillsToLearn(undefined, mockMapping)).toEqual([]);
      expect(getSkillsToLearn([], mockMapping)).toEqual([]);
      expect(getSkillsToLearn([""], mockMapping)).toEqual([]);
      expect(getSkillsToLearn(["   "], mockMapping)).toEqual([]);
    });

    it("returns empty array for unknown skills without error", () => {
      expect(getSkillsToLearn(["Brainfuck", "COBOL_UNKNOWN"], mockMapping)).toEqual([]);
      expect(
        getSkillsToLearn(
          [{ name: "NonExistentLanguage", repository_count: 1 } as SkillItem],
          mockMapping
        )
      ).toEqual([]);
    });

    it("shows the top three suggestions by default (Issue #401)", () => {
      const suggestions = getSkillsToLearn(["Python"], mockMapping);

      expect(suggestions.length).toBe(3);
      expect(suggestions.map((s) => s.name)).toEqual(["FastAPI", "Pandas", "Django"]);
      suggestions.forEach((s) => {
        expect(s.unlockedIssuesCount).toBeGreaterThan(0);
      });
    });

    it("excludes skills that the user already has (case-insensitive)", () => {
      // User already has Python and FastAPI
      const suggestions = getSkillsToLearn(["Python", "fastapi"], mockMapping);

      expect(suggestions.map((s) => s.name)).toEqual(["Pandas", "Django", "PyTorch"]);
      expect(suggestions.some((s) => s.name.toLowerCase() === "fastapi")).toBe(false);
    });

    it("suggests TypeScript from JavaScript and FastAPI from Python", () => {
      const jsSuggestions = getSkillsToLearn(["JavaScript"], mockMapping);
      expect(jsSuggestions.map((s) => s.name)).toContain("TypeScript");

      const pySuggestions = getSkillsToLearn(["Python"], mockMapping);
      expect(pySuggestions.map((s) => s.name)).toContain("FastAPI");
    });

    it("allows adding relationships with only a config change (verified via custom mapping)", () => {
      const customConfig: SkillsMapping = {
        PHP: ["Laravel", "Symfony"],
      };

      const suggestions = getSkillsToLearn(["PHP"], customConfig);
      expect(suggestions.length).toBe(2);
      expect(suggestions[0].name).toBe("Laravel");
      expect(suggestions[0].recommendedFrom).toBe("PHP");
    });

    it("works seamlessly with SkillItem objects", () => {
      const userSkills: SkillItem[] = [
        {
          name: "React",
          repository_count: 5,
          percentage: 45,
          proficiency: "Strong",
        },
      ];

      const suggestions = getSkillsToLearn(userSkills, mockMapping);
      expect(suggestions.length).toBe(3);
      expect(suggestions.some((s) => s.name === "Next.js" || s.name === "TypeScript")).toBe(true);
    });

    it("deduplicates suggestions across multiple detected skills", () => {
      // Both React and TypeScript suggest Next.js
      const suggestions = getSkillsToLearn(["React", "TypeScript"], mockMapping, 3);

      const nextJsOccurrences = suggestions.filter((s) => s.name === "Next.js");
      expect(nextJsOccurrences.length).toBe(1);
    });
  });
});
