import {
  sanitizeUsername,
  validateGitHubUsername,
  resolveAnalyzerErrorMessage,
  resolveAnalyzerErrorDetails,
  extractUsernameFromUrl,
} from "../utils/validation";

describe("Validation Utilities - URL Extraction", () => {
  it("extracts clean username from GitHub profile URLs", () => {
    expect(extractUsernameFromUrl("https://github.com/torvalds")?.username).toBe("torvalds");
    expect(extractUsernameFromUrl("http://github.com/torvalds/")?.username).toBe("torvalds");
    expect(extractUsernameFromUrl("github.com/torvalds")?.username).toBe("torvalds");
    expect(extractUsernameFromUrl("www.github.com/torvalds")?.username).toBe("torvalds");
  });

  it("rejects repository or deep page URLs with friendly error", () => {
    const repoCheck = extractUsernameFromUrl("https://github.com/torvalds/linux");
    expect(repoCheck?.error).toMatch(/points to a repository or page/i);
  });
});

describe("Validation Utilities - sanitizeUsername", () => {
  it("trims leading and trailing whitespace", () => {
    expect(sanitizeUsername("   octocat   ")).toBe("octocat");
  });

  it("strips a single leading @ character", () => {
    expect(sanitizeUsername("@octocat")).toBe("octocat");
  });

  it("strips multiple leading @ characters and outer whitespace", () => {
    expect(sanitizeUsername("   @@@octocat   ")).toBe("octocat");
  });

  it("handles empty or blank inputs", () => {
    expect(sanitizeUsername("")).toBe("");
    expect(sanitizeUsername("   ")).toBe("");
    expect(sanitizeUsername("@@@")).toBe("");
  });

  it("leaves internal hyphens and valid characters intact", () => {
    expect(sanitizeUsername("@hello-world-123")).toBe("hello-world-123");
  });
});

describe("Validation Utilities - validateGitHubUsername", () => {
  it("accepts valid standard GitHub usernames", () => {
    const validNames = [
      "torvalds",
      "gaearon",
      "kentcdodds",
      "a",
      "a-b",
      "octocat-123",
      "123456",
      "user-with-several-hyphens-allowed",
      "a".repeat(39), // exactly 39 chars
    ];

    validNames.forEach((name) => {
      const result = validateGitHubUsername(name);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.cleanUsername).toBe(name);
    });
  });

  it("rejects empty usernames with code EMPTY", () => {
    const result = validateGitHubUsername("   ");
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("EMPTY");
    expect(result.error).toMatch(/Please enter a GitHub username/i);
  });

  it("rejects usernames exceeding 39 characters with code TOO_LONG", () => {
    const longName = "a".repeat(40);
    const result = validateGitHubUsername(longName);
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("TOO_LONG");
    expect(result.error).toMatch(/too long/i);
  });

  it("rejects usernames starting with a hyphen with code STARTS_WITH_HYPHEN", () => {
    const result = validateGitHubUsername("-invaliduser");
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("STARTS_WITH_HYPHEN");
    expect(result.error).toMatch(/cannot begin with a hyphen/i);
  });

  it("rejects usernames ending with a hyphen with code ENDS_WITH_HYPHEN", () => {
    const result = validateGitHubUsername("invaliduser-");
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("ENDS_WITH_HYPHEN");
    expect(result.error).toMatch(/cannot end with a hyphen/i);
  });

  it("rejects usernames containing consecutive hyphens with code CONSECUTIVE_HYPHENS", () => {
    const result = validateGitHubUsername("invalid--user");
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe("CONSECUTIVE_HYPHENS");
    expect(result.error).toMatch(/cannot contain multiple consecutive hyphens/i);
  });

  it("rejects usernames containing underscores, periods, and special symbols", () => {
    const invalidChars = [
      "user_name",
      "user.name",
      "user$name",
      "user#name",
      "user!name",
      "user+name",
      "user/name",
    ];

    invalidChars.forEach((name) => {
      const result = validateGitHubUsername(name);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe("INVALID_CHARACTERS");
      expect(result.error).toMatch(/can only contain alphanumeric characters/i);
    });
  });
});

