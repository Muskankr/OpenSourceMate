/**
 * Username sanitization and GitHub validation utility.
 * Adheres strictly to official GitHub username rules:
 * - May only contain alphanumeric characters and single hyphens.
 * - Cannot begin or end with a hyphen.
 * - Maximum of 39 characters.
 * - Cannot contain multiple consecutive hyphens.
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
    | null;
}

/**
 * Extract username from GitHub profile URLs if pasted by users.
 * Supports:
 * - https://github.com/torvalds
 * - http://github.com/torvalds/
 * - github.com/torvalds
 * - www.github.com/torvalds
 * Rejects repository URLs or non-profile paths.
 */
export function extractUsernameFromUrl(
  rawInput: string
): { username?: string; error?: string } | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("github.com/") ||
    trimmed.startsWith("www.github.com/")
  ) {
    try {
      const urlString =
        trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : `https://${trimmed}`;
      const url = new URL(urlString);
      if (url.hostname === "github.com" || url.hostname === "www.github.com") {
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length === 0) {
          return {
            error: "Please provide a GitHub profile URL or username, not just the homepage.",
          };
        }
        if (segments.length === 1) {
          return { username: segments[0] };
        }
        return {
          error: `The provided URL points to a repository or page ('${segments.slice(1).join("/")}'), not a user profile. Please provide a profile URL or username.`,
        };
      }
    } catch {
      // not a valid URL, fallback to standard username parsing
    }
  }
  return null;
}

/**
 * Clean and normalize a raw username input by trimming outer whitespace,
 * stripping leading '@' symbols, and converting to canonical lowercase.
 */
export function sanitizeUsername(rawInput: string): string {
  if (!rawInput) return "";
  const urlExtracted = extractUsernameFromUrl(rawInput);
  const target = urlExtracted?.username || rawInput;
  return target.trim().replace(/^@+/, "").toLowerCase();
}

/**
 * Format a canonical username for display (prefers original casing from profile data when available).
 */
export function formatCanonicalUsername(input: string, profileLogin?: string): string {
  if (profileLogin && profileLogin.toLowerCase() === input.toLowerCase()) {
    return profileLogin;
  }
  return sanitizeUsername(input);
}

/**
 * Validate a GitHub username against official formatting rules,
 * returning a specific human-readable error message and code.
 */
