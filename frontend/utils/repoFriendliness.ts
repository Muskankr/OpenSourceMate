export interface FriendlinessSignals {
  hasContributing?: boolean | null;
  hasCodeOfConduct?: boolean | null;
  hasIssueTemplates?: boolean | null;
  readmeLength?: number | null;
  recentMergedPrs?: number | null;
}

export interface FriendlinessSignalBreakdown {
  id:
    "contributing" | "code_of_conduct" | "issue_templates" | "readme_length" | "recent_merged_prs";
  label: string;
  points: number;
  maxPoints: number;
  passed: boolean;
  valueDescription: string;
  explanation: string;
}

export type FriendlinessTier = "Very Welcoming" | "Welcoming" | "Moderate" | "Challenging";

export interface FriendlinessScoreResult {
  repository: string;
  score: number;
  tier: FriendlinessTier;
  breakdown: FriendlinessSignalBreakdown[];
  summary: string;
  cachedAt: number;
}

/**
 * Cache TTL: 1 hour (3,600,000 ms) to respect GitHub API rate limits.
 */
export const DEFAULT_FRIENDLINESS_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Standard known repositories data for demo and offline fallbacks.
 */
export const KNOWN_REPO_FRIENDLINESS: Record<string, FriendlinessSignals> = {
  "vercel/next.js": {
    hasContributing: true,
    hasCodeOfConduct: true,
    hasIssueTemplates: true,
    readmeLength: 4800,
    recentMergedPrs: 24,
  },
  "facebook/react": {
    hasContributing: true,
    hasCodeOfConduct: true,
    hasIssueTemplates: true,
    readmeLength: 3500,
    recentMergedPrs: 16,
  },
  "tiangolo/fastapi": {
    hasContributing: true,
    hasCodeOfConduct: true,
    hasIssueTemplates: true,
    readmeLength: 5200,
    recentMergedPrs: 10,
  },
  "github/docs": {
    hasContributing: true,
    hasCodeOfConduct: true,
    hasIssueTemplates: true,
    readmeLength: 3200,
    recentMergedPrs: 18,
  },
  "rails/rails": {
    hasContributing: true,
    hasCodeOfConduct: true,
    hasIssueTemplates: true,
    readmeLength: 4100,
    recentMergedPrs: 22,
  },
  "BurntSushi/ripgrep": {
    hasContributing: true,
    hasCodeOfConduct: false,
    hasIssueTemplates: true,
    readmeLength: 6200,
    recentMergedPrs: 3,
  },
  "tailwindlabs/tailwindcss": {
    hasContributing: true,
    hasCodeOfConduct: true,
    hasIssueTemplates: true,
    readmeLength: 2900,
    recentMergedPrs: 8,
  },
  "torvalds/linux": {
    hasContributing: true,
    hasCodeOfConduct: true,
    hasIssueTemplates: false,
    readmeLength: 950,
    recentMergedPrs: 30,
  },
};

/**
 * Deterministically computes the friendliness score (0-100) from repository community signals.
 *
 * Scoring Formula (Total 100 pts):
 * 1. CONTRIBUTING file: 25 pts (Clear setup and contribution guidance)
 * 2. Code of Conduct: 20 pts (Community standard and inclusivity)
 * 3. Issue templates: 15 pts (Structured reporting guidelines)
 * 4. README length: 20 pts (>=2500 chars: 20pts, >=800 chars: 12pts, >0 chars: 6pts, 0/missing: 0pts)
 * 5. Recent merged PRs: 20 pts (>=5 merged PRs: 20pts, 1-4 merged PRs: 12pts, 0/missing: 0pts)
 *
 * Missing signals are handled gracefully without errors and default to 0 points.
 * Given identical inputs, this function is completely deterministic.
 */
