/**
 * GitHub contributors helper for the homepage Contributors Wall (Issue #201).
 *
 * Fetches contributors straight from the public GitHub REST API (no token, so
 * the unauthenticated 60 requests/hour/IP limit applies) and normalises the
 * response into a small, safe shape for the UI.
 */

export const CONTRIBUTORS_REPO = "Muskankr/OpenSourceMate";
export const CONTRIBUTORS_PAGE_URL = `https://github.com/${CONTRIBUTORS_REPO}/graphs/contributors`;
export const DEFAULT_CONTRIBUTOR_LIMIT = 12;

const GITHUB_PROFILE_PREFIX = "https://github.com/";
// next.config.ts only allow-lists this avatar host for next/image.
const AVATAR_HOST_PREFIX = "https://avatars.githubusercontent.com/";

export interface Contributor {
  login: string;
  avatarUrl: string;
  profileUrl: string;
  contributions: number;
}

export type ContributorsErrorKind = "rate_limit" | "not_found" | "network" | "unknown";

export class ContributorsFetchError extends Error {
  readonly kind: ContributorsErrorKind;
  readonly status?: number;
  /** ISO timestamp at which the GitHub rate limit resets, when known. */
  readonly resetAt?: string;

  constructor(kind: ContributorsErrorKind, message: string, status?: number, resetAt?: string) {
    super(message);
    this.name = "ContributorsFetchError";
    this.kind = kind;
    this.status = status;
    this.resetAt = resetAt;
    Object.setPrototypeOf(this, ContributorsFetchError.prototype);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isBotAccount(login: string, type?: unknown): boolean {
  return type === "Bot" || /\[bot\]$/i.test(login);
}

/**
 * Converts the raw `/contributors` payload into display-ready contributors.
 * Drops bots, anonymous/malformed entries and duplicates; keeps API order
 * (GitHub already sorts by contribution count, descending).
 */
export function normalizeContributors(
  raw: unknown,
  limit = DEFAULT_CONTRIBUTOR_LIMIT
): Contributor[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const result: Contributor[] = [];

  for (const item of raw) {
    if (!isRecord(item)) continue;

    const { login, avatar_url: avatar, html_url: html, contributions, type } = item;
    if (typeof login !== "string" || login.trim() === "") continue;
    if (isBotAccount(login, type)) continue;
    if (typeof contributions !== "number" || !Number.isFinite(contributions) || contributions < 0)
      continue;

    const key = login.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      login,
      avatarUrl: typeof avatar === "string" && avatar.startsWith(AVATAR_HOST_PREFIX) ? avatar : "",
      profileUrl:
        typeof html === "string" && html.startsWith(GITHUB_PROFILE_PREFIX)
          ? html
          : `${GITHUB_PROFILE_PREFIX}${encodeURIComponent(login)}`,
      contributions,
    });

    if (result.length >= limit) break;
  }

  return result;
}

export interface FetchContributorsOptions {
  repo?: string;
  limit?: number;
  signal?: AbortSignal;
}

function readResetAt(headers: Headers): string | undefined {
  const reset = Number(headers.get("x-ratelimit-reset"));
  return Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000).toISOString() : undefined;
}

export async function fetchContributors(
  options: FetchContributorsOptions = {}
): Promise<Contributor[]> {
  const { repo = CONTRIBUTORS_REPO, limit = DEFAULT_CONTRIBUTOR_LIMIT, signal } = options;
  // Request a full page so bots filtered out locally don't leave the wall short.
  const url = `https://api.github.com/repos/${repo}/contributors?per_page=100`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (err instanceof Error && err.name === "AbortError") throw err;
    throw new ContributorsFetchError("network", "Could not reach GitHub.");
  }

  if (!response.ok) {
    const rateLimited =
      response.status === 429 ||
      (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0");

    if (rateLimited) {
      throw new ContributorsFetchError(
        "rate_limit",
        "GitHub API rate limit reached.",
        response.status,
        readResetAt(response.headers)
      );
    }
    if (response.status === 404) {
      throw new ContributorsFetchError("not_found", "Repository not found.", 404);
    }
    throw new ContributorsFetchError(
      "unknown",
      `GitHub responded with ${response.status}.`,
      response.status
    );
  }

  // 204 No Content: GitHub returns this for repositories with no commits.
  if (response.status === 204) return [];

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ContributorsFetchError(
      "unknown",
      "Unexpected response from GitHub.",
      response.status
    );
  }

  return normalizeContributors(data, limit);
}
