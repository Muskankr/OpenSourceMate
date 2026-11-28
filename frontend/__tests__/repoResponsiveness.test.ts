import {
  determineResponsiveness,
  getCachedResponsiveness,
  setCachedResponsiveness,
  clearResponsivenessCache,
  getRepoResponsiveness,
  MIN_SAMPLE_THRESHOLD,
  DEFAULT_CACHE_TTL_MS,
  type RepositoryActivityData,
} from "../utils/repoResponsiveness";

describe("repoResponsiveness rules and caching", () => {
  beforeEach(() => {
    clearResponsivenessCache();
  });

  describe("Classification Rules", () => {
    it("returns 'Not enough data' when sampleCount is below minimum threshold (3)", () => {
      // 0 samples
      const res0 = determineResponsiveness({
        repository: "test/repo-empty",
        sampleCount: 0,
        medianResponseHours: null,
      });
      expect(res0.rating).toBe("Not enough data");
      expect(res0.ruleExplanation).toContain("Fewer than 3 recent issues");
      expect(res0.tooltipText).toContain("Not enough data");

      // 1 sample (even with fast response time)
      const res1 = determineResponsiveness({
        repository: "test/repo-1",
        sampleCount: 1,
        medianResponseHours: 2.0,
      });
      expect(res1.rating).toBe("Not enough data");

      // 2 samples
      const res2 = determineResponsiveness({
        repository: "test/repo-2",
        sampleCount: 2,
        medianResponseHours: 5.0,
      });
      expect(res2.rating).toBe("Not enough data");
    });

    it("returns 'Not enough data' when medianResponseHours is null or undefined", () => {
      const res = determineResponsiveness({
        repository: "test/repo-null",
        sampleCount: 10,
        medianResponseHours: null,
      });
      expect(res.rating).toBe("Not enough data");
    });

    it("classifies response time <= 24h as 'Fast'", () => {
      // 12 hours
      const res12 = determineResponsiveness({
        repository: "test/fast-repo",
        sampleCount: 5,
        medianResponseHours: 12.0,
      });
      expect(res12.rating).toBe("Fast");
      expect(res12.tooltipText).toContain("Fast");
      expect(res12.ruleExplanation).toContain("24 hours or less");

      // Exactly 24.0 hours (boundary test)
      const res24 = determineResponsiveness({
        repository: "test/boundary-24",
        sampleCount: 4,
        medianResponseHours: 24.0,
      });
      expect(res24.rating).toBe("Fast");
    });

    it("classifies response time > 24h and <= 72h as 'Moderate'", () => {
      // 24.5 hours
      const res25 = determineResponsiveness({
        repository: "test/moderate-repo",
        sampleCount: 6,
        medianResponseHours: 24.5,
      });
      expect(res25.rating).toBe("Moderate");
      expect(res25.tooltipText).toContain("Moderate");
      expect(res25.ruleExplanation).toContain("between 24 and 72 hours");

      // Exactly 72.0 hours (boundary test)
      const res72 = determineResponsiveness({
        repository: "test/boundary-72",
        sampleCount: 3,
        medianResponseHours: 72.0,
      });
      expect(res72.rating).toBe("Moderate");
    });

    it("classifies response time > 72h as 'Slow'", () => {
      // 72.5 hours
      const res73 = determineResponsiveness({
        repository: "test/slow-repo",
        sampleCount: 5,
        medianResponseHours: 72.5,
      });
      expect(res73.rating).toBe("Slow");
      expect(res73.tooltipText).toContain("Slow");
      expect(res73.ruleExplanation).toContain("exceeds 72 hours");

      // 120 hours (5 days)
      const res120 = determineResponsiveness({
        repository: "test/very-slow",
        sampleCount: 8,
        medianResponseHours: 120.0,
      });
      expect(res120.rating).toBe("Slow");
    });
  });

  describe("Caching and Rate-Limit Protection", () => {
    it("makes no extra API calls for repeat requests inside the cache window", async () => {
      const mockFetcher = jest.fn().mockResolvedValue({
        repository: "test/cached-repo",
        medianResponseHours: 10.0,
        sampleCount: 5,
      });

      // 1. First call: invokes fetcher
      const firstResult = await getRepoResponsiveness("test/cached-repo", {
        fetcher: mockFetcher,
      });
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(firstResult.rating).toBe("Fast");

      // 2. Repeat call inside the cache window: returns cached result immediately
      const secondResult = await getRepoResponsiveness("test/cached-repo", {
        fetcher: mockFetcher,
      });
      expect(mockFetcher).toHaveBeenCalledTimes(1); // STILL 1! No extra API call
      expect(secondResult.rating).toBe("Fast");

      // 3. Third repeat call with different casing: returns cached result
      const thirdResult = await getRepoResponsiveness("TEST/CACHED-REPO", {
        fetcher: mockFetcher,
      });
      expect(mockFetcher).toHaveBeenCalledTimes(1); // STILL 1!
      expect(thirdResult.rating).toBe("Fast");
    });

    it("coalesces concurrent in-flight requests for the same repository", async () => {
      let resolvePromise: (value: RepositoryActivityData) => void;
      const delayedPromise = new Promise<RepositoryActivityData>((resolve) => {
        resolvePromise = resolve;
      });

      const mockFetcher = jest.fn().mockReturnValue(delayedPromise);

      // Launch 3 concurrent calls for the same repo before the first resolves
      const p1 = getRepoResponsiveness("test/concurrent-repo", {
        fetcher: mockFetcher,
      });
      const p2 = getRepoResponsiveness("test/concurrent-repo", {
        fetcher: mockFetcher,
      });
      const p3 = getRepoResponsiveness("test/concurrent-repo", {
        fetcher: mockFetcher,
      });

      // Resolve the single fetcher call
      resolvePromise!({
        repository: "test/concurrent-repo",
        medianResponseHours: 40.0,
        sampleCount: 6,
      });

      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

      // All 3 callers receive the result, but fetcher was called only once
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(r1.rating).toBe("Moderate");
      expect(r2.rating).toBe("Moderate");
      expect(r3.rating).toBe("Moderate");
    });

    it("fetches anew when the cache window expires", async () => {
      const mockFetcher = jest.fn().mockResolvedValue({
        repository: "test/expiring-repo",
        medianResponseHours: 15.0,
        sampleCount: 4,
      });

      // Set a short TTL of 50ms for testing
      const shortTtl = 50;

      await getRepoResponsiveness("test/expiring-repo", {
        fetcher: mockFetcher,
        ttlMs: shortTtl,
      });
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Manually simulate expired timestamp in cache
      const cached = getCachedResponsiveness("test/expiring-repo", shortTtl);
      expect(cached).toBeDefined();

      // Clear or artificially expire
      setCachedResponsiveness(
        "test/expiring-repo",
        cached!,
        Date.now() - 1000 // 1 second ago (well past 50ms TTL)
      );

      // Call again: should trigger a new API call
      await getRepoResponsiveness("test/expiring-repo", {
        fetcher: mockFetcher,
        ttlMs: shortTtl,
      });
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it("invokes separate API calls for distinct repositories", async () => {
      const mockFetcher = jest.fn().mockImplementation(async (repo: string) => ({
        repository: repo,
        medianResponseHours: 10.0,
        sampleCount: 5,
      }));

      await getRepoResponsiveness("repo/alpha", { fetcher: mockFetcher });
      await getRepoResponsiveness("repo/beta", { fetcher: mockFetcher });

      expect(mockFetcher).toHaveBeenCalledTimes(2);
      expect(mockFetcher).toHaveBeenCalledWith("repo/alpha");
      expect(mockFetcher).toHaveBeenCalledWith("repo/beta");
    });
  });
});
