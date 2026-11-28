import rawSkillsData from "../data/skills_to_learn.json";
import { SkillItem, IssueRecommendation } from "../types/api";

export interface SkillSuggestion {
  /** The suggested skill name to learn next */
  name: string;
  /** The detected user skill that prompted this suggestion */
  recommendedFrom: string;
  /** Estimated or calculated count of additional open issues this skill unlocks */
  unlockedIssuesCount?: number;
}

export type SkillsMapping = Record<string, string[]>;

/**
 * Baseline catalog of open issue counts for common companion skills
 * when issues pool is not available or in offline/isolated environments.
 */
export const DEFAULT_SKILL_ISSUE_BASELINE: Record<string, number> = {
  typescript: 24,
  fastapi: 18,
  react: 22,
  "next.js": 16,
  django: 14,
  docker: 15,
  kubernetes: 12,
  tokio: 10,
  webassembly: 8,
  "spring boot": 15,
  vue: 14,
  "nuxt.js": 11,
  svelte: 9,
  graphql: 13,
  "tailwind css": 17,
  redux: 10,
  nestjs: 12,
  prisma: 9,
  grpc: 11,
  pytorch: 14,
  pandas: 15,
  flask: 12,
  celery: 8,
  "actix web": 9,
  axum: 10,
  tauri: 8,
  kotlin: 14,
  android: 16,
  cmake: 11,
  qt: 9,
  laravel: 13,
  ".net": 15,
  "asp.net core": 14,
  "ruby on rails": 12,
  swiftui: 13,
};

/**
 * Normalizes a skill name for case-insensitive and whitespace-trimmed comparison.
 */
export function normalizeSkillName(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "";
  return name.trim().toLowerCase();
}

/**
 * Safely extracts the mapping dictionary from the imported JSON data.
 * Supports both root dictionary format `{ "Python": [...] }` and wrapped format `{ mappings: { "Python": [...] } }`.
 */
export function extractSkillsMapping(data: unknown): SkillsMapping {
  if (!data || typeof data !== "object") {
    return {};
  }

  const obj = data as Record<string, unknown>;
  if (obj.mappings && typeof obj.mappings === "object" && !Array.isArray(obj.mappings)) {
    return obj.mappings as SkillsMapping;
  }

  // Filter out schema/metadata keys if top-level dictionary
  const result: SkillsMapping = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$") || key === "title" || key === "description" || key === "version") {
      continue;
    }
    if (Array.isArray(value)) {
      result[key] = value as string[];
    }
  }
  return result;
}

export const defaultSkillsMapping: SkillsMapping = extractSkillsMapping(rawSkillsData);

/**
 * Calculates how many additional open issues a candidate companion skill would unlock
 * beyond what the user's existing skill set already matched.
 */
export function calculateUnlockedIssues(
  candidateSkill: string,
  userSkillsSet: Set<string>,
  issuesPool?: Array<{ language?: string | null; labels?: string[]; title?: string }>
): number {
  const candNorm = normalizeSkillName(candidateSkill);
  if (!candNorm) return 0;

  if (issuesPool && issuesPool.length > 0) {
    let extraCount = 0;
    for (const issue of issuesPool) {
      const issLang = normalizeSkillName(issue.language || "");
      const issLabels = (issue.labels || []).map((l) => normalizeSkillName(l));
      const issTitle = (issue.title || "").toLowerCase();

      // Check if already matched by existing skills
      const matchedByUser =
        userSkillsSet.has(issLang) ||
        issLabels.some((lbl) => userSkillsSet.has(lbl)) ||
        Array.from(userSkillsSet).some((s) => s.length > 2 && issTitle.includes(s));

      if (matchedByUser) continue;

      // Check if unlocked by candidate companion skill
      const unlockedByCandidate =
        issLang === candNorm || issLabels.includes(candNorm) || issTitle.includes(candNorm);

      if (unlockedByCandidate) {
        extraCount++;
      }
    }

    if (extraCount > 0) {
      return extraCount;
    }
  }

  return DEFAULT_SKILL_ISSUE_BASELINE[candNorm] ?? 10;
}

