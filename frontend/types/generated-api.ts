/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from OpenAPI Specification (Issue #268)
 * Run: npm run codegen:types
 */

export interface GitHubUserProfile {
  /** GitHub user login handle */
  username: string;
  /** Display name */
  name?: string | null;
  /** Bio text */
  bio?: string | null;
  /** Avatar URL */
  avatar_url: string;
  /** Public repository count */
  public_repositories?: number;
  /** Followers count */
  followers?: number;
}

export interface IssueRecommendation {
  /** Issue unique ID */
  id: number;
  /** Issue title */
  title: string;
  /** HTML URL on GitHub */
  url: string;
  /** Repository full name */
  repository: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  /** Confidence score */
  match_score: number;
  match_reasons?: string[];
}