describe("Validation Utilities - resolveAnalyzerErrorMessage", () => {
  it("resolves 404 user not found with specific username", () => {
    const msg = resolveAnalyzerErrorMessage(404, { username: "unknown-dev" });
    expect(msg).toBe(
      "GitHub user 'unknown-dev' could not be found. Please check the spelling and try again."
    );
  });

  it("resolves 404 user not found with fallback prefix", () => {
    const msg = resolveAnalyzerErrorMessage(404);
    expect(msg).toMatch(/could not be found/i);
  });

  it("resolves 429 rate limit with formatted reset timestamp", () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const msg = resolveAnalyzerErrorMessage(429, { resetAt: futureDate });
    expect(msg).toMatch(/GitHub API rate limit reached\. Please try again at/i);
  });

  it("resolves 429 rate limit fallback message when timestamp missing", () => {
    const msg = resolveAnalyzerErrorMessage(429);
    expect(msg).toBe("GitHub API rate limit reached. Please try again in a few minutes.");
  });

  it("resolves 502 and 503 gateway / service unavailable", () => {
    expect(resolveAnalyzerErrorMessage(502)).toMatch(/temporarily unavailable/i);
    expect(resolveAnalyzerErrorMessage(503)).toMatch(/temporarily unavailable/i);
  });

  it("resolves 500 internal server error", () => {
    expect(resolveAnalyzerErrorMessage(500)).toMatch(/internal server error/i);
  });

  it("resolves TypeError as network connection failure", () => {
    const typeError = new TypeError("Failed to fetch");
    const msg = resolveAnalyzerErrorMessage(typeError);
    expect(msg).toMatch(/Unable to connect to the server\. Please check your network connection/i);
  });

  it("resolves standard Error instances", () => {
    const err = new Error("Custom backend exception");
    expect(resolveAnalyzerErrorMessage(err)).toBe("Custom backend exception");
  });

  it("resolves unknown errors safely", () => {
    expect(resolveAnalyzerErrorMessage(null)).toMatch(/unexpected error/i);
  });
});

describe("Validation Utilities - resolveAnalyzerErrorDetails", () => {
  it("resolves USER_NOT_FOUND with friendly message and suggested next step", () => {
    const details = resolveAnalyzerErrorDetails(404, { username: "ghost-user" });
    expect(details.errorCode).toBe("USER_NOT_FOUND");
    expect(details.message).toContain("GitHub user 'ghost-user' could not be found");
    expect(details.suggestion).toMatch(/double-check the username for typos/i);
    expect(details.canRetry).toBe(true);
  });

  it("resolves NO_PUBLIC_REPOSITORIES with message and suggestion to create repo or add skills", () => {
    const details = resolveAnalyzerErrorDetails(422, {
      username: "newbie-contributor",
      code: "NO_PUBLIC_REPOSITORIES",
    });
    expect(details.errorCode).toBe("NO_PUBLIC_REPOSITORIES");
    expect(details.message).toContain("has no public repositories to analyze");
    expect(details.suggestion).toMatch(/Create or publish a public repository/i);
    expect(details.canRetry).toBe(false);
  });

  it("resolves ONLY_FORKS with message explaining original code is needed", () => {
    const details = resolveAnalyzerErrorDetails(422, {
      username: "forks-only-dev",
      code: "ONLY_FORKS",
    });
    expect(details.errorCode).toBe("ONLY_FORKS");
    expect(details.message).toContain("only has forked repositories");
    expect(details.suggestion).toMatch(/analyzes original code/i);
    expect(details.canRetry).toBe(false);
  });

  it("resolves UPSTREAM_FAILURE with friendly message and retry suggestion", () => {
    const details = resolveAnalyzerErrorDetails(502, { code: "UPSTREAM_FAILURE" });
    expect(details.errorCode).toBe("UPSTREAM_FAILURE");
    expect(details.message).toMatch(/GitHub API is temporarily unavailable/i);
    expect(details.suggestion).toMatch(/click Retry/i);
    expect(details.canRetry).toBe(true);
  });
});