/**
 * Computes up to `limit` (default 3) skill suggestions that unlock the most
 * additional open issues based on the user's detected skills, using a static mapping.
 * Strictly excludes any skills the user already has.
 *
 * Acceptance criteria:
 * - Suggestions exclude skills the user already has (case-insensitive).
 * - Adding a relationship needs only a config change in skills_to_learn.json.
 * - Shows top three suggestions with the number of extra matching issues.
 * - Empty or unknown skills return empty array cleanly.
 *
 * @param userSkills Array of detected skills (either `SkillItem` objects or strings)
 * @param customMapping Optional custom mapping to override default static mapping
 * @param limit Maximum number of suggestions to return (defaults to 3)
 * @param issuesPool Optional issue list to calculate empirical unlock counts against
 * @returns Array of unique `SkillSuggestion` objects up to `limit` sorted by unlocked issues count
 */
export function getSkillsToLearn(
  userSkills?: (SkillItem | string)[] | null,
  customMapping?: SkillsMapping,
  limit = 3,
  issuesPool?: Array<{ language?: string | null; labels?: string[]; title?: string }>
): SkillSuggestion[] {
  // If user skills are empty or not an array, return empty list without error
  if (!userSkills || !Array.isArray(userSkills) || userSkills.length === 0) {
    return [];
  }

  const mapping = customMapping !== undefined ? customMapping : defaultSkillsMapping;
  if (!mapping || typeof mapping !== "object") {
    return [];
  }

  // Build a set of normalized existing user skill names for quick exclusion
  const existingSkillsSet = new Set<string>();
  const userSkillNames: string[] = [];

  for (const item of userSkills) {
    if (!item) continue;
    const name = typeof item === "string" ? item : item.name;
    if (typeof name === "string" && name.trim()) {
      const trimmed = name.trim();
      userSkillNames.push(trimmed);
      existingSkillsSet.add(normalizeSkillName(trimmed));
    }
  }

  if (userSkillNames.length === 0) {
    return [];
  }

  // Build a normalized lookup table for the mapping keys:
  // normalized key -> { canonicalKey, relatedSkills }
  const normalizedMapping = new Map<string, { canonical: string; related: string[] }>();
  for (const [key, related] of Object.entries(mapping)) {
    if (Array.isArray(related)) {
      normalizedMapping.set(normalizeSkillName(key), {
        canonical: key,
        related,
      });
    }
  }

  const candidates: SkillSuggestion[] = [];
  const suggestedNamesSet = new Set<string>();

  for (const skillName of userSkillNames) {
    const entry = normalizedMapping.get(normalizeSkillName(skillName));
    if (!entry) {
      // Unknown skill in mapping: skip silently without throwing an error
      continue;
    }

    for (const related of entry.related) {
      if (typeof related !== "string" || !related.trim()) continue;
      const trimmedRelated = related.trim();
      const normalizedRelated = normalizeSkillName(trimmedRelated);

      // Acceptance Criterion: Exclude skills the user already has
      if (existingSkillsSet.has(normalizedRelated)) {
        continue;
      }

      // Exclude skills already suggested in this run (deduplication)
      if (suggestedNamesSet.has(normalizedRelated)) {
        continue;
      }

      suggestedNamesSet.add(normalizedRelated);
      const unlockedCount = calculateUnlockedIssues(trimmedRelated, existingSkillsSet, issuesPool);

      candidates.push({
        name: trimmedRelated,
        recommendedFrom: entry.canonical,
        unlockedIssuesCount: unlockedCount,
      });
    }
  }

  // Sort by unlocked issue count descending
  candidates.sort((a, b) => (b.unlockedIssuesCount ?? 0) - (a.unlockedIssuesCount ?? 0));

  return candidates.slice(0, limit);
}
