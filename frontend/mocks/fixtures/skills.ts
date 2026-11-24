import type {
  ProficiencyLevel,
  RepositoryItem,
  SkillItem,
  UserSkillsResponse,
} from "../../types/api";
import { MOCK_REPOSITORIES } from "./repositories";
import languagesMultiJson from "../../../fixtures/languages/languages_multi.json";
import languagesSingleJson from "../../../fixtures/languages/languages_single.json";
import languagesEmptyJson from "../../../fixtures/languages/languages_empty.json";

export const SHARED_LANGUAGE_FIXTURES: Record<string, Record<string, number>> = {
  multi: languagesMultiJson,
  single: languagesSingleJson,
  empty: languagesEmptyJson,
};

const NOISE_LANGUAGES = new Set([
  "jupyter notebook",
  "dockerfile",
  "makefile",
  "cmake",
  "tex",
  "roff",
  "postscript",
  "rich text format",
  "gettext catalog",
  "vim script",
  "batchfile",
]);

function estimateProficiency(
  count: number,
  percentage: number
): {
  proficiency: ProficiencyLevel;
  proficiency_score: number;
} {
  if (count >= 5 && percentage >= 35) {
    return { proficiency: "Strong", proficiency_score: 88 };
  }
  if (count >= 2 || percentage >= 15) {
    return { proficiency: "Comfortable", proficiency_score: 70 };
  }
  return { proficiency: "Learning", proficiency_score: 48 };
}

/**
 * Derives deterministic mock skill metrics from a repository fixture list
 * and optional per-repository language byte breakdowns.
 */
export function buildSkillsFromRepositories(
  username: string,
  repositories: RepositoryItem[],
  includeForks = false,
  repoLanguages?: Record<string, Record<string, number>>
): UserSkillsResponse {
  const analyzed: Array<{ repo: RepositoryItem; weight: number }> = [];
  let excludedForksCount = 0;

  for (const repo of repositories) {
    if (!repo.is_fork) {
      analyzed.push({ repo, weight: 1.0 });
    } else if (includeForks) {
      analyzed.push({ repo, weight: 1.0 });
    } else {
      // In mock/test fixtures, repos with own commits or pushed > created
      // If repo has own commits, give 0.5x weight; otherwise exclude as pure fork
      const hasOwnCommits = (repo as any).has_own_commits;
      if (hasOwnCommits === true) {
        analyzed.push({ repo, weight: 0.5 });
      } else {
        excludedForksCount++;
      }
    }
  }

  const counts = new Map<string, number>();

  for (const { repo, weight } of analyzed) {
    const breakdown = repoLanguages?.[repo.name];
    const langs = breakdown ? Object.keys(breakdown) : [];
    if (langs.length > 0) {
      for (const language of langs) {
        if (NOISE_LANGUAGES.has(language.trim().toLowerCase())) {
          continue;
        }
        counts.set(language, (counts.get(language) ?? 0) + weight);
      }
    } else if (repo.language && !NOISE_LANGUAGES.has(repo.language.trim().toLowerCase())) {
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + weight);
    }
  }

  const totalWithLang = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
  const skills: SkillItem[] = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, repositoryCount]) => {
      const percentage =
        totalWithLang > 0 ? Number(((repositoryCount / totalWithLang) * 100).toFixed(2)) : 0;
      const { proficiency, proficiency_score } = estimateProficiency(Math.round(repositoryCount), percentage);
      return {
        name,
        repository_count: Number.isInteger(repositoryCount) ? repositoryCount : Number(repositoryCount.toFixed(2)),
        percentage,
        proficiency,
        proficiency_score,
        proficiency_reason: `Derived from ${repositoryCount} analyzed public repositories (${percentage}% share).`,
      };
    });

  return {
    username,
    total_repositories_analyzed: analyzed.length,
    excluded_forks_count: excludedForksCount,
    skills,
  };
}