export function calculateFriendlinessScore(
  repository: string,
  signals?: Partial<FriendlinessSignals> | null
): FriendlinessScoreResult {
  const repo = (repository || "").trim();
  const safeSignals: FriendlinessSignals = signals ?? {};

  // 1. CONTRIBUTING guide (25 pts)
  const hasContributing = Boolean(safeSignals.hasContributing);
  const contributingPoints = hasContributing ? 25 : 0;
  const contributingBreakdown: FriendlinessSignalBreakdown = {
    id: "contributing",
    label: "CONTRIBUTING Guide",
    points: contributingPoints,
    maxPoints: 25,
    passed: hasContributing,
    valueDescription: hasContributing ? "Present" : "Missing",
    explanation: hasContributing
      ? "Clear guidelines provided for setting up the environment, branching, and submitting pull requests."
      : "No CONTRIBUTING.md guide detected. Newcomers may need extra maintainer guidance.",
  };

  // 2. Code of Conduct (20 pts)
  const hasCodeOfConduct = Boolean(safeSignals.hasCodeOfConduct);
  const cocPoints = hasCodeOfConduct ? 20 : 0;
  const cocBreakdown: FriendlinessSignalBreakdown = {
    id: "code_of_conduct",
    label: "Code of Conduct",
    points: cocPoints,
    maxPoints: 20,
    passed: hasCodeOfConduct,
    valueDescription: hasCodeOfConduct ? "Present" : "Missing",
    explanation: hasCodeOfConduct
      ? "Project establishes an inclusive and respectful communication standard for contributors."
      : "No CODE_OF_CONDUCT.md detected.",
  };

  // 3. Issue Templates (15 pts)
  const hasIssueTemplates = Boolean(safeSignals.hasIssueTemplates);
  const templatePoints = hasIssueTemplates ? 15 : 0;
  const templateBreakdown: FriendlinessSignalBreakdown = {
    id: "issue_templates",
    label: "Issue & PR Templates",
    points: templatePoints,
    maxPoints: 15,
    passed: hasIssueTemplates,
    valueDescription: hasIssueTemplates ? "Configured" : "None",
    explanation: hasIssueTemplates
      ? "Structured templates help contributors file actionable and complete reports."
      : "No issue or pull request templates found.",
  };

  // 4. README Length (20 pts)
  const rawReadmeLen =
    typeof safeSignals.readmeLength === "number" && !isNaN(safeSignals.readmeLength)
      ? safeSignals.readmeLength
      : 0;
  const readmeLength = Math.max(0, rawReadmeLen);
  let readmePoints = 0;
  let readmeDesc = "Missing";
  let readmeExplanation = "README file is missing or empty.";

  if (readmeLength >= 2500) {
    readmePoints = 20;
    readmeDesc = `${readmeLength.toLocaleString()} chars (Comprehensive)`;
    readmeExplanation =
      "Thorough documentation with architecture, quickstart, and configuration guides.";
  } else if (readmeLength >= 800) {
    readmePoints = 12;
    readmeDesc = `${readmeLength.toLocaleString()} chars (Standard)`;
    readmeExplanation = "Standard project overview and basic setup instructions provided.";
  } else if (readmeLength > 0) {
    readmePoints = 6;
    readmeDesc = `${readmeLength.toLocaleString()} chars (Brief)`;
    readmeExplanation = "Brief README with minimal project context.";
  }

  const readmeBreakdown: FriendlinessSignalBreakdown = {
    id: "readme_length",
    label: "README Documentation",
    points: readmePoints,
    maxPoints: 20,
    passed: readmePoints >= 12,
    valueDescription: readmeDesc,
    explanation: readmeExplanation,
  };

  // 5. Recent Merged Pull Requests (20 pts)
  const rawMergedPrs =
    typeof safeSignals.recentMergedPrs === "number" && !isNaN(safeSignals.recentMergedPrs)
      ? safeSignals.recentMergedPrs
      : 0;
  const recentMergedPrs = Math.max(0, rawMergedPrs);
  let prPoints = 0;
  let prDesc = "0 merged";
  let prExplanation = "No recently merged pull requests detected in the last 90 days.";

  if (recentMergedPrs >= 5) {
    prPoints = 20;
    prDesc = `${recentMergedPrs} merged PRs (High activity)`;
    prExplanation = "Maintainers actively review and merge external pull requests regularly.";
  } else if (recentMergedPrs >= 1) {
    prPoints = 12;
    prDesc = `${recentMergedPrs} merged PR(s) (Moderate)`;
    prExplanation =
      "Some recent pull requests were merged; maintainers are reviewing contributions.";
  }

  const prBreakdown: FriendlinessSignalBreakdown = {
    id: "recent_merged_prs",
    label: "Recent Merged Pull Requests",
    points: prPoints,
    maxPoints: 20,
    passed: prPoints >= 12,
    valueDescription: prDesc,
    explanation: prExplanation,
  };

  const totalScore = contributingPoints + cocPoints + templatePoints + readmePoints + prPoints;

  // Determine tier
  let tier: FriendlinessTier = "Challenging";
  let summary =
    "This repository lacks key onboarding signals. First-time contributors may experience friction.";

  if (totalScore >= 80) {
    tier = "Very Welcoming";
    summary =
      "Highly welcoming repository with comprehensive onboarding guides and active maintainer engagement.";
  } else if (totalScore >= 60) {
    tier = "Welcoming";
    summary =
      "Welcoming repository with solid contribution guidelines and regular review activity.";
  } else if (totalScore >= 40) {
    tier = "Moderate";
    summary =
      "Moderately welcoming repository with some documentation; may require asking questions before starting.";
  }

  return {
    repository: repo,
    score: totalScore,
    tier,
    breakdown: [
      contributingBreakdown,
      cocBreakdown,
      templateBreakdown,
      readmeBreakdown,
      prBreakdown,
    ],
    summary,
    cachedAt: Date.now(),
  };
}

