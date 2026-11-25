import type { IssueRecommendation } from "../types/api";

export const DEFAULT_REPO_CAP = 3;

export interface CappedIssuesResult {
  visibleIssues: IssueRecommendation[];
  hiddenIssues: IssueRecommendation[];
  hiddenByRepo: Record<string, IssueRecommendation[]>;
  totalIssuesCount: number;
  cappedCount: number;
}

export function normalizeRepoName(repo?: string): string {
  return (repo || "unknown").trim().toLowerCase();
}

/**
 * Applies a configurable diversity cap on issues per repository.
 * Keeps the highest scoring issues up to `cap` per repository,
 * while strictly preserving the relative order of the remaining items.
 *
 * If `expandedRepos` contains a repository name, all issues for that repository
 * are kept visible in their original relative positions.
 *
 * @param issues Sorted list of recommended issues (highest score first)
 * @param cap Maximum issues allowed per repository (default: 3). If <= 0, no cap is enforced.
 * @param expandedRepos Set or array of repository identifiers that should have their cap lifted.
 */
export function applyRepoDiversityCap(
  issues: IssueRecommendation[],
  cap: number = DEFAULT_REPO_CAP,
  expandedRepos: Set<string> | string[] = new Set()
): CappedIssuesResult {
  const expandedSet =
    expandedRepos instanceof Set
      ? expandedRepos
      : new Set(expandedRepos.map((r) => normalizeRepoName(r)));

  const repoCounts: Record<string, number> = {};
  const visibleIssues: IssueRecommendation[] = [];
  const hiddenIssues: IssueRecommendation[] = [];
  const hiddenByRepo: Record<string, IssueRecommendation[]> = {};

  for (const issue of issues) {
    const repo = normalizeRepoName(issue.repository);
    const count = repoCounts[repo] || 0;
    const isExpanded = expandedSet.has(repo);

    if (cap <= 0 || isExpanded || count < cap) {
      repoCounts[repo] = count + 1;
      visibleIssues.push(issue);
    } else {
      hiddenIssues.push(issue);
      if (!hiddenByRepo[repo]) {
        hiddenByRepo[repo] = [];
      }
      hiddenByRepo[repo].push(issue);
    }
  }

  return {
    visibleIssues,
    hiddenIssues,
    hiddenByRepo,
    totalIssuesCount: issues.length,
    cappedCount: visibleIssues.length,
  };
}
