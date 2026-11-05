/**
 * Build version and Git commit information utilities (Issue #188).
 */

export interface BuildVersionInfo {
  commitSha: string | null;
  shortSha: string;
  isDev: boolean;
  commitUrl: string | null;
  buildTime: string | null;
  repositoryUrl: string;
}

const REPO_URL = "https://github.com/Muskankr/OpenSourceMate";

/**
 * Resolves the active commit SHA from standard CI/CD and deployment environments.
 * Checks VERCEL_GIT_COMMIT_SHA, NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA, or NEXT_PUBLIC_GIT_COMMIT_SHA.
 */
export function getBuildCommitSha(): string | null {
  const sha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA;

  if (sha && typeof sha === "string" && sha.trim().length >= 7) {
    return sha.trim();
  }
  return null;
}

/**
 * Returns formatted build version details.
 * If running locally without a commit SHA, gracefully reports "dev".
 */
export function getBuildVersionInfo(): BuildVersionInfo {
  const commitSha = getBuildCommitSha();
  const repositoryUrl = process.env.NEXT_PUBLIC_GITHUB_REPO_URL || REPO_URL;

  if (commitSha) {
    const shortSha = commitSha.substring(0, 7);
    return {
      commitSha,
      shortSha,
      isDev: false,
      commitUrl: `${repositoryUrl}/commit/${commitSha}`,
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || null,
      repositoryUrl,
    };
  }

  return {
    commitSha: null,
    shortSha: "dev",
    isDev: true,
    commitUrl: null,
    buildTime: null,
    repositoryUrl,
  };
}