// In-memory cache for repository friendliness scores
const memoryCache = new Map<string, FriendlinessScoreResult>();

// In-flight deduplication map
const inFlightRequests = new Map<string, Promise<FriendlinessScoreResult>>();

function normalizeKey(repository: string): string {
  return (repository || "").toLowerCase().trim();
}

/**
 * Retrieves a cached friendliness score if present and not expired.
 */
export function getCachedFriendlinessScore(
  repository: string,
  ttlMs: number = DEFAULT_FRIENDLINESS_CACHE_TTL_MS
): FriendlinessScoreResult | null {
  const key = normalizeKey(repository);
  if (!key) return null;

  const cached = memoryCache.get(key);
  if (cached) {
    if (Date.now() - cached.cachedAt < ttlMs) {
      return cached;
    }
    memoryCache.delete(key);
  }

  // Check localStorage if available in browser
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(`osm_friendliness_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as FriendlinessScoreResult;
        if (Date.now() - parsed.cachedAt < ttlMs) {
          memoryCache.set(key, parsed);
          return parsed;
        }
        localStorage.removeItem(`osm_friendliness_${key}`);
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return null;
}

/**
 * Stores a friendliness score result in in-memory cache and localStorage.
 */
export function setCachedFriendlinessScore(
  repository: string,
  result: FriendlinessScoreResult,
  timestamp: number = Date.now()
): void {
  const key = normalizeKey(repository);
  if (!key) return;

  const entry: FriendlinessScoreResult = {
    ...result,
    cachedAt: timestamp,
  };

  memoryCache.set(key, entry);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(`osm_friendliness_${key}`, JSON.stringify(entry));
    } catch {
      // Ignore localStorage quotas
    }
  }
}

/**
 * Clears the friendliness cache (primarily for tests).
 */
export function clearFriendlinessCache(): void {
  memoryCache.clear();
  inFlightRequests.clear();
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("osm_friendliness_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }
}

/**
 * Resolves repository friendliness score, respecting cache and coalescing duplicate in-flight requests.
 */
export async function getRepoFriendliness(
  repository: string,
  options: { bypassCache?: boolean; ttlMs?: number } = {}
): Promise<FriendlinessScoreResult> {
  const repoKey = normalizeKey(repository);

  // 1. Check cache unless bypassed
  if (!options.bypassCache) {
    const cached = getCachedFriendlinessScore(repoKey, options.ttlMs);
    if (cached) {
      return cached;
    }
  }

  // 2. Coalesce concurrent in-flight requests for the same repository
  if (inFlightRequests.has(repoKey)) {
    return inFlightRequests.get(repoKey)!;
  }

  const fetchPromise = (async () => {
    // 3. Check known repository activity (offline & demo fallback)
    if (KNOWN_REPO_FRIENDLINESS[repoKey]) {
      const result = calculateFriendlinessScore(repository, KNOWN_REPO_FRIENDLINESS[repoKey]);
      setCachedFriendlinessScore(repoKey, result);
      return result;
    }

    // 4. Fallback: attempt to fetch from backend friendliness check endpoint if available
    try {
      if (typeof fetch !== "undefined") {
        const res = await fetch(
          `/api/v1/repositories/friendliness?repo=${encodeURIComponent(repository)}`
        );
        if (res.ok) {
          const data = await res.json();
          const signals: FriendlinessSignals = {
            hasContributing: Boolean(
              data.checks?.find(
                (c: { id: string; passed: boolean }) => c.id === "contributing_guide"
              )?.passed
            ),
            hasCodeOfConduct: Boolean(
              data.checks?.find((c: { id: string; passed: boolean }) => c.id === "code_of_conduct")
                ?.passed
            ),
            hasIssueTemplates: Boolean(
              data.checks?.find((c: { id: string; passed: boolean }) => c.id === "issue_templates")
                ?.passed ?? true
            ),
            readmeLength: typeof data.readme_length === "number" ? data.readme_length : 2000,
            recentMergedPrs:
              typeof data.recent_merged_prs === "number" ? data.recent_merged_prs : 5,
          };
          const result = calculateFriendlinessScore(repository, signals);
          setCachedFriendlinessScore(repoKey, result);
          return result;
        }
      }
    } catch {
      // Network failure or backend not responding
    }

    // 5. Default fallback: calculate score from empty/minimal signals without error
    const fallbackResult = calculateFriendlinessScore(repository, null);
    setCachedFriendlinessScore(repoKey, fallbackResult);
    return fallbackResult;
  })().finally(() => {
    inFlightRequests.delete(repoKey);
  });

  inFlightRequests.set(repoKey, fetchPromise);
  return fetchPromise;
}
