/**
 * Shareable comparison URL builder and parameter parser (Issue #190).
 */

export interface CompareUrlParams {
  user1: string;
  user2: string;
}

/**
 * Parses user1 and user2 from query strings supporting both
 * the modern /compare?a=user1&b=user2 and legacy /compare?user1=user1&user2=user2 schemas.
 */
export function parseCompareParams(search: string | URLSearchParams): CompareUrlParams {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const user1 = (params.get("a") || params.get("user1") || "").trim().replace(/^@+/, "");
  const user2 = (params.get("b") || params.get("user2") || "").trim().replace(/^@+/, "");

  return { user1, user2 };
}

/**
 * Builds a canonical shareable comparison URL.
 */
export function buildCompareShareUrl(user1: string, user2: string, origin = ""): string {
  const clean1 = user1.trim().replace(/^@+/, "");
  const clean2 = user2.trim().replace(/^@+/, "");

  const searchParams = new URLSearchParams();
  if (clean1) searchParams.set("a", clean1);
  if (clean2) searchParams.set("b", clean2);

  const query = searchParams.toString();
  const path = query ? `/compare?${query}` : "/compare";
  return origin ? `${origin.replace(/\/$/, "")}${path}` : path;
}

/**
 * Checks whether two usernames are identical (case-insensitive).
 */
export function isDuplicateUsername(user1: string, user2: string): boolean {
  const clean1 = user1.trim().replace(/^@+/, "").toLowerCase();
  const clean2 = user2.trim().replace(/^@+/, "").toLowerCase();
  return Boolean(clean1 && clean2 && clean1 === clean2);
}
