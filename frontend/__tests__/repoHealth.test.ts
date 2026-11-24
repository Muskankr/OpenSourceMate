import {
  determineHealthStatus,
  getCachedHealth,
  setCachedHealth,
  clearHealthCache,
  getRepoHealth,
  MIN_SAMPLE_THRESHOLD,
  DEFAULT_HEALTH_CACHE_TTL_MS,
  type RepositoryHealthSignals,
} from "../utils/repoHealth";
import healthActiveJson from "../../fixtures/health/health_active.json";
import healthSlowJson from "../../fixtures/health/health_slow.json";
import healthInactiveJson from "../../fixtures/health/health_inactive.json";
import healthUnknownJson from "../../fixtures/health/health_unknown.json";

describe("repoHealth rules, sanitized fixtures, and caching (Issue #416)", () => {
  beforeEach(() => {
    clearHealthCache();
  });

  describe("Classification Rules & Thresholds", () => {
    it("returns 'Unknown' when sampleCount is below minimum threshold (3)", () => {
      // 0 samples
      const res0 = determineHealthStatus({
        repository: "test/repo-empty",
        sampleCount: 0,
        daysSinceLastCommit: 2,
        mergedPrShare: 0.8,
        medianResponseHours: 12.0,
      });
      expect(res0.status).toBe("Unknown");
      expect(res0.ruleExplanation).toContain("Fewer than 3 recent issues/PRs");
      expect(res0.tooltipText).toContain("Unknown: Insufficient recent activity data");

      // 1 sample (even with fast metrics)
      const res1 = determineHealthStatus({
        repository: "test/repo-1",
        sampleCount: 1,
        daysSinceLastCommit: 1,
        mergedPrShare: 1.0,
        medianResponseHours: 2.0,
      });
      expect(res1.status).toBe("Unknown");

      // 2 samples
      const res2 = determineHealthStatus({
        repository: "test/repo-2",
        sampleCount: 2,
        daysSinceLastCommit: 5,
        mergedPrShare: 0.5,
        medianResponseHours: 10.0,
      });
      expect(res2.status).toBe("Unknown");
      expect(res2.status).not.toBe("Active");
    });

    it("returns 'Unknown' when daysSinceLastCommit is null or undefined", () => {
      const res = determineHealthStatus({
        repository: "test/repo-no-commit",
        sampleCount: 10,
        daysSinceLastCommit: null,
        mergedPrShare: 0.8,
        medianResponseHours: 12.0,
      });
      expect(res.status).toBe("Unknown");
      expect(res.status).not.toBe("Active");
    });

    it("classifies active repositories: commit <= 30d, PR merge rate >= 50%, response <= 48h", () => {
      const res = determineHealthStatus({
        repository: "test/active-repo",
        sampleCount: 15,
        daysSinceLastCommit: 5,
        mergedPrShare: 0.75,
        medianResponseHours: 18.0,
      });
      expect(res.status).toBe("Active");
      expect(res.tooltipText).toContain("Active: Last commit 5d ago");
      expect(res.tooltipText).toContain("75% recent PRs merged");
      expect(res.ruleExplanation).toContain("<= 30d");
    });

    it("classifies slow repositories: commit <= 90d, PR merge rate >= 20%, response <= 168h", () => {
      const res = determineHealthStatus({
        repository: "test/slow-repo",
        sampleCount: 8,
        daysSinceLastCommit: 45,
        mergedPrShare: 0.35,
        medianResponseHours: 72.0,
      });
      expect(res.status).toBe("Slow");
      expect(res.tooltipText).toContain("Slow: Last commit 45d ago");
      expect(res.tooltipText).toContain("35% recent PRs merged");
      expect(res.ruleExplanation).toContain("slower pace");
    });

    it("classifies inactive repositories when commits > 90d or merge rate < 20%", () => {
      // Commits stalled > 90 days
      const resStalled = determineHealthStatus({
        repository: "test/stalled-repo",
        sampleCount: 10,
        daysSinceLastCommit: 120,
        mergedPrShare: 0.5,
        medianResponseHours: 24.0,
      });
      expect(resStalled.status).toBe("Inactive");
      expect(resStalled.tooltipText).toContain("Inactive: Last commit 120d ago");

      // Low merge rate and delayed response
      const resLowMerge = determineHealthStatus({
        repository: "test/low-merge-repo",
        sampleCount: 10,
        daysSinceLastCommit: 70,
        mergedPrShare: 0.05,
        medianResponseHours: 200.0,
      });
      expect(resLowMerge.status).toBe("Inactive");
    });
  });

  describe("Sanitized API Fixtures Integration", () => {
    it("evaluates Active sanitized fixture correctly", () => {
      // Fixture has 1 commit (2 days ago relative to test date), 3/4 merged PRs, 4 issues
      const mergedCount = healthActiveJson.pulls.filter((p) => p.merged_at !== null).length;
      const mergeRate = mergedCount / healthActiveJson.pulls.length;

      const result = determineHealthStatus({
        repository: healthActiveJson.repository,
        sampleCount: healthActiveJson.issues.length,
        daysSinceLastCommit: 2,
        mergedPrShare: mergeRate,
        medianResponseHours: 12.0,
      });

      expect(result.status).toBe("Active");
      expect(result.mergedPrShare).toBe(0.75);
      expect(result.sampleCount).toBe(4);
    });

    it("evaluates Slow sanitized fixture correctly", () => {
      const mergedCount = healthSlowJson.pulls.filter((p) => p.merged_at !== null).length;
      const mergeRate = mergedCount / healthSlowJson.pulls.length;

      const result = determineHealthStatus({
        repository: healthSlowJson.repository,
        sampleCount: healthSlowJson.issues.length,
        daysSinceLastCommit: 45,
        mergedPrShare: mergeRate,
        medianResponseHours: 96.0,
      });

      expect(result.status).toBe("Slow");
      expect(result.mergedPrShare).toBe(0.25);
    });

    it("evaluates Inactive sanitized fixture correctly", () => {
      const mergedCount = healthInactiveJson.pulls.filter((p) => p.merged_at !== null).length;
      const mergeRate = mergedCount / healthInactiveJson.pulls.length;

      const result = determineHealthStatus({
        repository: healthInactiveJson.repository,
        sampleCount: healthInactiveJson.issues.length,
        daysSinceLastCommit: 180,
        mergedPrShare: mergeRate,
        medianResponseHours: 240.0,
      });

      expect(result.status).toBe("Inactive");
      expect(result.daysSinceLastCommit).toBe(180);
    });

    it("evaluates Unknown sanitized fixture with 0 samples to 'Unknown', never 'Active'", () => {
      const result = determineHealthStatus({
        repository: healthUnknownJson.repository,
        sampleCount: healthUnknownJson.issues.length,
        daysSinceLastCommit: null,
        mergedPrShare: null,
        medianResponseHours: null,
      });

      expect(result.status).toBe("Unknown");
      expect(result.status).not.toBe("Active");
      expect(result.sampleCount).toBe(0);
    });
  });

  describe("Caching & Rate-Limit Preservation", () => {
    it("makes no extra API calls for repeat requests inside the cache window", async () => {
      const mockFetcher = jest.fn().mockResolvedValue({
        daysSinceLastCommit: 2,
        mergedPrShare: 0.8,
        medianResponseHours: 10.0,
        sampleCount: 15,
      });

      const firstResult = await getRepoHealth("test/cached-repo", {
        fetcher: mockFetcher,
        ttlMs: 60000,
      });
      expect(firstResult.status).toBe("Active");
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      const secondResult = await getRepoHealth("test/cached-repo", {
        fetcher: mockFetcher,
        ttlMs: 60000,
      });
      expect(secondResult.status).toBe("Active");
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Case-insensitive cache check
      const thirdResult = await getRepoHealth("TEST/CACHED-REPO", {
        fetcher: mockFetcher,
        ttlMs: 60000,
      });
      expect(thirdResult.status).toBe("Active");
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it("coalesces concurrent in-flight requests for the same repository", async () => {
      let resolvePromise: (value: RepositoryHealthSignals) => void;
      const delayedFetcher = jest.fn().mockImplementation(
        () =>
          new Promise<RepositoryHealthSignals>((resolve) => {
            resolvePromise = resolve;
          })
      );

      const p1 = getRepoHealth("test/concurrent-repo", {
        fetcher: delayedFetcher,
      });
      const p2 = getRepoHealth("test/concurrent-repo", {
        fetcher: delayedFetcher,
      });
      const p3 = getRepoHealth("test/concurrent-repo", {
        fetcher: delayedFetcher,
      });

      expect(delayedFetcher).toHaveBeenCalledTimes(1);

      resolvePromise!({
        daysSinceLastCommit: 4,
        mergedPrShare: 0.6,
        medianResponseHours: 12.0,
        sampleCount: 10,
      });

      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
      expect(r1.status).toBe("Active");
      expect(r2.status).toBe("Active");
      expect(r3.status).toBe("Active");
      expect(delayedFetcher).toHaveBeenCalledTimes(1);
    });

    it("fetches anew when the cache window expires", async () => {
      const mockFetcher = jest
        .fn()
        .mockResolvedValueOnce({
          daysSinceLastCommit: 2,
          mergedPrShare: 0.9,
          medianResponseHours: 5.0,
          sampleCount: 10,
        })
        .mockResolvedValueOnce({
          daysSinceLastCommit: 60,
          mergedPrShare: 0.3,
          medianResponseHours: 80.0,
          sampleCount: 10,
        });

      const initialTime = 1000000;
      jest.spyOn(Date, "now").mockReturnValue(initialTime);

      const res1 = await getRepoHealth("test/expiring-repo", {
        fetcher: mockFetcher,
        ttlMs: 5000,
      });
      expect(res1.status).toBe("Active");
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Advance time beyond TTL
      jest.spyOn(Date, "now").mockReturnValue(initialTime + 6000);

      const res2 = await getRepoHealth("test/expiring-repo", {
        fetcher: mockFetcher,
        ttlMs: 5000,
      });
      expect(res2.status).toBe("Slow");
      expect(mockFetcher).toHaveBeenCalledTimes(2);

      jest.restoreAllMocks();
    });
  });
});
