import type {
  RequirementItem,
  RequirementStatus,
  ContributionRequirementsResult,
} from "../types/api";

export type { RequirementItem, RequirementStatus, ContributionRequirementsResult };

/**
 * Cache TTL: 5 minutes (300,000 ms) for repository contribution requirements.
 */
export const DEFAULT_REQUIREMENTS_CACHE_TTL_MS = 5 * 60 * 1000;

export const DEFAULT_UNKNOWN_REQUIREMENTS = (
  repo: string
): ContributionRequirementsResult => ({
  repository: repo,
  contributing: {
    detected: false,
    name: null,
    url: null,
    status: "unknown",
  },
  code_of_conduct: {
    detected: false,
    name: null,
    url: null,
    status: "unknown",
  },
  license: {
    detected: false,
    name: null,
    url: null,
    status: "unknown",
  },
  cla_dco: {
    detected: false,
    name: null,
    url: null,
    status: "unknown",
  },
});

/**
 * Standard known repositories data for demo and offline fallbacks.
 */
export const KNOWN_REPO_REQUIREMENTS: Record<string, ContributionRequirementsResult> = {
  "vercel/next.js": {
    repository: "vercel/next.js",
    contributing: {
      detected: true,
      name: "Contributing Guide",
      url: "https://github.com/vercel/next.js/blob/canary/contributing.md",
      status: "present",
    },
    code_of_conduct: {
      detected: true,
      name: "Code of Conduct",
      url: "https://github.com/vercel/next.js/blob/canary/CODE_OF_CONDUCT.md",
      status: "present",
    },
    license: {
      detected: true,
      name: "MIT",
      url: "https://github.com/vercel/next.js/blob/canary/license.md",
      status: "present",
    },
    cla_dco: {
      detected: true,
      type: "CLA",
      name: "CLA Required",
      url: "https://github.com/vercel/next.js/blob/canary/contributing.md#contributor-license-agreement",
      status: "present",
    },
  },
  "facebook/react": {
    repository: "facebook/react",
    contributing: {
      detected: true,
      name: "Contributing Guide",
      url: "https://github.com/facebook/react/blob/main/CONTRIBUTING.md",
      status: "present",
    },
    code_of_conduct: {
      detected: true,
      name: "Code of Conduct",
      url: "https://github.com/facebook/react/blob/main/CODE_OF_CONDUCT.md",
      status: "present",
    },
    license: {
      detected: true,
      name: "MIT",
      url: "https://github.com/facebook/react/blob/main/LICENSE",
      status: "present",
    },
    cla_dco: {
      detected: true,
      type: "CLA",
      name: "CLA Required",
      url: "https://code.facebook.com/cla",
      status: "present",
    },
  },
  "torvalds/linux": {
    repository: "torvalds/linux",
    contributing: {
      detected: true,
      name: "Contributing Guide",
      url: "https://github.com/torvalds/linux/blob/master/Documentation/process/submitting-patches.rst",
      status: "present",
    },
    code_of_conduct: {
      detected: true,
      name: "Code of Conduct",
      url: "https://github.com/torvalds/linux/blob/master/CODE_OF_CONDUCT.md",
      status: "present",
    },
    license: {
      detected: true,
      name: "GPL-2.0",
      url: "https://github.com/torvalds/linux/blob/master/LICENSES/preferred/GPL-2.0",
      status: "present",
    },
    cla_dco: {
      detected: true,
      type: "DCO",
      name: "DCO (Signed-off-by)",
      url: "https://developercertificate.org/",
      status: "present",
    },
  },
};

interface CacheEntry {
  result: ContributionRequirementsResult;
  cachedAt: number;
}

const requirementsCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<ContributionRequirementsResult>>();

function normalizeRepoKey(repo: string): string {
  return repo.trim().toLowerCase();
}

export function getCachedRequirements(
  repo: string,
  ttlMs: number = DEFAULT_REQUIREMENTS_CACHE_TTL_MS
): ContributionRequirementsResult | null {
  const key = normalizeRepoKey(repo);
  const entry = requirementsCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.cachedAt < ttlMs) {
    return entry.result;
  }

  requirementsCache.delete(key);
  return null;
}

export function setCachedRequirements(
  repo: string,
  result: ContributionRequirementsResult,
  timestamp: number = Date.now()
): void {
  const key = normalizeRepoKey(repo);
  requirementsCache.set(key, {
    result,
    cachedAt: timestamp,
  });
}

export function clearRequirementsCache(): void {
  requirementsCache.clear();
  inFlightRequests.clear();
}

/**
 * Asynchronously retrieves repository contribution requirements with caching and request coalescing.
 */
export async function getRepoRequirements(
  repo: string,
  options?: {
    ttlMs?: number;
    fetcher?: (repo: string) => Promise<ContributionRequirementsResult>;
    bypassCache?: boolean;
  }
): Promise<ContributionRequirementsResult> {
  const ttlMs = options?.ttlMs ?? DEFAULT_REQUIREMENTS_CACHE_TTL_MS;
  const key = normalizeRepoKey(repo);

  // 1. Check cache
  if (!options?.bypassCache) {
    const cached = getCachedRequirements(repo, ttlMs);
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
      if (options?.fetcher) {
        const fetched = await options.fetcher(repo);
        setCachedRequirements(repo, fetched);
        return fetched;
      }

      if (KNOWN_REPO_REQUIREMENTS[key]) {
        const known = KNOWN_REPO_REQUIREMENTS[key];
        setCachedRequirements(repo, known);
        return known;
      }

      // Fetch from backend endpoint
      try {
        if (typeof fetch !== "undefined") {
          const res = await fetch(
            `/api/v1/repositories/requirements?repo=${encodeURIComponent(repo)}`
          );
          if (res.ok) {
            const data: ContributionRequirementsResult = await res.json();
            setCachedRequirements(repo, data);
            return data;
          }
        }
      } catch {
        // Fallback on network failure
      }

      const fallback = DEFAULT_UNKNOWN_REQUIREMENTS(repo);
      setCachedRequirements(repo, fallback);
      return fallback;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}
