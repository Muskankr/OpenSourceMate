/**
 * Username sanitization and GitHub validation utility.
 * Adheres strictly to official GitHub username rules:
 * - May only contain alphanumeric characters and single hyphens.
 * - Cannot begin or end with a hyphen.
 * - Maximum of 39 characters.
 * - Cannot contain multiple consecutive hyphens.
 *
 * Also parses GitHub profile URLs (e.g. github.com/torvalds, https://github.com/torvalds/,
 * www.github.com/torvalds) and rejects repository URLs or non-profile paths with clear, friendly messages.
 */

export interface ValidationResult {
  isValid: boolean;
  cleanUsername: string;
  error: string | null;
  errorCode:
    | "EMPTY"
    | "TOO_LONG"
    | "STARTS_WITH_HYPHEN"
    | "ENDS_WITH_HYPHEN"
    | "CONSECUTIVE_HYPHENS"
    | "INVALID_CHARACTERS"
    | "REPOSITORY_URL"
    | "NON_PROFILE_URL"
    | "INVALID_URL_DOMAIN"
    | "INVALID_URL"
    | null;
}

export type GitHubInputParseErrorCode =
  "EMPTY" | "REPOSITORY_URL" | "NON_PROFILE_URL" | "INVALID_URL_DOMAIN" | "INVALID_URL";

export interface GitHubInputParseResult {
  isUrl: boolean;
  extractedUsername: string | null;
  error: string | null;
  errorCode: GitHubInputParseErrorCode | null;
}

/**
 * Reserved GitHub top-level system paths that cannot be user profile usernames.
 */
export const RESERVED_GITHUB_PATHS = new Set([
  "about",
  "account",
  "collections",
  "contact",
  "customer-stories",
  "enterprise",
  "events",
  "explore",
  "features",
  "issues",
  "join",
  "login",
  "marketplace",
  "notifications",
  "organizations",
  "orgs",
  "pricing",
  "pulls",
  "readme",
  "search",
  "security",
  "session",
  "sessions",
  "settings",
  "site",
  "sponsors",
  "team",
  "topics",
  "trending",
]);

/**
 * Clean and normalize a raw username input by trimming outer whitespace,
 * stripping leading '@' symbols, and converting to canonical lowercase.
 */
export function sanitizeUsername(rawInput: string): string {
  if (!rawInput) return "";
  return rawInput.trim().replace(/^@+/, "").toLowerCase();
}

/**
 * Format a canonical username for display (prefers original casing from profile data when available).
 */
export function formatCanonicalUsername(input: string, profileLogin?: string): string {
  if (profileLogin) {
    return profileLogin;
  }
  return sanitizeUsername(input);
}

/**
 * Check whether two username inputs refer to the same user (case-insensitive and sanitized).
 */
export function isSameUsername(userA: string, userB: string): boolean {
  const sA = sanitizeUsername(userA);
  const sB = sanitizeUsername(userB);
  if (!sA || !sB) return false;
  return sA.toLowerCase() === sB.toLowerCase();
}

/**
 * Parse a raw input string that may be a plain username or a GitHub profile URL.
 * Supports:
 * - github.com/<username>
 * - https://github.com/<username>
 * - http://github.com/<username>
 * - www.github.com/<username>
 * - https://www.github.com/<username>
 * - Trailing slashes, query parameters, hashes
 *
 * Rejects repository URLs and non-profile paths with clear, friendly messages.
 */
export function parseGitHubInput(rawInput: string): GitHubInputParseResult {
  if (!rawInput) {
    return {
      isUrl: false,
      extractedUsername: null,
      error: "Please enter a GitHub username.",
      errorCode: "EMPTY",
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isUrl: false,
      extractedUsername: null,
      error: "Please enter a GitHub username.",
      errorCode: "EMPTY",
    };
  }

  const lower = trimmed.toLowerCase();

  // Determine if input looks like a URL:
  // Starts with http(s)://, starts with www., or contains github.com
  const isUrlLike =
    /^https?:\/\//i.test(trimmed) ||
    lower.startsWith("www.") ||
    lower.includes("github.com");

  if (!isUrlLike) {
    // Plain username input
    return {
      isUrl: false,
      extractedUsername: trimmed,
      error: null,
      errorCode: null,
    };
  }

  // Parse as URL
  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return {
      isUrl: true,
      extractedUsername: null,
      error: "Invalid URL format. Please enter a valid GitHub profile URL or username.",
      errorCode: "INVALID_URL",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== "github.com" && hostname !== "www.github.com") {
    return {
      isUrl: true,
      extractedUsername: null,
      error: "Only GitHub profile URLs (github.com/<username>) are supported.",
      errorCode: "INVALID_URL_DOMAIN",
    };
  }

  // Split path into segments, ignoring empty parts
  const segments = parsed.pathname
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return {
      isUrl: true,
      extractedUsername: null,
      error: "Please enter a GitHub username or profile URL.",
      errorCode: "EMPTY",
    };
  }

  const firstSegment = segments[0];

  // Check if first segment is a reserved GitHub system path
  if (RESERVED_GITHUB_PATHS.has(firstSegment.toLowerCase())) {
    return {
      isUrl: true,
      extractedUsername: null,
      error: `The URL path '/${firstSegment}' is a reserved GitHub page, not a user profile.`,
      errorCode: "NON_PROFILE_URL",
    };
  }

  // Check if path indicates a repository (> 1 segment)
  if (segments.length > 1) {
    return {
      isUrl: true,
      extractedUsername: null,
      error: "Please enter a user profile URL, not a repository URL (e.g. 'github.com/torvalds').",
      errorCode: "REPOSITORY_URL",
    };
  }

  return {
    isUrl: true,
    extractedUsername: firstSegment.toLowerCase(),
    error: null,
    errorCode: null,
  };
}

