import { generateMockUserProfile } from "./fixtures/users";
import { generateMockSkills } from "./fixtures/skills";
import { generateMockRepositories } from "./fixtures/repositories";
import { generateMockMatchedIssues } from "./fixtures/issues";

export interface MockRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
}

export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * Dispatches simulated API requests to appropriate mock route handlers.
 * Matches endpoints against standard OpenSourceMate backend paths.
 */
export function handleMockApiRequest(url: string, method?: string): MockResponse | null {
  const _reqMethod = method || "GET";
  void _reqMethod;
  const urlObj = new URL(url, "http://localhost:8000");
  const pathname = urlObj.pathname;

  // 1. Health Endpoint: /api/health or /health
  if (pathname === "/api/health" || pathname === "/health") {
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        status: "ok",
        service: "opensourcemate-api",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        mode: "mock",
        environment: "development",
      },
    };
  }

  // 2. User Repositories: /api/github/users/:username/repositories
  const repoMatch = pathname.match(/^\/api\/github\/users\/([^/]+)\/repositories\/?$/);
  if (repoMatch && repoMatch[1]) {
    const rawUsername = decodeURIComponent(repoMatch[1]);
    const mockCheck = checkSpecialMockConditions(rawUsername);
    if (mockCheck) return mockCheck;

    const allRepositories = generateMockRepositories(rawUsername);
    const pageParam = urlObj.searchParams.get("page");
    const perPageParam = urlObj.searchParams.get("per_page");
    const isPaginated = Boolean(pageParam || perPageParam);
    let repositories = allRepositories;
    let start = 0;

    if (isPaginated) {
      const page = Math.max(1, Number.parseInt(pageParam || "1", 10) || 1);
      const perPage = Math.max(1, Number.parseInt(perPageParam || "30", 10) || 30);
      start = (page - 1) * perPage;
      repositories = allRepositories.slice(start, start + perPage);
    }

    const backendPerPage = 100;
    const backendCap = 300;
    const totalPagesFetched =
      repositories.length === 0
        ? 0
        : isPaginated
          ? 1
          : Math.max(1, Math.ceil(repositories.length / backendPerPage));
    const hasMore = isPaginated
      ? start + repositories.length < allRepositories.length || allRepositories.length >= backendCap
      : repositories.length >= backendCap;

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        username: rawUsername,
        count: repositories.length,
        repository_count: repositories.length,
        total_pages_fetched: totalPagesFetched,
        has_more: hasMore,
        fetched_at: new Date().toISOString(),
        repositories,
      },
    };
  }

  // 3. User Skills: /api/github/users/:username/skills
  const skillsMatch = pathname.match(/^\/api\/github\/users\/([^/]+)\/skills\/?$/);
  if (skillsMatch && skillsMatch[1]) {
    const rawUsername = decodeURIComponent(skillsMatch[1]);
    const mockCheck = checkSpecialMockConditions(rawUsername);
    if (mockCheck) return mockCheck;

    const includeForks = urlObj.searchParams.get("include_forks") === "true";
    const skills = generateMockSkills(rawUsername, includeForks);
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: skills,
    };
  }

  // 4. User Profile: /api/github/users/:username
  const userMatch = pathname.match(/^\/api\/github\/users\/([^/]+)\/?$/);
  if (userMatch && userMatch[1]) {
    const rawUsername = decodeURIComponent(userMatch[1]);
    const mockCheck = checkSpecialMockConditions(rawUsername);
    if (mockCheck) return mockCheck;

    const profile = generateMockUserProfile(rawUsername);
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: profile,
    };
  }

  // 5. Matched Issues: /api/matching/users/:username/issues
  const matchingMatch = pathname.match(/^\/api\/matching\/users\/([^/]+)\/issues\/?$/);
  if (matchingMatch && matchingMatch[1]) {
    const rawUsername = decodeURIComponent(matchingMatch[1]);
    const mockCheck = checkSpecialMockConditions(rawUsername);
    if (mockCheck) return mockCheck;

    const skillsParams = urlObj.searchParams.getAll("skills");
    let explicitSkills: string[] | undefined = undefined;

    if (skillsParams.length > 0 || urlObj.searchParams.has("skills")) {
      explicitSkills = [];
      for (const s of skillsParams) {
        const parts = s
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        for (const p of parts) {
          if (!/^[a-zA-Z0-9+#.\- ]{1,50}$/.test(p)) {
            return {
              status: 400,
              headers: { "Content-Type": "application/json" },
              body: { error: { code: "BAD_REQUEST", message: `Invalid skill: '${p}'` } },
            };
          }
          if (!explicitSkills.includes(p)) {
            explicitSkills.push(p);
          }
        }
      }
    }

    const issues = generateMockMatchedIssues(rawUsername, explicitSkills);
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: issues,
    };
  }

  // Not matched by mock handler
  return null;
}

/**
 * Handles test fixture triggers such as 404, 403 rate limit, and 500 error scenarios.
 */
function checkSpecialMockConditions(username: string): MockResponse | null {
  const norm = username.toLowerCase().trim();

  if (norm === "not-found" || norm === "404" || norm === "invalid-user") {
    return {
      status: 404,
      headers: { "Content-Type": "application/json" },
      body: {
        error: {
          code: "NOT_FOUND",
          message: `GitHub user '${username}' not found.`,
          details: null,
        },
      },
    };
  }

  if (norm === "rate-limited" || norm === "403") {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 3600;
    return {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Reset": resetTimestamp.toString(),
      },
      body: {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "GitHub API rate limit exceeded.",
          reset_at: new Date(resetTimestamp * 1000).toISOString(),
        },
      },
    };
  }

  if (norm === "server-error" || norm === "500") {
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Simulated internal server failure in mock backend.",
          details: null,
        },
      },
    };
  }

  return null;
}
