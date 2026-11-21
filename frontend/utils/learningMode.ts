import type { IssueRecommendation } from "../types/api";
import { inferIssueDifficulty, type IssueDifficulty } from "../data/mockIssues";

export interface LearningScoreResult {
  score: number;
  matchedSkill: string | null;
  isTargetMatch: boolean;
  explanation: string;
  reasons: string[];
}

/**
 * Curated list of popular target skills and companion technologies
 * available for selection in Learning Mode.
 */
export const COMMON_TARGET_SKILLS: string[] = [
  "Python",
  "Rust",
  "Go",
  "TypeScript",
  "React",
  "CSS",
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesWord(text: string, word: string): boolean {
  const pattern = new RegExp(`(^|[^a-zA-Z0-9+#.-])${escapeRegex(word)}($|[^a-zA-Z0-9+#.-])`, "i");
  return pattern.test(text);
}

/**
 * Checks if an issue matches a target skill via language, labels, title, or repository.
 * Uses word-boundary matching to prevent false positives (e.g. "go" matching "good").
 */
export function isIssueMatchingSkill(issue: IssueRecommendation, skill: string): boolean {
  const target = skill.trim().toLowerCase();
  if (!target) return false;

  // Language match (e.g. "Rust" === "rust")
  if (issue.language && issue.language.toLowerCase() === target) {
    return true;
  }

  // Label match (e.g. "rust", "python", "pydantic-v2")
  if (issue.labels && issue.labels.some((l) => matchesWord(l, target))) {
    return true;
  }

  // Title match
  if (issue.title && matchesWord(issue.title, target)) {
    return true;
  }

  // Repository match (e.g. "tiangolo/fastapi" matches "fastapi")
  if (issue.repository && matchesWord(issue.repository, target)) {
    return true;
  }

  return false;
}

/**
 * Finds the first target skill that the issue matches, if any.
 */
export function findMatchingTargetSkill(
  issue: IssueRecommendation,
  targetSkills: string[]
): string | null {
  for (const skill of targetSkills) {
    if (isIssueMatchingSkill(issue, skill)) {
      return skill;
    }
  }
  return null;
}

/**
 * Computes a transparent learning score for an issue against chosen target skills.
 *
 * Rules:
 * 1. Non-matching issues are scaled down so target skills are favored.
 * 2. Issues matching a target skill receive a substantial boost.
 * 3. Beginner-friendly issues in the chosen skills receive the highest score (95-99).
 * 4. Intermediate issues receive a moderate score (85-92).
 * 5. Advanced issues receive a lower boost (75-79), ensuring beginner issues rank higher.
 * 6. Generates clear explanations explaining why the issue was picked.
 */
export function calculateLearningScore(
  issue: IssueRecommendation,
  targetSkills: string[]
): LearningScoreResult {
  const matchedSkill = findMatchingTargetSkill(issue, targetSkills);
  const isTargetMatch = matchedSkill !== null;
  const originalScore = issue.match_score ?? issue.score ?? 75;
  const difficulty: IssueDifficulty =
    (issue.difficulty as IssueDifficulty) || inferIssueDifficulty(issue.labels);

  if (!isTargetMatch) {
    return {
      score: Math.max(30, Math.min(65, originalScore - 30)),
      matchedSkill: null,
      isTargetMatch: false,
      explanation: issue.explanation || "General recommendation based on your profile.",
      reasons: issue.match_reasons ?? issue.reasons ?? [],
    };
  }

  let baseScore = 75;
  if (difficulty === "Beginner") {
    baseScore = 95;
  } else if (difficulty === "Intermediate") {
    baseScore = 85;
  } else {
    baseScore = 75;
  }

  // Micro bonus for deterministic tie-breaking based on original match confidence
  const tieBreaker = Math.min(4, Math.floor(originalScore % 5));
  const finalScore = Math.min(99, baseScore + tieBreaker);

  const explanation =
    difficulty === "Beginner"
      ? `Picked for Learning Mode: beginner-friendly starter issue to help you learn and grow into ${matchedSkill}.`
      : `Picked for Learning Mode: ${difficulty.toLowerCase()} ${matchedSkill} issue to build your hands-on experience.`;

  const reasons = [
    `Target learning skill: ${matchedSkill}`,
    `${difficulty} difficulty: ideal for learning new technologies`,
    ...(issue.match_reasons ?? issue.reasons ?? []).slice(0, 1),
  ];

  return {
    score: finalScore,
    matchedSkill,
    isTargetMatch: true,
    explanation,
    reasons,
  };
}

/**
 * Reranks a list of issues when Learning Mode is active.
 *
 * If Learning Mode is off or no target skills are selected, returns the issues unchanged.
 * If Learning Mode is on, ranks beginner-friendly issues in the chosen skills higher.
 */
export function rankIssuesForLearningMode(
  issues: IssueRecommendation[],
  targetSkills: string[],
  isLearningMode: boolean = true
): IssueRecommendation[] {
  if (!isLearningMode || !targetSkills || targetSkills.length === 0) {
    return issues;
  }

  const normalizedTargets = targetSkills.map((s) => s.trim()).filter(Boolean);
  if (normalizedTargets.length === 0) {
    return issues;
  }

  const scoredIssues = issues.map((issue) => {
    const learningResult = calculateLearningScore(issue, normalizedTargets);
    if (!learningResult.isTargetMatch) {
      return {
        ...issue,
        match_score: learningResult.score,
        is_learning_mode: false,
      };
    }

    return {
      ...issue,
      match_score: learningResult.score,
      explanation: learningResult.explanation,
      match_reasons: learningResult.reasons,
      is_learning_mode: true,
      learning_skill: learningResult.matchedSkill || undefined,
    };
  });

  return [...scoredIssues].sort((a, b) => {
    const scoreA = a.match_score ?? a.score ?? 0;
    const scoreB = b.match_score ?? b.score ?? 0;
    return scoreB - scoreA;
  });
}
