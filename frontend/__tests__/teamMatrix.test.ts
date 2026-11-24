import {
  parseTeamUsernames,
  computeTeamSkillMatrix,
  MAX_TEAM_MEMBERS,
} from "../utils/teamMatrix";
import type { TeamMemberState } from "../types/team";

describe("teamMatrix utility functions", () => {
  describe("parseTeamUsernames", () => {
    it("parses comma, space, and mixed separated usernames and strips @ prefix", () => {
      const input = "@octocat, torvalds   gaearon, @alice";
      expect(parseTeamUsernames(input)).toEqual([
        "octocat",
        "torvalds",
        "gaearon",
        "alice",
      ]);
    });

    it("deduplicates usernames case-insensitively while preserving first casing", () => {
      const input = "Octocat, octocat, OCTOCAT, Torvalds";
      expect(parseTeamUsernames(input)).toEqual(["Octocat", "Torvalds"]);
    });

    it("handles empty or whitespace-only inputs", () => {
      expect(parseTeamUsernames("")).toEqual([]);
      expect(parseTeamUsernames("   , ,  ")).toEqual([]);
    });

    it("identifies when usernames exceed MAX_TEAM_MEMBERS", () => {
      const input = "user1, user2, user3, user4, user5, user6";
      const parsed = parseTeamUsernames(input);
      expect(parsed.length).toBe(6);
      expect(parsed.length > MAX_TEAM_MEMBERS).toBe(true);
    });
  });

  describe("computeTeamSkillMatrix", () => {
    it("correctly computes shared skills, single-expert skills, and coverage counts", () => {
      const members: TeamMemberState[] = [
        {
          username: "alice",
          loading: false,
          error: null,
          skills: {
            username: "alice",
            total_repositories_analyzed: 5,
            skills: [
              { name: "TypeScript", repository_count: 4, percentage: 80 },
              { name: "Python", repository_count: 3, percentage: 60 },
              { name: "Rust", repository_count: 2, percentage: 40 },
            ],
          },
        },
        {
          username: "bob",
          loading: false,
          error: null,
          skills: {
            username: "bob",
            total_repositories_analyzed: 4,
            skills: [
              { name: "TypeScript", repository_count: 3, percentage: 75 },
              { name: "Go", repository_count: 2, percentage: 50 },
            ],
          },
        },
        {
          username: "charlie",
          loading: false,
          error: null,
          skills: {
            username: "charlie",
            total_repositories_analyzed: 3,
            skills: [
              { name: "TypeScript", repository_count: 2, percentage: 66 },
              { name: "Python", repository_count: 1, percentage: 33 },
            ],
          },
        },
      ];

      const summary = computeTeamSkillMatrix(members);

      expect(summary.analyzedUsers).toEqual(["alice", "bob", "charlie"]);
      expect(summary.failedUsers).toEqual([]);
      expect(summary.totalDistinctSkills).toBe(4); // TypeScript, Python, Rust, Go

      // TypeScript should be top row with coverage of 3
      const tsRow = summary.skillsMatrix.find((r) => r.skillName === "TypeScript");
      expect(tsRow).toBeDefined();
      expect(tsRow?.coveredByCount).toBe(3);
      expect(tsRow?.coveredByUsers).toEqual(["alice", "bob", "charlie"]);
      expect(tsRow?.isSingleExpert).toBe(false);

      // Python should have coverage of 2 (alice and charlie)
      const pyRow = summary.skillsMatrix.find((r) => r.skillName === "Python");
      expect(pyRow).toBeDefined();
      expect(pyRow?.coveredByCount).toBe(2);
      expect(pyRow?.coveredByUsers).toEqual(["alice", "charlie"]);
      expect(pyRow?.isSingleExpert).toBe(false);

      // Single expert skills: Rust (alice only) and Go (bob only)
      expect(summary.singleExpertSkills.length).toBe(2);
      const rustRow = summary.singleExpertSkills.find((r) => r.skillName === "Rust");
      expect(rustRow).toBeDefined();
      expect(rustRow?.isSingleExpert).toBe(true);
      expect(rustRow?.singleExpertUsername).toBe("alice");

      const goRow = summary.singleExpertSkills.find((r) => r.skillName === "Go");
      expect(goRow).toBeDefined();
      expect(goRow?.isSingleExpert).toBe(true);
      expect(goRow?.singleExpertUsername).toBe("bob");
    });

    it("handles partial failures per user without blocking the whole matrix", () => {
      const members: TeamMemberState[] = [
        {
          username: "alice",
          loading: false,
          error: null,
          skills: {
            username: "alice",
            total_repositories_analyzed: 2,
            skills: [{ name: "Python", repository_count: 2, percentage: 100 }],
          },
        },
        {
          username: "ghost-user",
          loading: false,
          error: "GitHub user not found",
          skills: null,
        },
        {
          username: "rate-limited-user",
          loading: false,
          error: "GitHub API rate limit reached",
          skills: null,
        },
      ];

      const summary = computeTeamSkillMatrix(members);

      // Successfully analyzed users
      expect(summary.analyzedUsers).toEqual(["alice"]);

      // Failed users tracked separately
      expect(summary.failedUsers).toEqual([
        { username: "ghost-user", error: "GitHub user not found" },
        { username: "rate-limited-user", error: "GitHub API rate limit reached" },
      ]);

      // Matrix still builds cleanly from alice's data
      expect(summary.totalDistinctSkills).toBe(1);
      expect(summary.skillsMatrix[0].skillName).toBe("Python");
      expect(summary.skillsMatrix[0].coveredByCount).toBe(1);
      expect(summary.skillsMatrix[0].isSingleExpert).toBe(true);
      expect(summary.skillsMatrix[0].singleExpertUsername).toBe("alice");
    });
  });
});
