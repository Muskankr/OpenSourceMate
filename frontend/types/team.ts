import type { SkillItem, UserSkillsResponse } from "./api";

/**
 * State representing an individual user's fetched profile and skills in team mode.
 */
export interface TeamMemberState {
  username: string;
  loading: boolean;
  error: string | null;
  skills: UserSkillsResponse | null;
}

/**
 * A skill row in the team matrix.
 */
export interface TeamSkillRow {
  skillName: string;
  /**
   * Mapping of username -> repository count for this skill
   */
  userCoverage: Record<string, number>;
  /**
   * Total number of team members who possess this skill
   */
  coveredByCount: number;
  /**
   * List of usernames who cover this skill
   */
  coveredByUsers: string[];
  /**
   * Whether this skill is unique to exactly one team member (only one person knows)
   */
  isSingleExpert: boolean;
  /**
   * If isSingleExpert is true, the username of that single expert
   */
  singleExpertUsername?: string;
}

/**
 * Complete summary for the team matrix.
 */
export interface TeamSkillMatrixSummary {
  /**
   * Successfully analyzed usernames in order
   */
  analyzedUsers: string[];
  /**
   * Usernames that failed or encountered errors
   */
  failedUsers: { username: string; error: string }[];
  /**
   * Matrix rows sorted by coverage count descending, then alphabetically
   */
  skillsMatrix: TeamSkillRow[];
  /**
   * Skills that are known by only one person (Single points of failure / unique strengths)
   */
  singleExpertSkills: TeamSkillRow[];
  /**
   * Shared skills (known by 2 or more members)
   */
  sharedSkills: TeamSkillRow[];
  /**
   * Total distinct technologies covered across the team
   */
  totalDistinctSkills: number;
}
