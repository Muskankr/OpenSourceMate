/**
 * Strongly-typed API interface definitions for OpenSourceMate.
 * Covers all endpoints exposed by the FastAPI backend server.
 */

export interface GitHubUserProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repositories: number;
  followers: number;
  following: number;
  profile_url: string;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
  twitter_username?: string | null;
  created_at?: string;
  public_gists?: number;
  fetched_at?: string;
}

export type ProficiencyLevel = "Learning" | "Comfortable" | "Strong";

export interface SkillItem {
  name: string;
  repository_count: number;
  percentage: number;
  type?: string | null;
  weight?: number | null;
  proficiency?: ProficiencyLevel;
  proficiency_score?: number;
  proficiency_reason?: string;
  group?: string | null;
}

export interface UserSkillsResponse {
  username: string;
  skills: SkillItem[];
  total_repositories_analyzed: number;
  analyzed_at?: string;
}

export interface IssueRecommendation {
  id: number;
  title: string;
  repository: string;
  url: string;
  state: string;
  labels: string[];
  comments: number;
  created_at: string;
  updated_at: string;
  language?: string;
  match_score?: number;
  score?: number;
  match_reasons?: string[];
  reasons?: string[];
  explanation?: string;
  is_ai_generated?: boolean;
  difficulty?: string;
  is_mock?: boolean;
  is_learning_mode?: boolean;
  learning_skill?: string;
}

export interface MatchedIssuesResponse {
  username: string;
  skills?: string[];
  recommendations: IssueRecommendation[];
  total?: number;
}

export interface RepositoryItem {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  is_fork: boolean;
  url: string;
  updated_at: string;
}

export interface UserRepositoriesResponse {
  username: string;
  repository_count: number;
  repositories: RepositoryItem[];
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp?: string;
}

export interface ApiErrorDetail {
  code?: string;
  message?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error?: ApiErrorDetail;
  detail?: string;
  reset_at?: string | null;
  status_code?: number;
}

export interface CompleteAnalysisResult {
  profile: GitHubUserProfile;
  skills: UserSkillsResponse;
  issues?: MatchedIssuesResponse;
}


/**
 * Type-level utility guards and assertion helpers for strict typing (Issue #139).
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

/**
 * Asserts that a value is non-null and non-undefined.
 */
export function assertNonNull<T>(val: Maybe<T>, message = "Value cannot be null or undefined"): asserts val is T {
  if (val === null || val === undefined) {
    throw new TypeError(message);
  }
}

/**
 * Non-throwing check if a value is defined and non-null.
 */
export function isDefined<T>(val: Maybe<T>): val is T {
  return val !== null && val !== undefined;
}

/**
 * Strict key lookup safe from prototype poisoning and unchecked index access.
 */
export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return typeof obj === "object" && obj !== null && Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Safe integer parser returning a fallback instead of NaN.
 */
export function safeParseInt(value: string | number | null | undefined, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.floor(value) : fallback;
  }
  if (!value) return fallback;
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Safe string trimmer returning empty string for nullish values.
 */
export function safeTrim(value: Maybe<string>): string {
  return value ? value.trim() : "";
}

/**
 * Discriminated union for asynchronous operation state machines.
 */
export type AsyncState<T, E = Error> =
  | { status: "idle"; data?: undefined; error?: undefined }
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: E };

/**
 * Paginated API envelope format.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
