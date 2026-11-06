/**
 * GitHub Profile Health Checklist evaluator (Issue #194).
 * Evaluates student and developer profiles for open-source readiness without shaming scores.
 */

export interface ChecklistItem {
  id: string;
  title: string;
  passed: boolean;
  tip: string;
  impact: "high" | "medium" | "low";
}

export interface ProfileHealthInput {
  hasBio: boolean;
  bioLength: number;
  hasLocationOrCompany: boolean;
  hasWebsite: boolean;
  publicRepoCount: number;
  hasProfileReadme?: boolean;
  topReposWithDescriptionCount: number;
  topReposWithLicenseCount: number;
  topReposWithReadmeCount: number;
  topReposEvaluatedCount: number;
}

export interface ProfileHealthResult {
  passedCount: number;
  totalCount: number;
  items: ChecklistItem[];
}

export function evaluateProfileHealth(input: ProfileHealthInput): ProfileHealthResult {
  const items: ChecklistItem[] = [];

  // 1. Profile Bio
  const bioPassed = input.hasBio && input.bioLength >= 10;
  items.push({
    id: "bio",
    title: "Profile Bio & Interests",
    passed: bioPassed,
    tip: bioPassed
      ? "Great bio summarizing your technical focus!"
      : "Add a 1-2 sentence bio mentioning your preferred languages and open-source interests.",
    impact: "high",
  });

  // 2. Profile README
  const readmePassed = Boolean(input.hasProfileReadme);
  items.push({
    id: "profile_readme",
    title: "GitHub Special Profile README",
    passed: readmePassed,
    tip: readmePassed
      ? "Profile README is active and introduces your work."
      : "Create a repository matching your username (e.g. username/username) to showcase your projects and background.",
    impact: "high",
  });

  // 3. Location or Affiliation
  const contextPassed = Boolean(input.hasLocationOrCompany);
  items.push({
    id: "context",
    title: "Location or Organization",
    passed: contextPassed,
    tip: contextPassed
      ? "Helps maintainers and mentors understand your timezone."
      : "Specify your general location or timezone to help maintainers schedule reviews.",
    impact: "medium",
  });

  // 4. Personal Website or Portfolio Link
  const websitePassed = Boolean(input.hasWebsite);
  items.push({
    id: "website",
    title: "Portfolio or Social Link",
    passed: websitePassed,
    tip: websitePassed
      ? "Website link verified."
      : "Link your personal blog, LinkedIn, or portfolio to provide extra context to project maintainers.",
    impact: "low",
  });

  // 5. Repository Descriptions
  const totalTopRepos = Math.max(1, input.topReposEvaluatedCount);
  const descRatio = input.topReposWithDescriptionCount / totalTopRepos;
  const descPassed = descRatio >= 0.5;
  items.push({
    id: "repo_descriptions",
    title: "Repository Descriptions",
    passed: descPassed,
    tip: descPassed
      ? "Most repositories have clear descriptions."
      : "Add short descriptions to your top repositories so visitors quickly understand what each project does.",
    impact: "high",
  });

  // 6. Open Source Licenses
  const licenseRatio = input.topReposWithLicenseCount / totalTopRepos;
  const licensePassed = licenseRatio >= 0.5;
  items.push({
    id: "licenses",
    title: "Open-Source Licenses",
    passed: licensePassed,
    tip: licensePassed
      ? "Open-source licenses (MIT, Apache, etc.) detected."
      : "Add an open-source license (such as MIT or Apache 2.0) to your public repositories so others can legally use them.",
    impact: "medium",
  });

  const passedCount = items.filter((i) => i.passed).length;

  return {
    passedCount,
    totalCount: items.length,
    items,
  };
}
