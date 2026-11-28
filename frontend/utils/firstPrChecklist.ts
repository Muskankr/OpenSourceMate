export interface FirstPrStep {
  id: string;
  title: string;
  description: string;
  linkLabel?: string;
  linkUrl?: string;
  command?: string;
}

export interface FirstPrLinks {
  contributingUrl: string | null;
  forkUrl: string;
  issueUrl: string;
  issueCommentUrl: string;
}

export interface FirstPrGitCommands {
  cloneAndBranch: string;
  commitAndPush: string;
}

/**
 * Extracts the GitHub issue number from an issue URL, falling back to fallbackId.
 */
export function extractIssueNumber(
  issueUrl: string,
  fallbackId?: number
): number | string {
  const match = issueUrl.match(/\/issues\/(\d+)/);
  if (match && match[1]) {
    return Number(match[1]);
  }
  return fallbackId ?? "issue";
}

/**
 * Builds repository and issue links for the First PR checklist.
 * Omits contributingUrl when hasContributing is false.
 */
export function buildChecklistLinks(
  repository: string,
  issueUrl: string,
  hasContributing: boolean
): FirstPrLinks {
  const cleanRepo = repository.trim().replace(/^\/+|\/+$/g, "");
  const cleanIssueUrl = issueUrl.trim().replace(/#.*$/, "");

  return {
    contributingUrl: hasContributing
      ? `https://github.com/${cleanRepo}/blob/HEAD/CONTRIBUTING.md`
      : null,
    forkUrl: `https://github.com/${cleanRepo}/fork`,
    issueUrl: cleanIssueUrl,
    issueCommentUrl: `${cleanIssueUrl}#new_comment_field`,
  };
}

/**
 * Generates copyable git commands pre-filled with the repository name and issue number.
 */
export function buildGitCommands(
  repository: string,
  issueNumber: number | string
): FirstPrGitCommands {
  const repoParts = repository.trim().split("/").filter(Boolean);
  const repoName = repoParts[1] || repoParts[0] || "repo";
  const branchName = `fix/issue-${issueNumber}`;

  return {
    cloneAndBranch: `git clone https://github.com/<your-username>/${repoName}.git && cd ${repoName} && git checkout -b ${branchName}`,
    commitAndPush: `git add . && git commit -m "fix: resolve #${issueNumber}" && git push -u origin ${branchName}`,
  };
}

/**
 * Builds the applicable First PR checklist steps for an issue.
 * Hides the CONTRIBUTING step when the repository has no CONTRIBUTING file.
 */
export function buildFirstPrSteps(options: {
  repository: string;
  issueUrl: string;
  issueId?: number;
  hasContributing: boolean;
}): FirstPrStep[] {
  const issueNumber = extractIssueNumber(options.issueUrl, options.issueId);
  const links = buildChecklistLinks(
    options.repository,
    options.issueUrl,
    options.hasContributing
  );
  const commands = buildGitCommands(options.repository, issueNumber);

  const steps: FirstPrStep[] = [];

  if (links.contributingUrl) {
    steps.push({
      id: "read-contributing",
      title: "Read the CONTRIBUTING guide",
      description: "Check setup instructions, coding conventions, and PR rules.",
      linkLabel: "Open CONTRIBUTING.md ↗",
      linkUrl: links.contributingUrl,
    });
  }

  steps.push(
    {
      id: "ask-assigned",
      title: "Ask to be assigned",
      description:
        "Leave a short, polite comment on the issue letting maintainers know you'd like to work on it.",
      linkLabel: "Comment on issue ↗",
      linkUrl: links.issueCommentUrl,
    },
    {
      id: "fork-and-branch",
      title: "Fork repository & create a branch",
      description: "Fork the repository to your GitHub account, clone it, and create a feature branch.",
      linkLabel: "Fork repository ↗",
      linkUrl: links.forkUrl,
      command: commands.cloneAndBranch,
    },
    {
      id: "run-tests",
      title: "Implement fix & run tests locally",
      description: "Verify existing tests pass and add tests covering your changes.",
    },
    {
      id: "open-pr",
      title: `Commit, push & open a PR referencing #${issueNumber}`,
      description: `Include "Closes #${issueNumber}" in your pull request description.`,
      linkLabel: "View issue ↗",
      linkUrl: links.issueUrl,
      command: commands.commitAndPush,
    }
  );

  return steps;
}

export function getChecklistStorageKey(
  repository: string,
  issueId: number | string
): string {
  return `opensourcemate_first_pr_checklist:${repository}:${issueId}`;
}

export function loadChecklistProgress(
  repository: string,
  issueId: number | string
): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(getChecklistStorageKey(repository, issueId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChecklistProgress(
  repository: string,
  issueId: number | string,
  progress: Record<string, boolean>
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getChecklistStorageKey(repository, issueId),
      JSON.stringify(progress)
    );
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}