export function validateGitHubUsername(rawInput: string): ValidationResult {
  const urlCheck = extractUsernameFromUrl(rawInput);
  if (urlCheck?.error) {
    return {
      isValid: false,
      cleanUsername: "",
      error: urlCheck.error,
      errorCode: "INVALID_CHARACTERS",
    };
  }

  const cleanUsername = sanitizeUsername(rawInput);

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

export interface AnalyzerErrorDetailsContext {
  username?: string;
  resetAt?: string;
  code?: string;
  onlyForks?: boolean;
}

export interface AnalyzerErrorDetails {
  title: string;
  message: string;
  suggestion: string;
  errorCode:
    | "USER_NOT_FOUND"
    | "NO_PUBLIC_REPOSITORIES"
    | "ONLY_FORKS"
    | "UPSTREAM_FAILURE"
    | "RATE_LIMIT_EXCEEDED"
    | "VALIDATION_ERROR"
    | "SERVER_ERROR"
    | "NETWORK_ERROR"
    | "UNKNOWN_ERROR";
  canRetry: boolean;
}

/**
 * Maps HTTP response statuses or exceptions to distinct, readable user messages with suggested next steps.
 */
export function resolveAnalyzerErrorDetails(
  statusOrError: number | Error | unknown,
  customDetails?: AnalyzerErrorDetailsContext
): AnalyzerErrorDetails {
  const user = customDetails?.username;
  const userPrefix = user ? `GitHub user '${user}'` : "GitHub user";
  const code = customDetails?.code;

  // Explicit error code overrides
  if (code === "ONLY_FORKS" || customDetails?.onlyForks) {
    return {
      title: "Only Forked Repositories Found",
      message: `${userPrefix} only has forked repositories.`,
      suggestion:
        "OpenSourceMate analyzes original code to determine technical skills. You can add original repositories or customize your skills manually.",
      errorCode: "ONLY_FORKS",
      canRetry: false,
    };
  }

  if (code === "NO_PUBLIC_REPOSITORIES") {
    return {
      title: "No Public Repositories",
      message: `${userPrefix} has no public repositories to analyze.`,
      suggestion:
        "Create or publish a public repository with code, or manually add skills above to explore matching issues.",
      errorCode: "NO_PUBLIC_REPOSITORIES",
      canRetry: false,
    };
  }

  if (code === "USER_NOT_FOUND") {
    return {
      title: "User Not Found",
      message: `${userPrefix} could not be found. Please check the spelling and try again.`,
      suggestion:
        "Please double-check the username for typos or try searching for another GitHub profile.",
      errorCode: "USER_NOT_FOUND",
      canRetry: true,
    };
  }

  if (
    code === "UPSTREAM_FAILURE" ||
    code === "UPSTREAM_SERVICE_ERROR" ||
    code === "UPSTREAM_TIMEOUT"
  ) {
    return {
      title: "GitHub API Unavailable",
      message: "GitHub API is temporarily unavailable or returned an upstream error.",
      suggestion:
        "Please wait a few moments and click Retry, or check GitHub's status page if the problem persists.",
      errorCode: "UPSTREAM_FAILURE",
      canRetry: true,
    };
  }

  if (typeof statusOrError === "number") {
    switch (statusOrError) {
      case 404:
        return {
          title: "User Not Found",
          message: `${userPrefix} could not be found. Please check the spelling and try again.`,
          suggestion:
            "Please double-check the username for typos or try searching for another GitHub profile.",
          errorCode: "USER_NOT_FOUND",
          canRetry: true,
        };
      case 422:
        return {
          title: "No Public Repositories",
          message: `${userPrefix} has no public repositories to analyze.`,
          suggestion:
            "Create or publish a public repository with code, or manually add skills above to explore matching issues.",
          errorCode: "NO_PUBLIC_REPOSITORIES",
          canRetry: false,
        };
      case 429: {
        let msg = "GitHub API rate limit reached. Please try again in a few minutes.";
        if (customDetails?.resetAt) {
          try {
            const time = new Date(customDetails.resetAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });
            msg = `GitHub API rate limit reached. Please try again at ${time}.`;
          } catch {
            // ignore
          }
        }
        return {
          title: "Rate Limit Reached",
          message: msg,
          suggestion: "Wait for the rate limit reset window or retry shortly.",
          errorCode: "RATE_LIMIT_EXCEEDED",
          canRetry: true,
        };
      }
      case 502:
      case 503:
      case 504:
        return {
          title: "GitHub API Unavailable",
          message: "GitHub API is temporarily unavailable. Please try again in a few moments.",
          suggestion: "Please wait a moment and click Retry, or check GitHub's status page.",
          errorCode: "UPSTREAM_FAILURE",
          canRetry: true,
        };
      case 500:
        return {
          title: "Server Error",
          message:
            "An internal server error occurred while analyzing the profile. Please try again.",
          suggestion: "Click Retry or refresh the page in a few moments.",
          errorCode: "SERVER_ERROR",
          canRetry: true,
        };
      default:
        return {
          title: "Request Error",
          message: `Unable to retrieve profile data (HTTP ${statusOrError}). Please try again.`,
          suggestion: "Check your network and try again.",
          errorCode: "UNKNOWN_ERROR",
          canRetry: true,
        };
    }
  }

  // Handle ApiClientError-like objects
  if (typeof statusOrError === "object" && statusOrError !== null && "status" in statusOrError) {
    const apiErr = statusOrError as { status: number; code?: string; message?: string };
    if (apiErr.code === "ONLY_FORKS") {
      return {
        title: "Only Forked Repositories Found",
        message: `${userPrefix} only has forked repositories.`,
        suggestion:
          "OpenSourceMate analyzes original code to determine technical skills. You can add original repositories or customize your skills manually.",
        errorCode: "ONLY_FORKS",
        canRetry: false,
      };
    }
    if (apiErr.code === "NO_PUBLIC_REPOSITORIES") {
      return {
        title: "No Public Repositories",
        message: `${userPrefix} has no public repositories to analyze.`,
        suggestion:
          "Create or publish a public repository with code, or manually add skills above to explore matching issues.",
        errorCode: "NO_PUBLIC_REPOSITORIES",
        canRetry: false,
      };
    }
    if (apiErr.status === 404 || apiErr.code === "USER_NOT_FOUND" || apiErr.code === "NOT_FOUND") {
      return {
        title: "User Not Found",
        message: `${userPrefix} could not be found. Please check the spelling and try again.`,
        suggestion:
          "Please double-check the username for typos or try searching for another GitHub profile.",
        errorCode: "USER_NOT_FOUND",
        canRetry: true,
      };
    }
    if (
      apiErr.status === 502 ||
      apiErr.status === 503 ||
      apiErr.status === 504 ||
      apiErr.code === "UPSTREAM_FAILURE" ||
      apiErr.code === "UPSTREAM_SERVICE_ERROR"
    ) {
      return {
        title: "GitHub API Unavailable",
        message: "GitHub API is temporarily unavailable or returned an upstream error.",
        suggestion: "Please wait a few moments and click Retry, or check GitHub's status page.",
        errorCode: "UPSTREAM_FAILURE",
        canRetry: true,
      };
    }
  }

  if (statusOrError instanceof TypeError) {
    return {
      title: "Unable to Connect",
      message:
        "Unable to connect to the server. Please check your network connection and ensure the backend is running.",
      suggestion:
        "Verify that the backend service is running on port 8000 and your network is connected.",
      errorCode: "NETWORK_ERROR",
      canRetry: true,
    };
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
      return {
        title: "Unable to Connect",
        message:
          "Unable to connect to the server. Please check your network connection and ensure the backend is running.",
        suggestion: "Ensure the backend service is running and click Retry.",
        errorCode: "NETWORK_ERROR",
        canRetry: true,
      };
    }
    return {
      title: "Error",
      message: raw || "Something went wrong. Please try again.",
      suggestion: "Please try again or enter a different username.",
      errorCode: "UNKNOWN_ERROR",
      canRetry: true,
    };
  }

  return {
    title: "Unexpected Error",
    message: "An unexpected error occurred. Please try again.",
    suggestion: "Refresh the page or check your connection.",
    errorCode: "UNKNOWN_ERROR",
    canRetry: true,
  };
}

/**
 * Maps HTTP response statuses or exceptions to distinct, readable user messages.
 */
export function resolveAnalyzerErrorMessage(
  statusOrError: number | Error | unknown,
  customDetails?: AnalyzerErrorDetailsContext
): string {
  const details = resolveAnalyzerErrorDetails(statusOrError, customDetails);
  return details.message;
}