/**
 * Alias for parseGitHubInput to clearly indicate URL parsing intent.
 */
export const parseGitHubProfileUrl = parseGitHubInput;

/**
 * Validates a GitHub username and returns a standardized result with sanitized canonical username.
 */
export function validateUsername(rawInput: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  const result = validateGitHubUsername(rawInput);
  return {
    isValid: result.isValid,
    sanitized: result.cleanUsername,
    ...(result.error ? { error: result.error } : {}),
  };
}

function validateCleanUsername(cleanUsername: string): ValidationResult {
  if (!cleanUsername) {
    return {
      isValid: false,
      cleanUsername: "",
      error: "Please enter a GitHub username.",
      errorCode: "EMPTY",
    };
  }

  if (cleanUsername.length > 39) {
    return {
      isValid: false,
      cleanUsername,
      error: `GitHub username is too long (${cleanUsername.length} characters). Maximum allowed is 39 characters.`,
      errorCode: "TOO_LONG",
    };
  }

  if (cleanUsername.startsWith("-")) {
    return {
      isValid: false,
      cleanUsername,
      error: "GitHub username cannot begin with a hyphen ('-').",
      errorCode: "STARTS_WITH_HYPHEN",
    };
  }

  if (cleanUsername.endsWith("-")) {
    return {
      isValid: false,
      cleanUsername,
      error: "GitHub username cannot end with a hyphen ('-').",
      errorCode: "ENDS_WITH_HYPHEN",
    };
  }

  if (cleanUsername.includes("--")) {
    return {
      isValid: false,
      cleanUsername,
      error: "GitHub username cannot contain multiple consecutive hyphens ('--').",
      errorCode: "CONSECUTIVE_HYPHENS",
    };
  }

  // Check for invalid characters (only alphanumeric and single internal hyphen permitted)
  const validPattern = /^[a-zA-Z0-9-]+$/;
  if (!validPattern.test(cleanUsername)) {
    return {
      isValid: false,
      cleanUsername,
      error:
        "GitHub username can only contain alphanumeric characters (letters and numbers) and single hyphens.",
      errorCode: "INVALID_CHARACTERS",
    };
  }

  return {
    isValid: true,
    cleanUsername,
    error: null,
    errorCode: null,
  };
}

/**
 * Validate a GitHub username or profile URL against official formatting rules,
 * returning a specific human-readable error message and code.
 */
export function validateGitHubUsername(rawInput: string): ValidationResult {
  const parsed = parseGitHubInput(rawInput);

  if (parsed.isUrl) {
    if (!parsed.extractedUsername) {
      return {
        isValid: false,
        cleanUsername: "",
        error: parsed.error,
        errorCode: parsed.errorCode as any,
      };
    }

    const cleanUsername = sanitizeUsername(parsed.extractedUsername);
    return validateCleanUsername(cleanUsername);
  }

  const cleanUsername = sanitizeUsername(rawInput);
  return validateCleanUsername(cleanUsername);
}

/**
 * Maps HTTP response statuses or exceptions to distinct, readable user messages.
 */
export function resolveAnalyzerErrorMessage(
  statusOrError: number | Error | unknown,
  customDetails?: { username?: string; resetAt?: string }
): string {
  const userPrefix = customDetails?.username
    ? `GitHub user '${customDetails.username}'`
    : "GitHub user";

  if (typeof statusOrError === "number") {
    switch (statusOrError) {
      case 404:
        return `${userPrefix} could not be found. Please check the spelling and try again.`;
      case 429:
        if (customDetails?.resetAt) {
          try {
            const time = new Date(customDetails.resetAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });
            return `GitHub API rate limit reached. Please try again at ${time}.`;
          } catch {
            // Fall through to generic message
          }
        }
        return "GitHub API rate limit reached. Please try again in a few minutes.";
      case 502:
      case 503:
        return "GitHub API is temporarily unavailable. Please try again in a few moments.";
      case 500:
        return "An internal server error occurred while analyzing the profile. Please try again.";
      default:
        return `Unable to retrieve profile data (HTTP ${statusOrError}). Please try again.`;
    }
  }

  if (statusOrError instanceof TypeError) {
    return "Unable to connect to the server. Please check your network connection and ensure the backend is running.";
  }

  if (statusOrError instanceof Error) {
    const raw = statusOrError.message || "";
    if (
      raw.includes("Traceback") ||
      raw.includes("at ") ||
      raw.includes("ECONNREFUSED") ||
      raw.includes(".py:") ||
      raw.includes(".ts:") ||
      raw.includes("node_modules")
    ) {
      return "Unable to connect to the server. Please check your network connection and ensure the backend is running.";
    }
    return raw || "Something went wrong. Please try again.";
  }

  return "An unexpected error occurred. Please try again.";
}
