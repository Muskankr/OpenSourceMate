import { getBuildVersion } from "./buildVersion";

const TOKEN_PATTERN = /(gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|Bearer\s+[A-Za-z0-9._-]+)/gi;

/**
 * Strips query parameters, hashes, and dynamic usernames (/u/<username>) from a route
 * so diagnostics never contain personal data.
 */
export function sanitizeRoute(rawPath?: string): string {
  const path = (rawPath || (typeof window !== "undefined" ? window.location.pathname : "/"))
    .split("?")[0]
    .split("#")[0];

  return path.replace(/^\/u\/[^/]+/i, "/u/[username]") || "/";
}

/**
 * Redacts any accidental tokens or credentials from an error message.
 */
export function sanitizeErrorMessage(message?: string): string {
  if (!message) return "Unknown error";
  return message.replace(TOKEN_PATTERN, "[REDACTED]");
}

/**
 * Builds a safe, copyable diagnostics string containing only:
 * app version, sanitized route, browser user-agent, and sanitized error message.
 */
export function buildErrorDiagnostics(
  error: Error,
  options?: {
    appVersion?: string;
    route?: string;
    userAgent?: string;
  }
): string {
  let version = options?.appVersion;
  if (!version) {
    try {
      version = getBuildVersion().version;
    } catch {
      version = "0.1.0";
    }
  }
  version = version || "0.1.0";
  const route = sanitizeRoute(options?.route);
  const browser =
    options?.userAgent ||
    (typeof navigator !== "undefined" ? navigator.userAgent : "Unknown");
  const errorMessage = sanitizeErrorMessage(error?.message);

  return [
    `App Version: ${version}`,
    `Route: ${route}`,
    `Browser: ${browser}`,
    `Error: ${errorMessage}`,
  ].join("\n");
}