export const MOCK_SKILLS: Record<string, UserSkillsResponse> = {
  // Legacy preset preserved for existing mockApi.test.ts expectations
  octocat: {
    username: "octocat",
    total_repositories_analyzed: 8,
    skills: [
      {
        name: "Ruby",
        repository_count: 5,
        percentage: 62.5,
        proficiency: "Strong",
        proficiency_score: 85,
        proficiency_reason: "Primary language across multiple core repositories.",
      },
      {
        name: "JavaScript",
        repository_count: 4,
        percentage: 50.0,
        proficiency: "Comfortable",
        proficiency_score: 70,
        proficiency_reason: "Frequent frontend integration scripts.",
      },
      {
        name: "HTML",
        repository_count: 3,
        percentage: 37.5,
        proficiency: "Comfortable",
        proficiency_score: 65,
        proficiency_reason: "Documentation and interface markup.",
      },
      {
        name: "CSS",
        repository_count: 2,
        percentage: 25.0,
        proficiency: "Learning",
        proficiency_score: 45,
        proficiency_reason: "Styling and theme customization.",
      },
    ],
  },
  "octocat-real": buildSkillsFromRepositories(
    "octocat-real",
    MOCK_REPOSITORIES["octocat-real"] ?? [],
    false,
    { "Hello-World": SHARED_LANGUAGE_FIXTURES.empty }
  ),
  torvalds: buildSkillsFromRepositories("torvalds", MOCK_REPOSITORIES.torvalds ?? []),
  gaearon: buildSkillsFromRepositories("gaearon", MOCK_REPOSITORIES.gaearon ?? []),
  "newbie-contributor": buildSkillsFromRepositories(
    "newbie-contributor",
    MOCK_REPOSITORIES["newbie-contributor"] ?? []
  ),
  "forks-only-dev": buildSkillsFromRepositories(
    "forks-only-dev",
    MOCK_REPOSITORIES["forks-only-dev"] ?? []
  ),
  alice: {
    username: "alice",
    total_repositories_analyzed: 32,
    skills: [
      {
        name: "TypeScript",
        repository_count: 25,
        percentage: 78.1,
        proficiency: "Strong",
        proficiency_score: 94,
        proficiency_reason: "Extensive full stack applications and libraries.",
      },
      {
        name: "Python",
        repository_count: 18,
        percentage: 56.2,
        proficiency: "Strong",
        proficiency_score: 88,
        proficiency_reason: "FastAPI backends and data automation pipelines.",
      },
      {
        name: "React",
        repository_count: 16,
        percentage: 50.0,
        proficiency: "Strong",
        proficiency_score: 86,
        proficiency_reason: "Frontend web applications and dashboards.",
      },
      {
        name: "Docker",
        repository_count: 10,
        percentage: 31.2,
        proficiency: "Comfortable",
        proficiency_score: 72,
        proficiency_reason: "Containerization and local compose setups.",
      },
      {
        name: "Go",
        repository_count: 6,
        percentage: 18.7,
        proficiency: "Learning",
        proficiency_score: 55,
        proficiency_reason: "Microservice utilities and CLI experiments.",
      },
    ],
  },
};

/**
 * Generates a realistic mock skills breakdown for any username.
 */
export function generateMockSkills(username: string, includeForks = false): UserSkillsResponse {
  const normalized = username.toLowerCase().trim();
  const fixtureRepos = MOCK_REPOSITORIES[normalized];
  if (includeForks && fixtureRepos) {
    return buildSkillsFromRepositories(normalized, fixtureRepos, true);
  }
  const matched = MOCK_SKILLS[normalized];
  if (matched) {
    return matched;
  }

  return {
    username,
    total_repositories_analyzed: 15,
    skills: [
      {
        name: "TypeScript",
        repository_count: 10,
        percentage: 66.7,
        proficiency: "Strong",
        proficiency_score: 85,
        proficiency_reason: "Identified in majority of analyzed repositories.",
      },
      {
        name: "Python",
        repository_count: 7,
        percentage: 46.7,
        proficiency: "Comfortable",
        proficiency_score: 75,
        proficiency_reason: "Consistent scripting and backend logic.",
      },
      {
        name: "React",
        repository_count: 6,
        percentage: 40.0,
        proficiency: "Comfortable",
        proficiency_score: 70,
        proficiency_reason: "UI component design and state workflows.",
      },
      {
        name: "CSS",
        repository_count: 4,
        percentage: 26.7,
        proficiency: "Learning",
        proficiency_score: 50,
        proficiency_reason: "Responsive layouts and UI styling.",
      },
    ],
  };
}
