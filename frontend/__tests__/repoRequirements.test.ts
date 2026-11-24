import {
  getCachedRequirements,
  setCachedRequirements,
  clearRequirementsCache,
  getRepoRequirements,
  DEFAULT_UNKNOWN_REQUIREMENTS,
  type ContributionRequirementsResult,
} from "../utils/repoRequirements";
import reqAllJson from "../../fixtures/requirements/requirements_all.json";
import reqSomeJson from "../../fixtures/requirements/requirements_some.json";
import reqNoneJson from "../../fixtures/requirements/requirements_none.json";

describe("repoRequirements detection, caching, and fixtures (Issue #417)", () => {
  beforeEach(() => {
    clearRequirementsCache();
  });

  describe("Sanitized API Fixtures Integration", () => {
    it("handles repository with ALL requirements present", async () => {
      const mockResult: ContributionRequirementsResult = {
        repository: reqAllJson.repository,
        contributing: {
          detected: true,
          name: "Contributing Guide",
          url: reqAllJson.community_profile.files.contributing.html_url,
          status: "present",
        },
        code_of_conduct: {
          detected: true,
          name: reqAllJson.community_profile.files.code_of_conduct.name,
          url: reqAllJson.community_profile.files.code_of_conduct.html_url,
          status: "present",
        },
        license: {
          detected: true,
          name: reqAllJson.community_profile.files.license.spdx_id,
          url: reqAllJson.community_profile.files.license.html_url,
          status: "present",
        },
        cla_dco: {
          detected: true,
          type: "CLA",
          name: "CLA Required",
          url: reqAllJson.contents.find((c) => c.name === "CLA.md")!.html_url,
          status: "present",
        },
      };

      const result = await getRepoRequirements(reqAllJson.repository, {
        fetcher: async () => mockResult,
      });

      expect(result.contributing.detected).toBe(true);
      expect(result.contributing.url).toContain("CONTRIBUTING.md");
      expect(result.code_of_conduct.detected).toBe(true);
      expect(result.code_of_conduct.url).toContain("CODE_OF_CONDUCT.md");
      expect(result.license.detected).toBe(true);
      expect(result.license.name).toBe("MIT");
      expect(result.cla_dco.detected).toBe(true);
      expect(result.cla_dco.type).toBe("CLA");
    });

    it("handles repository with SOME requirements present (missing show 'unknown', not 'none')", async () => {
      const mockResult: ContributionRequirementsResult = {
        repository: reqSomeJson.repository,
        contributing: {
          detected: true,
          name: "Contributing Guide",
          url: reqSomeJson.community_profile.files.contributing.html_url,
          status: "present",
        },
        code_of_conduct: {
          detected: false,
          name: null,
          url: null,
          status: "unknown",
        },
        license: {
          detected: true,
          name: reqSomeJson.community_profile.files.license.spdx_id,
          url: reqSomeJson.community_profile.files.license.html_url,
          status: "present",
        },
        cla_dco: {
          detected: false,
          name: null,
          url: null,
          status: "unknown",
        },
      };

      const result = await getRepoRequirements(reqSomeJson.repository, {
        fetcher: async () => mockResult,
      });

      // Present items
      expect(result.contributing.detected).toBe(true);
      expect(result.license.detected).toBe(true);

      // Missing items strictly show 'unknown' rather than 'none'
      expect(result.code_of_conduct.detected).toBe(false);
      expect(result.code_of_conduct.status).toBe("unknown");
      expect(result.code_of_conduct.status).not.toBe("none");

      expect(result.cla_dco.detected).toBe(false);
      expect(result.cla_dco.status).toBe("unknown");
      expect(result.cla_dco.status).not.toBe("none");
    });

    it("handles repository with NONE of the requirements present (all show 'unknown')", async () => {
      const mockResult: ContributionRequirementsResult = DEFAULT_UNKNOWN_REQUIREMENTS(
        reqNoneJson.repository
      );

      const result = await getRepoRequirements(reqNoneJson.repository, {
        fetcher: async () => mockResult,
      });

      // Acceptance criterion: Missing information shows 'unknown' rather than 'none'
      expect(result.contributing.status).toBe("unknown");
      expect(result.code_of_conduct.status).toBe("unknown");
      expect(result.license.status).toBe("unknown");
      expect(result.cla_dco.status).toBe("unknown");

      expect(result.contributing.status).not.toBe("none");
      expect(result.code_of_conduct.status).not.toBe("none");
      expect(result.license.status).not.toBe("none");
      expect(result.cla_dco.status).not.toBe("none");
    });
  });

  describe("Caching and Rate Limit Safety", () => {
    it("returns cached requirements on repeat queries without extra calls", async () => {
      const mockFetcher = jest.fn().mockResolvedValue({
        repository: "cached/repo",
        contributing: { detected: true, name: "Contributing", url: "https://...", status: "present" },
        code_of_conduct: { detected: false, name: null, url: null, status: "unknown" },
        license: { detected: true, name: "MIT", url: "https://...", status: "present" },
        cla_dco: { detected: false, name: null, url: null, status: "unknown" },
      });

      const res1 = await getRepoRequirements("cached/repo", { fetcher: mockFetcher });
      expect(res1.contributing.detected).toBe(true);
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      const res2 = await getRepoRequirements("cached/repo", { fetcher: mockFetcher });
      expect(res2.contributing.detected).toBe(true);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it("coalesces concurrent requests for the same repository", async () => {
      let resolvePromise: (val: ContributionRequirementsResult) => void;
      const delayedFetcher = jest.fn().mockImplementation(
        () =>
          new Promise<ContributionRequirementsResult>((resolve) => {
            resolvePromise = resolve;
          })
      );

      const p1 = getRepoRequirements("test/concurrent", { fetcher: delayedFetcher });
      const p2 = getRepoRequirements("test/concurrent", { fetcher: delayedFetcher });

      expect(delayedFetcher).toHaveBeenCalledTimes(1);

      resolvePromise!({
        repository: "test/concurrent",
        contributing: { detected: true, name: "Contributing", url: "https://...", status: "present" },
        code_of_conduct: { detected: false, name: null, url: null, status: "unknown" },
        license: { detected: false, name: null, url: null, status: "unknown" },
        cla_dco: { detected: false, name: null, url: null, status: "unknown" },
      });

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.contributing.detected).toBe(true);
      expect(r2.contributing.detected).toBe(true);
      expect(delayedFetcher).toHaveBeenCalledTimes(1);
    });
  });
});
