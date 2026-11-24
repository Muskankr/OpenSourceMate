import type {
  HealthStatus,
  RepositoryHealthSignals,
  RepositoryHealthResult,
} from "../types/api";

export type { HealthStatus, RepositoryHealthSignals, RepositoryHealthResult };

/**
 * Minimum number of recent sampled issues/PRs required to make an accurate health determination.
 * Repositories below this threshold return "Unknown" instead of guessing.
 */
export const MIN_SAMPLE_THRESHOLD = 3;

/**
 * Default cache TTL: 5 minutes (300,000 ms) for repository health signals.
 */
export const DEFAULT_HEALTH_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Standard known repositories data for demo and offline fallbacks.
 */
export const KNOWN_REPO_HEALTH: Record<string, RepositoryHealthSignals> = {
  "vercel/next.js": {
    daysSinceLastCommit: 1,
    mergedPrShare: 0.82,
    medianResponseHours: 6.5,
    sampleCount: 20,
  },
  "facebook/react": {
    daysSinceLastCommit: 2,
    mergedPrShare: 0.74,
    medianResponseHours: 24.0,
    sampleCount: 20,
  },
  "tiangolo/fastapi": {
    daysSinceLastCommit: 4,
    mergedPrShare: 0.65,
    medianResponseHours: 18.0,
    sampleCount: 16,
  },
  "tailwindlabs/tailwindcss": {
    daysSinceLastCommit: 3,
    mergedPrShare: 0.7,
    medianResponseHours: 14.0,
    sampleCount: 15,
  },
  "golang/go": {
    daysSinceLastCommit: 1,
    mergedPrShare: 0.6,
    medianResponseHours: 42.0,
    sampleCount: 20,
  },
  "BurntSushi/ripgrep": {
    daysSinceLastCommit: 45,
    mergedPrShare: 0.35,
    medianResponseHours: 96.0,
    sampleCount: 8,
  },
  "legacy/archived-project": {
    daysSinceLastCommit: 140,
    mergedPrShare: 0.05,
    medianResponseHours: 250.0,
    sampleCount: 10,
  },
};

/**
 * Deterministically evaluates repository health signals against threshold rules.
 *
 * Rules:
 * - sampleCount < MIN_SAMPLE_THRESHOLD (3) or daysSinceLastCommit is null/undefined: "Unknown"
 * - daysSinceLastCommit <= 30 && mergedPrShare >= 0.50 && medianResponseHours <= 48: "Active"
 * - daysSinceLastCommit <= 90 && mergedPrShare >= 0.20 && medianResponseHours <= 168: "Slow"
 * - Otherwise: "Inactive"
 */
export function determineHealthStatus(
  data: RepositoryHealthSignals & { repository: string }
): RepositoryHealthResult {
  const repo = data.repository;
  const sampleCount = data.sampleCount ?? 0;
  const daysSinceCommit = data.daysSinceLastCommit;
  const mergedPrShare = data.mergedPrShare;
  const medianResponseHours = data.medianResponseHours;

  // Rule 1: Insufficient data threshold -> Unknown
  if (
    sampleCount < MIN_SAMPLE_THRESHOLD ||
    daysSinceCommit === null ||
    daysSinceCommit === undefined
  ) {
    return {
      repository: repo,
      status: "Unknown",
      daysSinceLastCommit: daysSinceCommit ?? null,
      mergedPrShare: mergedPrShare ?? null,
      medianResponseHours: medianResponseHours ?? null,
      sampleCount,
      ruleExplanation:
        "Fewer than 3 recent issues/PRs or no commits found for this repository. Repositories with too little data show 'Unknown' instead of guessing.",
      tooltipText:
        "Unknown: Insufficient recent activity data (fewer than 3 items sampled) to determine repository health.",
      cachedAt: Date.now(),
    };
  }

  // Rule 2: Active
  if (
    daysSinceCommit <= 30 &&
    mergedPrShare !== null &&
    mergedPrShare !== undefined &&
    mergedPrShare >= 0.5 &&
    medianResponseHours !== null &&
    medianResponseHours !== undefined &&
    medianResponseHours <= 48
  ) {
    return {
      repository: repo,
      status: "Active",
      daysSinceLastCommit: daysSinceCommit,
      mergedPrShare,
      medianResponseHours,
      sampleCount,
      ruleExplanation: `Last commit was ${Math.round(
        daysSinceCommit
      )} days ago (<= 30d), ${Math.round(
        mergedPrShare * 100
      )}% recent PRs merged (>= 50%), and median response time is ~${medianResponseHours}h (<= 48h). Maintainers actively respond and merge contributions.`,
      tooltipText: `Active: Last commit ${Math.round(daysSinceCommit)}d ago, ${Math.round(
        mergedPrShare * 100
      )}% recent PRs merged, median response ~${medianResponseHours}h. Maintainers are actively shipping and reviewing.`,
      cachedAt: Date.now(),
    };
  }

  // Rule 3: Slow
  if (
    daysSinceCommit <= 90 &&
    (mergedPrShare === null || mergedPrShare === undefined || mergedPrShare >= 0.2) &&
    (medianResponseHours === null || medianResponseHours === undefined || medianResponseHours <= 168)
  ) {
    const prPct =
      mergedPrShare !== null && mergedPrShare !== undefined
        ? `${Math.round(mergedPrShare * 100)}%`
        : "N/A";
    const respTime =
      medianResponseHours !== null && medianResponseHours !== undefined
        ? `~${medianResponseHours}h`
        : "N/A";

    return {
      repository: repo,
      status: "Slow",
      daysSinceLastCommit: daysSinceCommit,
      mergedPrShare: mergedPrShare ?? null,
      medianResponseHours: medianResponseHours ?? null,
      sampleCount,
      ruleExplanation: `Last commit was ${Math.round(
        daysSinceCommit
      )} days ago (<= 90d), ${prPct} recent PRs merged, and median response time is ${respTime}. Reviews and merges proceed at a slower pace.`,
      tooltipText: `Slow: Last commit ${Math.round(
        daysSinceCommit
      )}d ago, ${prPct} recent PRs merged, median response ${respTime}. Maintainers respond, but reviews may take time.`,
      cachedAt: Date.now(),
    };
  }

  // Rule 4: Inactive
  const prPct =
    mergedPrShare !== null && mergedPrShare !== undefined
      ? `${Math.round(mergedPrShare * 100)}%`
      : "0%";
  const respTime =
    medianResponseHours !== null && medianResponseHours !== undefined
      ? `~${medianResponseHours}h`
      : ">7d";

  return {
    repository: repo,
    status: "Inactive",
    daysSinceLastCommit: daysSinceCommit,
    mergedPrShare: mergedPrShare ?? null,
    medianResponseHours: medianResponseHours ?? null,
    sampleCount,
    ruleExplanation: `Last commit was ${Math.round(
      daysSinceCommit
    )} days ago (> 90d), PR merge rate is ${prPct}, or median response time exceeds 7 days. Maintainer activity is currently stalled.`,
    tooltipText: `Inactive: Last commit ${Math.round(
      daysSinceCommit
    )}d ago, ${prPct} recent PRs merged, median response ${respTime}. Minimal maintainer activity in recent months.`,
    cachedAt: Date.now(),
  };
}

