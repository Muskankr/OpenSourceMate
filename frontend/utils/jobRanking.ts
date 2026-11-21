import type { JobListing, JobRecommendation } from "../types/jobs";

/**
 * Normalizes a skill string for consistent matching (lower-cased, trimmed).
 */
export function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

/**
 * Extracts a normalized Set of student skill names from either string[] or object[] format.
 */
export function extractStudentSkillSet(skills: (string | { name: string })[]): Set<string> {
  const normalized = new Set<string>();
  for (const s of skills) {
    if (typeof s === "string") {
      if (s.trim()) normalized.add(normalizeSkill(s));
    } else if (s && typeof s.name === "string") {
      if (s.name.trim()) normalized.add(normalizeSkill(s.name));
    }
  }
  return normalized;
}

/**
 * Generates an explanatory reason for why a job was recommended to a student.
 */
export function generateMatchReason(
  matchedSkills: string[],
  totalRequired: number,
  score: number
): string {
  if (matchedSkills.length === 0) {
    return "No direct skill overlap with your current profile; great learning opportunity.";
  }

  const matchedList = matchedSkills.join(", ");
  if (score >= 80) {
    return `Excellent fit: matches ${matchedSkills.length} of your core skills (${matchedList}).`;
  }
  if (score >= 50) {
    return `Good alignment: overlaps with ${matchedSkills.length} of ${totalRequired} required skills (${matchedList}).`;
  }
  return `Potential opportunity: matches your experience in ${matchedList}.`;
}

/**
 * Calculates skill overlap, score (0-100), matched/missing skills, and match explanation.
 */
export function evaluateJobMatch(
  listing: JobListing,
  studentSkills: Set<string>
): JobRecommendation {
  const required = listing.requiredSkills || [];
  const preferred = listing.preferredSkills || [];

  const matchedRequired: string[] = [];
  const missingSkills: string[] = [];
  const matchedPreferred: string[] = [];

  for (const skill of required) {
    if (studentSkills.has(normalizeSkill(skill))) {
      matchedRequired.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  for (const skill of preferred) {
    if (studentSkills.has(normalizeSkill(skill))) {
      matchedPreferred.push(skill);
    }
  }

  const totalRequired = required.length;
  let score = 0;

  if (totalRequired > 0) {
    const requiredRatio = matchedRequired.length / totalRequired;
    // Base score up to 85 points from required skills
    score = Math.round(requiredRatio * 85);

    // Preferred skills can add up to 15 points
    if (preferred.length > 0) {
      const preferredRatio = matchedPreferred.length / preferred.length;
      score += Math.round(preferredRatio * 15);
    } else if (matchedRequired.length === totalRequired) {
      score = 100;
    }
  } else {
    // If no explicit required skills listed, score based on preferred or default
    score = matchedPreferred.length > 0 ? 70 : 50;
  }

  score = Math.min(100, Math.max(0, score));

  const allMatched = [...matchedRequired, ...matchedPreferred];
  const matchReason = generateMatchReason(allMatched, totalRequired, score);

  return {
    ...listing,
    score,
    matchedSkills: allMatched,
    missingSkills,
    matchReason,
  };
}

/**
 * Ranks job listings by overlap with the student's skills and provides
 * match reasons and matched skills for each recommendation.
 *
 * Pluggable: Operates strictly on JobListing[] regardless of data source.
 */
export function rankJobListings(
  listings: JobListing[],
  studentSkills: (string | { name: string })[]
): JobRecommendation[] {
  const skillSet = extractStudentSkillSet(studentSkills);

  const evaluated = listings.map((job) => evaluateJobMatch(job, skillSet));

  // Sort descending by match score, then alphabetically by title
  return evaluated.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.title.localeCompare(b.title);
  });
}
