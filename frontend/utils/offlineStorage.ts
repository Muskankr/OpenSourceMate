import type { GitHubUserProfile, UserSkillsResponse, IssueRecommendation } from "../types/api";

export const LAST_ANALYSIS_STORAGE_KEY = "osm_last_analysis_v1";

export interface CachedAnalysisData {
  username: string;
  profile: GitHubUserProfile;
  skills: UserSkillsResponse;
  recommendations: IssueRecommendation[];
  fetchedAt: string; // ISO 8601 string
}

/**
 * Safely saves the most recent complete analysis result into localStorage.
 */
export function saveLastAnalysisResult(data: CachedAnalysisData): void {
  if (typeof window === "undefined" || !data || !data.username) {
    return;
  }

  try {
    const payload = JSON.stringify(data);
    window.localStorage.setItem(LAST_ANALYSIS_STORAGE_KEY, payload);
  } catch {
    // Gracefully ignore QuotaExceededError or SecurityError
  }
}

/**
 * Safely retrieves the most recent analysis result from localStorage.
 * Returns null if no valid cached result exists or if storage is blocked/corrupted.
 */
export function getLastAnalysisResult(): CachedAnalysisData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_ANALYSIS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.username !== "string" ||
      !parsed.profile ||
      !parsed.skills ||
      !Array.isArray(parsed.recommendations) ||
      typeof parsed.fetchedAt !== "string"
    ) {
      return null;
    }

    return parsed as CachedAnalysisData;
  } catch {
    return null;
  }
}

/**
 * Clears the saved analysis result from localStorage.
 */
export function clearLastAnalysisResult(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAST_ANALYSIS_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Formats an ISO timestamp into a localized, user-friendly date and time.
 * e.g. "Nov 26, 2026, 12:30 PM"
 */
export function formatFetchedAt(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) return "recently";

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "recently";
  }
}

/**
 * Returns a human-readable relative time string.
 * e.g. "just now", "5m ago", "2h ago", "yesterday"
 */
export function formatRelativeTime(isoTimestamp: string, baseDate = new Date()): string {
  try {
    const date = new Date(isoTimestamp);
    if (isNaN(date.getTime())) return "recently";

    const diffMs = baseDate.getTime() - date.getTime();
    if (diffMs < 0 || diffMs < 60 * 1000) return "just now";

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "recently";
  }
}