interface CacheEntry {
  result: RepositoryHealthResult;
  cachedAt: number;
}

const healthCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<RepositoryHealthResult>>();

function normalizeRepoKey(repo: string): string {
  return repo.trim().toLowerCase();
}

/**
 * Returns cached health result if present and within cache window.
 */
export function getCachedHealth(
  repo: string,
  ttlMs: number = DEFAULT_HEALTH_CACHE_TTL_MS
): RepositoryHealthResult | null {
  const key = normalizeRepoKey(repo);
  const entry = healthCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.cachedAt < ttlMs) {
    return entry.result;
  }

  healthCache.delete(key);
  return null;
}

/**
 * Stores health result in the cache with a timestamp.
 */
export function setCachedHealth(
  repo: string,
  result: RepositoryHealthResult,
  timestamp: number = Date.now()
): void {
  const key = normalizeRepoKey(repo);
  healthCache.set(key, {
    result,
    cachedAt: timestamp,
  });
}

/**
 * Clears cached repository health records.
 */
export function clearHealthCache(): void {
  healthCache.clear();
  inFlightRequests.clear();
}

/**
 * Asynchronously retrieves repository health signals, respecting cache and rate limits.
 */
export async function getRepoHealth(
  repo: string,
  options?: {
    ttlMs?: number;
    fetcher?: (repo: string) => Promise<RepositoryHealthSignals>;
    bypassCache?: boolean;
  }
): Promise<RepositoryHealthResult> {
  const ttlMs = options?.ttlMs ?? DEFAULT_HEALTH_CACHE_TTL_MS;
  const key = normalizeRepoKey(repo);

  // 1. Check cache
  if (!options?.bypassCache) {
    const cached = getCachedHealth(repo, ttlMs);
    if (cached) {
      return cached;
    }
  }

  // 2. Coalesce in-flight requests
  const pending = inFlightRequests.get(key);
  if (pending) {
    return pending;
  }

  // 3. Initiate fetch with deduplication
  const fetchPromise = (async () => {
    try {
      let signals: RepositoryHealthSignals;

      if (options?.fetcher) {
        signals = await options.fetcher(repo);
      } else if (KNOWN_REPO_HEALTH[key]) {
        signals = KNOWN_REPO_HEALTH[key];
      } else {
        // Fetch from backend health endpoint
        try {
          if (typeof fetch !== "undefined") {
            const res = await fetch(`/api/v1/repositories/health?repo=${encodeURIComponent(repo)}`);
            if (res.ok) {
              const data = await res.json();
              const result: RepositoryHealthResult = {
                repository: repo,
                status: data.status,
                daysSinceLastCommit: data.days_since_last_commit,
                mergedPrShare: data.merged_pr_share,
                medianResponseHours: data.median_response_hours,
                sampleCount: data.sample_count ?? 0,
                tooltipText: data.tooltip_text,
                ruleExplanation: data.rule_explanation,
                cachedAt: Date.now(),
              };
              setCachedHealth(repo, result);
              return result;
            }
          }
        } catch {
          // Network error or offline
        }

        // Fallback for unavailable or unindexed repos: insufficient data
        signals = {
          daysSinceLastCommit: null,
          mergedPrShare: null,
          medianResponseHours: null,
          sampleCount: 0,
        };
      }

      const result = determineHealthStatus({
        ...signals,
        repository: repo,
      });
      setCachedHealth(repo, result);
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}
