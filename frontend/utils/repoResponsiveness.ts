export type ResponsivenessRating = "Fast" | "Moderate" | "Slow" | "Not enough data";

export interface RepositoryActivityData {
  repository: string;
  medianResponseHours: number | null;
  sampleCount: number;
  prMergeRate?: number | null;
}

export interface ResponsivenessResult {
  repository: string;
  rating: ResponsivenessRating;
  medianResponseHours: number | null;
  sampleCount: number;
  ruleExplanation: string;
  tooltipText: string;
  cachedAt: number;
}

/**
 * Minimum number of recent issues/PRs required to make an accurate responsiveness determination.
 * Repositories below this threshold return "Not enough data" instead of a guess.
 */
export const MIN_SAMPLE_THRESHOLD = 3;

/**
 * Default cache TTL: 1 hour (3,600,000 ms) to respect GitHub API rate limits.
 */
export const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Standard known repositories data for demo and offline fallbacks.
 */
export const KNOWN_REPO_ACTIVITY: Record<string, RepositoryActivityData> = {
  "vercel/next.js": {
    repository: "vercel/next.js",
    medianResponseHours: 6.5,
    sampleCount: 15,
  },
  "tiangolo/fastapi": {
    repository: "tiangolo/fastapi",
    medianResponseHours: 18.0,
    sampleCount: 12,
  },
  "facebook/react": {
    repository: "facebook/react",
    medianResponseHours: 36.0,
    sampleCount: 10,
  },
  "golang/go": {
    repository: "golang/go",
    medianResponseHours: 48.0,
    sampleCount: 8,
  },
  "BurntSushi/ripgrep": {
    repository: "BurntSushi/ripgrep",
    medianResponseHours: 96.0,
    sampleCount: 5,
  },
  "tailwindlabs/tailwindcss": {
    repository: "tailwindlabs/tailwindcss",
    medianResponseHours: 14.0,
    sampleCount: 10,
  },
};

/**
 * Evaluates repository activity data against deterministic responsiveness rules.
 *
 * Rules:
 * - sampleCount < MIN_SAMPLE_THRESHOLD or medianResponseHours is null: "Not enough data"
 * - medianResponseHours <= 24: "Fast"
 * - medianResponseHours > 24 and <= 72: "Moderate"
 * - medianResponseHours > 72: "Slow"
 */
export function determineResponsiveness(
  data: Partial<RepositoryActivityData> & { repository: string }
): ResponsivenessResult {
  const repo = data.repository;
  const sampleCount = data.sampleCount ?? 0;
  const medianHours = data.medianResponseHours;

  // Rule 1: Insufficient data threshold
  if (sampleCount < MIN_SAMPLE_THRESHOLD || medianHours === null || medianHours === undefined) {
    return {
      repository: repo,
      rating: "Not enough data",
      medianResponseHours: medianHours ?? null,
      sampleCount,
      ruleExplanation:
        "Fewer than 3 recent issues with maintainer discussions were found for this repository. Repositories with too little data show 'Not enough data' instead of a guess.",
      tooltipText:
        "Not enough data: Fewer than 3 recent discussions analyzed. Insufficient data to determine maintainer response time.",
      cachedAt: Date.now(),
    };
  }

  // Rule 2: Fast (<= 24 hours / 1 day)
  if (medianHours <= 24) {
    return {
      repository: repo,
      rating: "Fast",
      medianResponseHours: medianHours,
      sampleCount,
      ruleExplanation:
        "Median maintainer response time is 24 hours or less (<= 1 day). Maintainers actively respond to inquiries and PRs.",
      tooltipText: `Fast: Maintainers typically respond within 24 hours (~${medianHours}h median). Great for quick review cycles.`,
      cachedAt: Date.now(),
    };
  }

  // Rule 3: Moderate (between 24 and 72 hours / 1 to 3 days)
  if (medianHours <= 72) {
    return {
      repository: repo,
      rating: "Moderate",
      medianResponseHours: medianHours,
      sampleCount,
      ruleExplanation:
        "Median maintainer response time is between 24 and 72 hours (1 to 3 days). Standard open-source review pace.",
      tooltipText: `Moderate: Maintainers typically respond within 1 to 3 days (~${medianHours}h median).`,
      cachedAt: Date.now(),
    };
  }

  // Rule 4: Slow (> 72 hours / > 3 days)
  return {
    repository: repo,
    rating: "Slow",
    medianResponseHours: medianHours,
    sampleCount,
    ruleExplanation:
      "Median maintainer response time exceeds 72 hours (> 3 days). Review feedback and initial comments may be delayed.",
    tooltipText: `Slow: Maintainers take more than 3 days to respond (~${medianHours}h median). Expect potential delays.`,
    cachedAt: Date.now(),
  };
}

interface CacheEntry {
  result: ResponsivenessResult;
  cachedAt: number;
}

// In-memory cache for responsiveness signals
const responsivenessCache = new Map<string, CacheEntry>();

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<ResponsivenessResult>>();

function normalizeRepoKey(repo: string): string {
  return repo.trim().toLowerCase();
}

/**
 * Returns cached responsiveness result if present and within cache window.
 */
export function getCachedResponsiveness(
  repo: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): ResponsivenessResult | null {
  const key = normalizeRepoKey(repo);
  const entry = responsivenessCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.cachedAt < ttlMs) {
    return entry.result;
  }

  responsivenessCache.delete(key);
  return null;
}

/**
 * Stores a responsiveness result in the cache with a timestamp.
 */
export function setCachedResponsiveness(
  repo: string,
  result: ResponsivenessResult,
  timestamp: number = Date.now()
): void {
  const key = normalizeRepoKey(repo);
  responsivenessCache.set(key, {
    result,
    cachedAt: timestamp,
  });
}

/**
 * Clears all cached repository responsiveness records (useful for test isolation).
 */
export function clearResponsivenessCache(): void {
  responsivenessCache.clear();
  inFlightRequests.clear();
}

/**
 * Asynchronously retrieves the responsiveness signal for a repository.
 *
 * Guarantees:
 * - Checks cache first: returns cached entry if inside the cache window without extra API calls.
 * - Deduplicates in-flight calls: concurrent requests for the same repo share a single Promise.
 * - Respects GitHub API rate limits.
 */
export async function getRepoResponsiveness(
  repo: string,
  options?: {
    ttlMs?: number;
    fetcher?: (repo: string) => Promise<RepositoryActivityData>;
  }
): Promise<ResponsivenessResult> {
  const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
  const key = normalizeRepoKey(repo);

  // 1. Check Cache
  const cached = getCachedResponsiveness(repo, ttlMs);
  if (cached) {
    return cached;
  }

  // 2. Check In-flight deduplication
  const pending = inFlightRequests.get(key);
  if (pending) {
    return pending;
  }

  // 3. Initiate fetch with deduplication
  const fetchPromise = (async () => {
    try {
      let activity: RepositoryActivityData;

      if (options?.fetcher) {
        activity = await options.fetcher(repo);
      } else {
        // Check known demo repositories
        const known = KNOWN_REPO_ACTIVITY[repo];
        if (known) {
          activity = known;
        } else {
          // Default fallback for unindexed repos: insufficient data
          activity = {
            repository: repo,
            medianResponseHours: null,
            sampleCount: 0,
          };
        }
      }

      const result = determineResponsiveness(activity);
      setCachedResponsiveness(repo, result);
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}
