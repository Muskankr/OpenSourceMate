import programsConfig from "../data/programs.json";
import type { ContributorProgram, IssueRecommendation } from "../types/api";

/**
 * Default programs configured in `data/programs.json`.
 */
export const DEFAULT_PROGRAMS: ContributorProgram[] =
  programsConfig.programs as ContributorProgram[];

/**
 * Returns all configured contributor programs.
 */
export function getProgramsConfig(): ContributorProgram[] {
  return DEFAULT_PROGRAMS;
}

/**
 * Finds a program by its ID, slug, or name (case-insensitive).
 */
export function findProgram(
  identifier: string | null | undefined,
  programsList: ContributorProgram[] = DEFAULT_PROGRAMS
): ContributorProgram | undefined {
  if (!identifier) return undefined;

  const clean = identifier.trim().toLowerCase();
  const cleanNorm = clean.replace(/[_ ]/g, "-");

  return programsList.find((prog) => {
    const id = prog.id.toLowerCase();
    const idNorm = id.replace(/[_ ]/g, "-");
    const name = prog.name.toLowerCase();

    return clean === id || cleanNorm === idNorm || clean === name;
  });
}

/**
 * Checks whether an issue carries any of the given program's labels or repository topics.
 *
 * Matching is case-insensitive and checks:
 * 1. Issue labels (e.g. "hacktoberfest", "nsoc", "nsoc2026")
 * 2. Issue or repository topics (e.g. "hacktoberfest", "nwoc")
 */
export function issueMatchesProgram(
  issue: IssueRecommendation,
  programInput: ContributorProgram | string
): boolean {
  const program = typeof programInput === "string" ? findProgram(programInput) : programInput;

  if (!program) return false;

  const targetLabels = new Set(program.labels.map((l) => l.trim().toLowerCase()));
  const targetTopics = new Set(program.topics.map((t) => t.trim().toLowerCase()));

  // 1. Check issue labels
  if (issue.labels && issue.labels.length > 0) {
    for (const label of issue.labels) {
      if (targetLabels.has(label.trim().toLowerCase())) {
        return true;
      }
    }
  }

  // 2. Check issue topics or repository topics if present
  const topics = issue.topics || [];
  for (const topic of topics) {
    if (targetTopics.has(topic.trim().toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Filters a list of issues by the selected program identifier.
 *
 * If programIdentifier is null, empty (""), or "all", all issues are returned
 * unchanged, preserving existing default behavior.
 */
export function filterIssuesByProgram(
  issues: IssueRecommendation[],
  programIdentifier: string | null | undefined,
  programsList: ContributorProgram[] = DEFAULT_PROGRAMS
): IssueRecommendation[] {
  if (
    !programIdentifier ||
    programIdentifier.trim() === "" ||
    programIdentifier.toLowerCase() === "all"
  ) {
    return issues;
  }

  const prog = findProgram(programIdentifier, programsList);
  if (!prog) {
    // If unknown program is passed, return empty or unfiltered depending on strictness
    return [];
  }

  return issues.filter((issue) => issueMatchesProgram(issue, prog));
}
