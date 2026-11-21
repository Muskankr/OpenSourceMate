import {
  calculateFriendlinessScore,
  getCachedFriendlinessScore,
  setCachedFriendlinessScore,
  clearFriendlinessCache,
  getRepoFriendliness,
  DEFAULT_FRIENDLINESS_CACHE_TTL_MS,
  KNOWN_REPO_FRIENDLINESS,
  type FriendlinessSignals,
} from "../utils/repoFriendliness";

describe("repoFriendliness scoring, determinism, and caching", () => {
  beforeEach(() => {
    clearFriendlinessCache();
  });

  describe("Deterministic Scoring (Acceptance Criterion 1)", () => {
    it("always produces the exact same score, tier, and breakdown for identical inputs", () => {
      const signals: FriendlinessSignals = {
        hasContributing: true,
        hasCodeOfConduct: true,
        hasIssueTemplates: true,
        readmeLength: 3200,
        recentMergedPrs: 12,
      };

      const run1 = calculateFriendlinessScore("facebook/react", signals);
      const run2 = calculateFriendlinessScore("facebook/react", signals);
      const run3 = calculateFriendlinessScore("facebook/react", signals);

      expect(run1.score).toBe(run2.score);
      expect(run2.score).toBe(run3.score);
      expect(run1.tier).toBe(run2.tier);
      expect(run1.tier).toBe("Very Welcoming");
      expect(run1.score).toBe(100);

      // Verify each breakdown item is identical
      expect(run1.breakdown).toEqual(run2.breakdown);
      expect(run2.breakdown).toEqual(run3.breakdown);
    });

    it("evaluates known repositories deterministically", () => {
      Object.entries(KNOWN_REPO_FRIENDLINESS).forEach(([repo, signals]) => {
        const first = calculateFriendlinessScore(repo, signals);
        const second = calculateFriendlinessScore(repo, signals);

        expect(first.score).toBe(second.score);
        expect(first.tier).toBe(second.tier);
        expect(first.breakdown.map((b) => b.points)).toEqual(second.breakdown.map((b) => b.points));
      });
    });
  });

  describe("Missing Signals Handling (Acceptance Criterion 2)", () => {
    it("handles undefined signals object without throwing errors", () => {
      expect(() => calculateFriendlinessScore("test/empty-repo", undefined)).not.toThrow();
      const res = calculateFriendlinessScore("test/empty-repo", undefined);
      expect(res.score).toBe(0);
      expect(res.tier).toBe("Challenging");
      expect(res.breakdown).toHaveLength(5);
      expect(res.breakdown.every((b) => b.points === 0 && !b.passed)).toBe(true);
    });

    it("handles null signals object without throwing errors", () => {
      expect(() => calculateFriendlinessScore("test/null-repo", null)).not.toThrow();
      const res = calculateFriendlinessScore("test/null-repo", null);
      expect(res.score).toBe(0);
      expect(res.tier).toBe("Challenging");
    });

    it("handles empty signals object without throwing errors", () => {
      expect(() => calculateFriendlinessScore("test/blank-repo", {})).not.toThrow();
      const res = calculateFriendlinessScore("test/blank-repo", {});
      expect(res.score).toBe(0);
      expect(res.tier).toBe("Challenging");
    });

    it("handles null/undefined signal properties safely", () => {
      const partialSignals: FriendlinessSignals = {
        hasContributing: null,
        hasCodeOfConduct: undefined,
        hasIssueTemplates: null,
        readmeLength: null,
        recentMergedPrs: undefined,
      };

      expect(() => calculateFriendlinessScore("test/partial-repo", partialSignals)).not.toThrow();
      const res = calculateFriendlinessScore("test/partial-repo", partialSignals);
      expect(res.score).toBe(0);
      expect(res.tier).toBe("Challenging");
    });

    it("handles negative and NaN numeric values gracefully by clamping to 0", () => {
      const invalidSignals: FriendlinessSignals = {
        readmeLength: -500,
        recentMergedPrs: -10,
      };

      const res = calculateFriendlinessScore("test/invalid-numbers", invalidSignals);
      expect(res.score).toBe(0);
      const readmeItem = res.breakdown.find((b) => b.id === "readme_length");
      expect(readmeItem?.points).toBe(0);
      const prItem = res.breakdown.find((b) => b.id === "recent_merged_prs");
      expect(prItem?.points).toBe(0);
    });
  });

  describe("Scoring Function Coverage & Brackets (Acceptance Criterion 3)", () => {
    it("awards 25 points for CONTRIBUTING guide when present, 0 when missing", () => {
      const withGuide = calculateFriendlinessScore("test/repo", { hasContributing: true });
      const withoutGuide = calculateFriendlinessScore("test/repo", { hasContributing: false });

      const guideWith = withGuide.breakdown.find((b) => b.id === "contributing");
      const guideWithout = withoutGuide.breakdown.find((b) => b.id === "contributing");

      expect(guideWith?.points).toBe(25);
      expect(guideWith?.passed).toBe(true);
      expect(guideWithout?.points).toBe(0);
      expect(guideWithout?.passed).toBe(false);
    });

    it("awards 20 points for Code of Conduct when present, 0 when missing", () => {
      const withCoc = calculateFriendlinessScore("test/repo", { hasCodeOfConduct: true });
      const withoutCoc = calculateFriendlinessScore("test/repo", { hasCodeOfConduct: false });

      const cocWith = withCoc.breakdown.find((b) => b.id === "code_of_conduct");
      const cocWithout = withoutCoc.breakdown.find((b) => b.id === "code_of_conduct");

      expect(cocWith?.points).toBe(20);
      expect(cocWith?.passed).toBe(true);
      expect(cocWithout?.points).toBe(0);
      expect(cocWithout?.passed).toBe(false);
    });

    it("awards 15 points for Issue & PR templates when configured, 0 when missing", () => {
      const withTemplates = calculateFriendlinessScore("test/repo", { hasIssueTemplates: true });
      const withoutTemplates = calculateFriendlinessScore("test/repo", {
        hasIssueTemplates: false,
      });

      const tplWith = withTemplates.breakdown.find((b) => b.id === "issue_templates");
      const tplWithout = withoutTemplates.breakdown.find((b) => b.id === "issue_templates");

      expect(tplWith?.points).toBe(15);
      expect(tplWith?.passed).toBe(true);
      expect(tplWithout?.points).toBe(0);
      expect(tplWithout?.passed).toBe(false);
    });

    describe("README Length Brackets", () => {
      it("awards 20 points for comprehensive README (>= 2500 chars)", () => {
        const res2500 = calculateFriendlinessScore("test/repo", { readmeLength: 2500 });
        const res5000 = calculateFriendlinessScore("test/repo", { readmeLength: 5000 });

        expect(res2500.breakdown.find((b) => b.id === "readme_length")?.points).toBe(20);
        expect(res5000.breakdown.find((b) => b.id === "readme_length")?.points).toBe(20);
      });

      it("awards 12 points for standard README (800 - 2499 chars)", () => {
        const res800 = calculateFriendlinessScore("test/repo", { readmeLength: 800 });
        const res2499 = calculateFriendlinessScore("test/repo", { readmeLength: 2499 });

        expect(res800.breakdown.find((b) => b.id === "readme_length")?.points).toBe(12);
        expect(res2499.breakdown.find((b) => b.id === "readme_length")?.points).toBe(12);
      });

      it("awards 6 points for brief README (1 - 799 chars)", () => {
        const res1 = calculateFriendlinessScore("test/repo", { readmeLength: 1 });
        const res799 = calculateFriendlinessScore("test/repo", { readmeLength: 799 });

        expect(res1.breakdown.find((b) => b.id === "readme_length")?.points).toBe(6);
        expect(res799.breakdown.find((b) => b.id === "readme_length")?.points).toBe(6);
      });

      it("awards 0 points for missing or 0 chars README", () => {
        const res0 = calculateFriendlinessScore("test/repo", { readmeLength: 0 });
        expect(res0.breakdown.find((b) => b.id === "readme_length")?.points).toBe(0);
      });
    });

    describe("Recent Merged PRs Brackets", () => {
      it("awards 20 points for high merge activity (>= 5 merged PRs)", () => {
        const res5 = calculateFriendlinessScore("test/repo", { recentMergedPrs: 5 });
        const res25 = calculateFriendlinessScore("test/repo", { recentMergedPrs: 25 });

        expect(res5.breakdown.find((b) => b.id === "recent_merged_prs")?.points).toBe(20);
        expect(res25.breakdown.find((b) => b.id === "recent_merged_prs")?.points).toBe(20);
      });

      it("awards 12 points for moderate merge activity (1 - 4 merged PRs)", () => {
        const res1 = calculateFriendlinessScore("test/repo", { recentMergedPrs: 1 });
        const res4 = calculateFriendlinessScore("test/repo", { recentMergedPrs: 4 });

        expect(res1.breakdown.find((b) => b.id === "recent_merged_prs")?.points).toBe(12);
        expect(res4.breakdown.find((b) => b.id === "recent_merged_prs")?.points).toBe(12);
      });

      it("awards 0 points for 0 merged PRs", () => {
        const res0 = calculateFriendlinessScore("test/repo", { recentMergedPrs: 0 });
        expect(res0.breakdown.find((b) => b.id === "recent_merged_prs")?.points).toBe(0);
      });
    });

    describe("Friendliness Tier Thresholds", () => {
      it("classifies score >= 80 as 'Very Welcoming'", () => {
        // Exactly 80: 25 + 20 + 15 + 20 + 0 = 80
        const res80 = calculateFriendlinessScore("test/tier-80", {
          hasContributing: true,
          hasCodeOfConduct: true,
          hasIssueTemplates: true,
          readmeLength: 3000,
          recentMergedPrs: 0,
        });
        expect(res80.score).toBe(80);
        expect(res80.tier).toBe("Very Welcoming");

        // 100 max score
        const res100 = calculateFriendlinessScore("test/tier-100", {
          hasContributing: true,
          hasCodeOfConduct: true,
          hasIssueTemplates: true,
          readmeLength: 3000,
          recentMergedPrs: 10,
        });
        expect(res100.score).toBe(100);
        expect(res100.tier).toBe("Very Welcoming");
      });

      it("classifies score 60 - 79 as 'Welcoming'", () => {
        // Exactly 60: 25 + 20 + 15 + 0 + 0 = 60
        const res60 = calculateFriendlinessScore("test/tier-60", {
          hasContributing: true,
          hasCodeOfConduct: true,
          hasIssueTemplates: true,
          readmeLength: 0,
          recentMergedPrs: 0,
        });
        expect(res60.score).toBe(60);
        expect(res60.tier).toBe("Welcoming");

        // 72: 25 + 15 + 20 (readme) + 12 (prs) = 72
        const res72 = calculateFriendlinessScore("test/tier-72", {
          hasContributing: true,
          hasCodeOfConduct: false,
          hasIssueTemplates: true,
          readmeLength: 3000,
          recentMergedPrs: 3,
        });
        expect(res72.score).toBe(72);
        expect(res72.tier).toBe("Welcoming");
      });

      it("classifies score 40 - 59 as 'Moderate'", () => {
        // Exactly 40: 20 (coc) + 20 (readme) = 40
        const res40 = calculateFriendlinessScore("test/tier-40", {
          hasContributing: false,
          hasCodeOfConduct: true,
          hasIssueTemplates: false,
          readmeLength: 3000,
          recentMergedPrs: 0,
        });
        expect(res40.score).toBe(40);
        expect(res40.tier).toBe("Moderate");

        // 57: 25 (contrib) + 20 (readme) + 12 (prs) = 57
        const res57 = calculateFriendlinessScore("test/tier-57", {
          hasContributing: true,
          hasCodeOfConduct: false,
          hasIssueTemplates: false,
          readmeLength: 3000,
          recentMergedPrs: 2,
        });
        expect(res57.score).toBe(57);
        expect(res57.tier).toBe("Moderate");
      });

      it("classifies score < 40 as 'Challenging'", () => {
        // 38: 20 (readme) + 12 (prs) + 6 (contrib? no, 0) = 32
        const res32 = calculateFriendlinessScore("test/tier-32", {
          hasContributing: false,
          hasCodeOfConduct: false,
          hasIssueTemplates: false,
          readmeLength: 2600,
          recentMergedPrs: 2,
        });
        expect(res32.score).toBe(32);
        expect(res32.tier).toBe("Challenging");

        // 0:
        const res0 = calculateFriendlinessScore("test/tier-0", {});
        expect(res0.score).toBe(0);
        expect(res0.tier).toBe("Challenging");
      });
    });
  });

  describe("Caching and Rate Limit Protection", () => {
    it("returns null on cache miss", () => {
      const cached = getCachedFriendlinessScore("unknown/uncached-repo");
      expect(cached).toBeNull();
    });

    it("retrieves cached result within TTL window", () => {
      const result = calculateFriendlinessScore("octocat/hello-world", {
        hasContributing: true,
        hasCodeOfConduct: true,
        hasIssueTemplates: true,
        readmeLength: 3000,
        recentMergedPrs: 10,
      });

      setCachedFriendlinessScore("octocat/hello-world", result);

      const cached = getCachedFriendlinessScore("octocat/hello-world");
      expect(cached).not.toBeNull();
      expect(cached?.score).toBe(100);
      expect(cached?.tier).toBe("Very Welcoming");
    });

    it("expires cache after TTL window has elapsed", () => {
      const result = calculateFriendlinessScore("octocat/expiring-repo", {
        hasContributing: true,
      });

      const oldTimestamp = Date.now() - (DEFAULT_FRIENDLINESS_CACHE_TTL_MS + 1000);
      setCachedFriendlinessScore("octocat/expiring-repo", result, oldTimestamp);

      const cached = getCachedFriendlinessScore("octocat/expiring-repo");
      expect(cached).toBeNull();
    });

    it("normalizes repository keys case-insensitively for caching", () => {
      const result = calculateFriendlinessScore("Facebook/React", {
        hasContributing: true,
        hasCodeOfConduct: true,
      });

      setCachedFriendlinessScore("Facebook/React", result);

      const cachedLower = getCachedFriendlinessScore("facebook/react");
      const cachedUpper = getCachedFriendlinessScore("FACEBOOK/REACT ");

      expect(cachedLower).not.toBeNull();
      expect(cachedUpper).not.toBeNull();
      expect(cachedLower?.score).toBe(cachedUpper?.score);
    });

    it("resolves known repositories offline via getRepoFriendliness", async () => {
      const result = await getRepoFriendliness("vercel/next.js");
      expect(result).toBeDefined();
      expect(result.repository).toBe("vercel/next.js");
      expect(result.score).toBe(100);
      expect(result.tier).toBe("Very Welcoming");
    });
  });
});
