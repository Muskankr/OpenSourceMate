import type { SkillItem, UserSkillsResponse } from "../types/api";
import type { TeamMemberState, TeamSkillMatrixSummary, TeamSkillRow } from "../types/team";

export const MAX_TEAM_MEMBERS = 5;

/**
 * Normalizes a skill name for consistent case-insensitive grouping while preserving a canonical display name.
 */
export function normalizeSkillKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Parses a comma, space, or newline-separated list of usernames into a trimmed, deduplicated list.
 */
export function parseTeamUsernames(rawInput: string): string[] {
  if (!rawInput) return [];
  const parts = rawInput
    .split(/[\s,]+/)
    .map((u) => u.trim().replace(/^@/, ""))
    .filter(Boolean);

  // Deduplicate case-insensitively while preserving first casing
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const u of parts) {
    const lower = u.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(u);
    }
  }

  return unique;
}

/**
 * Computes the team skill matrix, coverage summary, and single-expert skills from member states.
 */
export function computeTeamSkillMatrix(
  members: TeamMemberState[]
): TeamSkillMatrixSummary {
  const analyzedUsers: string[] = [];
  const failedUsers: { username: string; error: string }[] = [];

  // Map normalized skill key -> { displayName, userCoverage: { [username]: repoCount } }
  const skillMap = new Map<
    string,
    {
      displayName: string;
      userCoverage: Record<string, number>;
      coveredByUsers: string[];
    }
  >();

  for (const member of members) {
    if (member.error) {
      failedUsers.push({ username: member.username, error: member.error });
      continue;
    }

    if (!member.skills || member.loading) {
      continue;
    }

    analyzedUsers.push(member.username);
    const userSkills: SkillItem[] = member.skills.skills || [];

    for (const skill of userSkills) {
      if (!skill || !skill.name) continue;
      const key = normalizeSkillKey(skill.name);
      const existing = skillMap.get(key);

      const repoCount =
        typeof skill.repository_count === "number"
          ? skill.repository_count
          : 1;

      if (existing) {
        existing.userCoverage[member.username] = repoCount;
        if (!existing.coveredByUsers.includes(member.username)) {
          existing.coveredByUsers.push(member.username);
        }
      } else {
        skillMap.set(key, {
          displayName: skill.name,
          userCoverage: { [member.username]: repoCount },
          coveredByUsers: [member.username],
        });
      }
    }
  }

  const rows: TeamSkillRow[] = [];

  for (const [, item] of skillMap.entries()) {
    const coveredCount = item.coveredByUsers.length;
    const isSingleExpert = coveredCount === 1;
    const singleExpertUsername = isSingleExpert ? item.coveredByUsers[0] : undefined;

    rows.push({
      skillName: item.displayName,
      userCoverage: item.userCoverage,
      coveredByCount: coveredCount,
      coveredByUsers: item.coveredByUsers,
      isSingleExpert,
      singleExpertUsername,
    });
  }

  // Sort rows: first by coveredByCount descending, then alphabetically by skillName
  rows.sort((a, b) => {
    if (b.coveredByCount !== a.coveredByCount) {
      return b.coveredByCount - a.coveredByCount;
    }
    return a.skillName.localeCompare(b.skillName);
  });

  const singleExpertSkills = rows.filter((r) => r.isSingleExpert);
  const sharedSkills = rows.filter((r) => r.coveredByCount >= 2);

  return {
    analyzedUsers,
    failedUsers,
    skillsMatrix: rows,
    singleExpertSkills,
    sharedSkills,
    totalDistinctSkills: rows.length,
  };
}
