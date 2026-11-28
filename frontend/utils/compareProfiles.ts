import type { SkillItem, UserSkillsResponse } from "../types/api";
import type { ProfileComparisonSummary, SharedSkillItem } from "../types/compare";

/**
 * Normalizes a skill name for robust case-insensitive comparison.
 */
export function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Computes comparative metrics between two developers' skill sets.
 * Handles missing or empty skills safely.
 *
 * @param user1Name Username of the first developer
 * @param skills1 Skills response for user 1 (or null/undefined)
 * @param user2Name Username of the second developer
 * @param skills2 Skills response for user 2 (or null/undefined)
 * @returns ProfileComparisonSummary containing shared and unique skills with repository counts
 */
export function computeProfileComparison(
  user1Name: string,
  skills1: UserSkillsResponse | null | undefined,
  user2Name: string,
  skills2: UserSkillsResponse | null | undefined
): ProfileComparisonSummary {
  const list1: SkillItem[] = skills1?.skills || [];
  const list2: SkillItem[] = skills2?.skills || [];

  const map1 = new Map<string, SkillItem>();
  for (const skill of list1) {
    if (skill && skill.name) {
      map1.set(normalizeSkillName(skill.name), skill);
    }
  }

  const map2 = new Map<string, SkillItem>();
  for (const skill of list2) {
    if (skill && skill.name) {
      map2.set(normalizeSkillName(skill.name), skill);
    }
  }

  const sharedSkills: SharedSkillItem[] = [];
  const uniqueSkillsUser1: SkillItem[] = [];
  const uniqueSkillsUser2: SkillItem[] = [];

  // Identify shared skills and unique skills for user 1
  for (const [normName, skill1] of map1.entries()) {
    const skill2 = map2.get(normName);
    if (skill2) {
      const u1Count = skill1.repository_count || 0;
      const u2Count = skill2.repository_count || 0;
      const total = u1Count + u2Count;
      const ratio = total > 0 ? u1Count / total : 0.5;

      let dominantUser: "user1" | "user2" | "equal" = "equal";
      if (u1Count > u2Count) dominantUser = "user1";
      else if (u2Count > u1Count) dominantUser = "user2";

      sharedSkills.push({
        name: skill1.name, // preserve original display casing
        user1RepositoryCount: u1Count,
        user1Percentage: skill1.percentage || 0,
        user2RepositoryCount: u2Count,
        user2Percentage: skill2.percentage || 0,
        totalCombinedRepositories: total,
        ratio,
        dominantUser,
      });
    } else {
      uniqueSkillsUser1.push(skill1);
    }
  }

  // Identify unique skills for user 2
  for (const [normName, skill2] of map2.entries()) {
    if (!map1.has(normName)) {
      uniqueSkillsUser2.push(skill2);
    }
  }

  // Sort shared skills by combined repository count descending
  sharedSkills.sort((a, b) => b.totalCombinedRepositories - a.totalCombinedRepositories);

  // Sort unique skills by repository count descending
  uniqueSkillsUser1.sort((a, b) => (b.repository_count || 0) - (a.repository_count || 0));
  uniqueSkillsUser2.sort((a, b) => (b.repository_count || 0) - (a.repository_count || 0));

  const totalUniqueCombined =
    sharedSkills.length + uniqueSkillsUser1.length + uniqueSkillsUser2.length;

  // Jaccard similarity index: shared / union
  const similarityScore =
    totalUniqueCombined > 0 ? Math.round((sharedSkills.length / totalUniqueCombined) * 100) : 0;

  return {
    user1: {
      username: user1Name,
      totalRepositoriesAnalyzed: skills1?.total_repositories_analyzed || 0,
      totalSkillsCount: list1.length,
    },
    user2: {
      username: user2Name,
      totalRepositoriesAnalyzed: skills2?.total_repositories_analyzed || 0,
      totalSkillsCount: list2.length,
    },
    sharedSkills,
    uniqueSkillsUser1,
    uniqueSkillsUser2,
    similarityScore,
    totalUniqueSkillsCombined: totalUniqueCombined,
  };
}
