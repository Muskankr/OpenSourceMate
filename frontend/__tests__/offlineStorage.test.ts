import {
  saveLastAnalysisResult,
  getLastAnalysisResult,
  clearLastAnalysisResult,
  formatFetchedAt,
  formatRelativeTime,
  LAST_ANALYSIS_STORAGE_KEY,
  type CachedAnalysisData,
} from "../utils/offlineStorage";
import type { GitHubUserProfile, UserSkillsResponse, IssueRecommendation } from "../types/api";

describe("Offline Storage Utilities (utils/offlineStorage.ts)", () => {
  const mockProfile: GitHubUserProfile = {
    username: "octocat",
    name: "The Octocat",
    bio: "GitHub mascot",
    avatar_url: "https://github.com/images/error/octocat_happy.gif",
    profile_url: "https://github.com/octocat",
    public_repositories: 8,
    followers: 1200,
    following: 0,
    created_at: "2011-01-25T18:44:36Z",
    updated_at: "2026-11-20T10:00:00Z",
    location: "San Francisco",
    company: "@github",
    blog: "https://github.blog",
    twitter_username: "github",
    total_stars: 4200,
    contributions_last_year: 365,
  };

  const mockSkills: UserSkillsResponse = {
    username: "octocat",
    skills: [
      { name: "TypeScript", count: 10, percentage: 60 },
      { name: "React", count: 6, percentage: 40 },
    ],
    total_repositories_analyzed: 8,
    analyzed_at: "2026-11-26T12:00:00Z",
  };

  const mockRecommendations: IssueRecommendation[] = [
    {
      title: "Add offline caching for service workers",
      url: "https://github.com/org/repo/issues/101",
      repository: "org/repo",
      labels: ["enhancement", "good first issue"],
      skills: ["TypeScript", "ServiceWorker"],
      match_score: 95,
      score: 95,
      match_reasons: ["Matches TypeScript"],
    },
  ];

  const mockCachedData: CachedAnalysisData = {
    username: "octocat",
    profile: mockProfile,
    skills: mockSkills,
    recommendations: mockRecommendations,
    fetchedAt: "2026-11-26T12:00:00.000Z",
  };

  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  describe("saveLastAnalysisResult and getLastAnalysisResult", () => {
    it("successfully saves and retrieves the last analysis result", () => {
      saveLastAnalysisResult(mockCachedData);

      const retrieved = getLastAnalysisResult();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.username).toBe("octocat");
      expect(retrieved?.profile.name).toBe("The Octocat");
      expect(retrieved?.skills.skills).toHaveLength(2);
      expect(retrieved?.recommendations).toHaveLength(1);
      expect(retrieved?.fetchedAt).toBe("2026-11-26T12:00:00.000Z");
    });

    it("returns null when localStorage is empty", () => {
      expect(getLastAnalysisResult()).toBeNull();
    });

    it("gracefully returns null if localStorage contains malformed JSON", () => {
      window.localStorage.setItem(LAST_ANALYSIS_STORAGE_KEY, "{bad json");
      expect(getLastAnalysisResult()).toBeNull();
    });

    it("returns null if parsed data is not a valid object or missing required fields", () => {
      window.localStorage.setItem(
        LAST_ANALYSIS_STORAGE_KEY,
        JSON.stringify({ username: "octocat" }) // missing profile, skills, etc.
      );
      expect(getLastAnalysisResult()).toBeNull();
    });

    it("clears cached data with clearLastAnalysisResult", () => {
      saveLastAnalysisResult(mockCachedData);
      expect(getLastAnalysisResult()).not.toBeNull();

      clearLastAnalysisResult();
      expect(getLastAnalysisResult()).toBeNull();
      expect(window.localStorage.getItem(LAST_ANALYSIS_STORAGE_KEY)).toBeNull();
    });

    it("handles storage exceptions gracefully when localStorage throws", () => {
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => saveLastAnalysisResult(mockCachedData)).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe("formatFetchedAt", () => {
    it("formats ISO timestamps into legible date strings", () => {
      const formatted = formatFetchedAt("2026-11-26T12:30:00.000Z");
      expect(formatted).toContain("Nov");
      expect(formatted).toContain("26");
      expect(formatted).toContain("2026");
    });

    it("handles invalid date strings gracefully", () => {
      expect(formatFetchedAt("not-a-date")).toBe("recently");
    });
  });

  describe("formatRelativeTime", () => {
    const base = new Date("2026-11-26T12:00:00.000Z");

    it("returns 'just now' for dates less than 1 minute ago", () => {
      const justNow = new Date(base.getTime() - 30 * 1000).toISOString();
      expect(formatRelativeTime(justNow, base)).toBe("just now");
    });

    it("returns minutes ago for dates within an hour", () => {
      const fiveMinsAgo = new Date(base.getTime() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinsAgo, base)).toBe("5m ago");
    });

    it("returns hours ago for dates within 24 hours", () => {
      const twoHoursAgo = new Date(base.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo, base)).toBe("2h ago");
    });

    it("returns 'yesterday' for dates 1 day ago", () => {
      const oneDayAgo = new Date(base.getTime() - 25 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(oneDayAgo, base)).toBe("yesterday");
    });

    it("returns days ago for dates within 7 days", () => {
      const threeDaysAgo = new Date(base.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo, base)).toBe("3d ago");
    });

    it("returns fallback for invalid dates", () => {
      expect(formatRelativeTime("invalid-date", base)).toBe("recently");
    });
  });
});
