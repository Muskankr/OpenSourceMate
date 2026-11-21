import {
  parseGitHubInput,
  parseGitHubProfileUrl,
  validateGitHubUsername,
  RESERVED_GITHUB_PATHS,
} from "../utils/validation";

describe("Profile URL Parser - Acceptance Criteria", () => {
  describe("Criteria 1: github.com/torvalds, https://github.com/torvalds/ and www.github.com/torvalds all analyze torvalds", () => {
    const validVariants = [
      { input: "github.com/torvalds", expected: "torvalds" },
      { input: "https://github.com/torvalds/", expected: "torvalds" },
      { input: "www.github.com/torvalds", expected: "torvalds" },
      { input: "http://github.com/torvalds", expected: "torvalds" },
      { input: "https://www.github.com/torvalds", expected: "torvalds" },
      { input: "https://www.github.com/torvalds/", expected: "torvalds" },
      { input: "http://www.github.com/torvalds/", expected: "torvalds" },
      { input: "   https://github.com/torvalds   ", expected: "torvalds" },
      { input: "HTTPS://GITHUB.COM/Torvalds/", expected: "torvalds" },
    ];

    it.each(validVariants)(
      "extracts canonical username from $input via parseGitHubInput",
      ({ input, expected }) => {
        const result = parseGitHubInput(input);
        expect(result.isUrl).toBe(true);
        expect(result.extractedUsername).toBe(expected);
        expect(result.error).toBeNull();
        expect(result.errorCode).toBeNull();
      }
    );

    it.each(validVariants)(
      "validates and resolves canonical username from $input via validateGitHubUsername",
      ({ input, expected }) => {
        const result = validateGitHubUsername(input);
        expect(result.isValid).toBe(true);
        expect(result.cleanUsername).toBe(expected);
        expect(result.error).toBeNull();
        expect(result.errorCode).toBeNull();
      }
    );

    it("verifies parseGitHubProfileUrl alias behaves identically", () => {
      const res = parseGitHubProfileUrl("https://github.com/octocat/");
      expect(res.isUrl).toBe(true);
      expect(res.extractedUsername).toBe("octocat");
      expect(res.error).toBeNull();
    });

    it("extracts usernames even when URLs include query parameters or anchor hashes", () => {
      const withQuery = "https://github.com/torvalds?tab=repositories";
      const withHash = "https://github.com/torvalds#contributions";
      const withBoth = "https://github.com/torvalds/?tab=projects#overview";

      expect(validateGitHubUsername(withQuery).cleanUsername).toBe("torvalds");
      expect(validateGitHubUsername(withHash).cleanUsername).toBe("torvalds");
      expect(validateGitHubUsername(withBoth).cleanUsername).toBe("torvalds");
    });
  });

  describe("Criteria 2: A repository URL shows a friendly error", () => {
    const repositoryUrls = [
      "github.com/torvalds/linux",
      "https://github.com/torvalds/linux",
      "https://github.com/torvalds/linux/",
      "http://github.com/torvalds/linux",
      "www.github.com/torvalds/linux",
      "https://www.github.com/torvalds/linux/",
      "https://github.com/facebook/react/issues/123",
      "https://github.com/vercel/next.js/pull/456",
      "https://github.com/facebook/react/tree/main",
      "github.com/owner/repo/blob/master/README.md",
    ];

    it.each(repositoryUrls)(
      "rejects repository URL %s with REPOSITORY_URL error and friendly message",
      (url) => {
        const parseResult = parseGitHubInput(url);
        expect(parseResult.isUrl).toBe(true);
        expect(parseResult.extractedUsername).toBeNull();
        expect(parseResult.errorCode).toBe("REPOSITORY_URL");
        expect(parseResult.error).toMatch(/Please enter a user profile URL, not a repository URL/i);

        const valResult = validateGitHubUsername(url);
        expect(valResult.isValid).toBe(false);
        expect(valResult.cleanUsername).toBe("");
        expect(valResult.errorCode).toBe("REPOSITORY_URL");
        expect(valResult.error).toMatch(
          /Please enter a user profile URL, not a repository URL \(e\.g\. 'github\.com\/torvalds'\)\./i
        );
      }
    );
  });

  describe("Non-profile paths and domain validation", () => {
    it.each([
      "settings",
      "explore",
      "topics",
      "features",
      "marketplace",
      "login",
      "organizations",
      "orgs",
    ])("rejects reserved GitHub path /%s as NON_PROFILE_URL", (path) => {
      const url = `https://github.com/${path}`;
      const result = parseGitHubInput(url);
      expect(result.isUrl).toBe(true);
      expect(result.extractedUsername).toBeNull();
      expect(result.errorCode).toBe("NON_PROFILE_URL");
      expect(result.error).toContain(
        `The URL path '/${path}' is a reserved GitHub page, not a user profile.`
      );

      const valResult = validateGitHubUsername(url);
      expect(valResult.isValid).toBe(false);
      expect(valResult.errorCode).toBe("NON_PROFILE_URL");
    });

    it("verifies RESERVED_GITHUB_PATHS set contains critical reserved endpoints", () => {
      expect(RESERVED_GITHUB_PATHS.has("settings")).toBe(true);
      expect(RESERVED_GITHUB_PATHS.has("explore")).toBe(true);
      expect(RESERVED_GITHUB_PATHS.has("features")).toBe(true);
      expect(RESERVED_GITHUB_PATHS.has("issues")).toBe(true);
      expect(RESERVED_GITHUB_PATHS.has("pulls")).toBe(true);
    });

    it("rejects non-GitHub URLs with INVALID_URL_DOMAIN error", () => {
      const nonGithub = [
        "https://gitlab.com/torvalds",
        "http://bitbucket.org/torvalds",
        "https://google.com",
        "https://twitter.com/torvalds",
      ];

      nonGithub.forEach((url) => {
        const result = parseGitHubInput(url);
        expect(result.isUrl).toBe(true);
        expect(result.errorCode).toBe("INVALID_URL_DOMAIN");
        expect(result.error).toMatch(/Only GitHub profile URLs .* are supported/i);

        const valResult = validateGitHubUsername(url);
        expect(valResult.isValid).toBe(false);
        expect(valResult.errorCode).toBe("INVALID_URL_DOMAIN");
      });
    });

    it("rejects root github.com URL without username path", () => {
      const rootUrls = [
        "https://github.com",
        "https://github.com/",
        "github.com",
        "www.github.com/",
      ];
      rootUrls.forEach((url) => {
        const result = validateGitHubUsername(url);
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe("EMPTY");
        expect(result.error).toMatch(/Please enter a GitHub username/i);
      });
    });
  });

  describe("Existing username rules for plain input are strictly preserved", () => {
    it("accepts valid plain usernames with or without leading @", () => {
      expect(validateGitHubUsername("torvalds").cleanUsername).toBe("torvalds");
      expect(validateGitHubUsername("@torvalds").cleanUsername).toBe("torvalds");
      expect(validateGitHubUsername("gaearon").cleanUsername).toBe("gaearon");
      expect(validateGitHubUsername("sindresorhus-123").cleanUsername).toBe("sindresorhus-123");
    });

    it("rejects invalid plain usernames with existing error codes", () => {
      expect(validateGitHubUsername("").errorCode).toBe("EMPTY");
      expect(validateGitHubUsername("   ").errorCode).toBe("EMPTY");
      expect(validateGitHubUsername("-starts-with-hyphen").errorCode).toBe("STARTS_WITH_HYPHEN");
      expect(validateGitHubUsername("ends-with-hyphen-").errorCode).toBe("ENDS_WITH_HYPHEN");
      expect(validateGitHubUsername("double--hyphens").errorCode).toBe("CONSECUTIVE_HYPHENS");
      expect(validateGitHubUsername("a".repeat(40)).errorCode).toBe("TOO_LONG");
      expect(validateGitHubUsername("invalid user").errorCode).toBe("INVALID_CHARACTERS");
      expect(validateGitHubUsername("invalid!name").errorCode).toBe("INVALID_CHARACTERS");
      expect(validateGitHubUsername("user/name").errorCode).toBe("INVALID_CHARACTERS");
    });

    it("validates extracted username formatting when a profile URL has an illegal username", () => {
      const badUrlHyphen = "https://github.com/-invaliduser/";
      const badResult = validateGitHubUsername(badUrlHyphen);
      expect(badResult.isValid).toBe(false);
      expect(badResult.errorCode).toBe("STARTS_WITH_HYPHEN");
      expect(badResult.error).toMatch(/cannot begin with a hyphen/i);

      const badUrlConsecutive = "https://github.com/invalid--user";
      expect(validateGitHubUsername(badUrlConsecutive).errorCode).toBe("CONSECUTIVE_HYPHENS");
    });
  });
});
