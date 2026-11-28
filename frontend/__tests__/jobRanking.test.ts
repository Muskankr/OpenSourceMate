import {
  normalizeSkill,
  extractStudentSkillSet,
  generateMatchReason,
  evaluateJobMatch,
  rankJobListings,
} from "../utils/jobRanking";
import type { JobListing } from "../types/jobs";

describe("jobRanking utilities", () => {
  const sampleListings: JobListing[] = [
    {
      id: "job-ts",
      title: "Frontend Intern",
      company: "Company A",
      location: "Remote",
      roleType: "internship",
      experienceLevel: "entry",
      requiredSkills: ["TypeScript", "React"],
      preferredSkills: ["Next.js"],
      description: "Frontend role",
    },
    {
      id: "job-py",
      title: "Python Backend Intern",
      company: "Company B",
      location: "San Francisco, CA",
      roleType: "internship",
      experienceLevel: "entry",
      requiredSkills: ["Python", "FastAPI"],
      preferredSkills: ["Docker"],
      description: "Backend role",
    },
    {
      id: "job-rust",
      title: "Systems Engineer",
      company: "Company C",
      location: "Bengaluru, India",
      roleType: "full-time",
      experienceLevel: "entry",
      requiredSkills: ["Rust", "C++"],
      description: "Systems role",
    },
  ];

  describe("normalizeSkill", () => {
    it("lowercases and trims skills", () => {
      expect(normalizeSkill("  TypeScript  ")).toBe("typescript");
      expect(normalizeSkill("FastAPI")).toBe("fastapi");
    });
  });

  describe("extractStudentSkillSet", () => {
    it("handles string arrays", () => {
      const skills = ["TypeScript", "React", "Python"];
      const set = extractStudentSkillSet(skills);
      expect(set.has("typescript")).toBe(true);
      expect(set.has("react")).toBe(true);
      expect(set.has("python")).toBe(true);
      expect(set.has("rust")).toBe(false);
    });

    it("handles skill objects with name property", () => {
      const skills = [{ name: "TypeScript" }, { name: "Docker" }];
      const set = extractStudentSkillSet(skills);
      expect(set.has("typescript")).toBe(true);
      expect(set.has("docker")).toBe(true);
    });
  });

  describe("generateMatchReason", () => {
    it("returns learning opportunity message when no skills match", () => {
      const reason = generateMatchReason([], 2, 0);
      expect(reason).toContain("No direct skill overlap");
      expect(reason).toContain("learning opportunity");
    });

    it("returns high alignment explanation for score >= 80", () => {
      const reason = generateMatchReason(["TypeScript", "React"], 2, 85);
      expect(reason).toContain("Excellent fit");
      expect(reason).toContain("TypeScript, React");
    });

    it("returns good alignment explanation for score between 50 and 79", () => {
      const reason = generateMatchReason(["Python"], 2, 55);
      expect(reason).toContain("Good alignment");
      expect(reason).toContain("1 of 2 required skills");
      expect(reason).toContain("Python");
    });
  });

  describe("evaluateJobMatch", () => {
    it("calculates matchedSkills, missingSkills, score, and matchReason", () => {
      const studentSkills = new Set(["typescript", "react", "next.js"]);
      const result = evaluateJobMatch(sampleListings[0], studentSkills);

      expect(result.matchedSkills).toContain("TypeScript");
      expect(result.matchedSkills).toContain("React");
      expect(result.matchedSkills).toContain("Next.js");
      expect(result.missingSkills).toHaveLength(0);
      expect(result.score).toBe(100);
      expect(result.matchReason).toContain("TypeScript");
    });

    it("identifies missing required skills accurately", () => {
      const studentSkills = new Set(["python"]);
      const result = evaluateJobMatch(sampleListings[1], studentSkills);

      expect(result.matchedSkills).toEqual(["Python"]);
      expect(result.missingSkills).toEqual(["FastAPI"]);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(80);
    });
  });

  describe("rankJobListings", () => {
    it("ranks listings by skill overlap descending", () => {
      // Student knows TypeScript and React, but not Python or Rust
      const studentSkills = ["TypeScript", "React", "Next.js"];
      const ranked = rankJobListings(sampleListings, studentSkills);

      expect(ranked[0].id).toBe("job-ts");
      expect(ranked[0].score).toBe(100);
      expect(ranked[0].matchedSkills).toContain("TypeScript");

      // Zero overlap jobs are scored lowest
      expect(ranked[ranked.length - 1].score).toBe(0);
    });

    it("ranks Python job first when student has Python skills", () => {
      const studentSkills = ["Python", "FastAPI"];
      const ranked = rankJobListings(sampleListings, studentSkills);

      expect(ranked[0].id).toBe("job-py");
      expect(ranked[0].score).toBeGreaterThan(80);
      expect(ranked[0].matchedSkills).toContain("Python");
      expect(ranked[0].matchedSkills).toContain("FastAPI");
    });

    it("works cleanly when student skills list is empty", () => {
      const ranked = rankJobListings(sampleListings, []);
      expect(ranked).toHaveLength(sampleListings.length);
      ranked.forEach((job) => {
        expect(job.score).toBe(0);
        expect(job.matchedSkills).toHaveLength(0);
        expect(job.matchReason).toContain("No direct skill overlap");
      });
    });
  });
});
