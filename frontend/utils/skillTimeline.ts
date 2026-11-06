/**
 * Skill growth timeline aggregation utilities (Issue #195).
 * Groups public repository creation dates by year and language.
 */

export interface RepositoryTimelineInput {
  name: string;
  language: string | null;
  created_at: string; // ISO date
  is_fork?: boolean;
}

export interface YearLanguageGrowth {
  year: number;
  languages: Record<string, number>;
  totalRepositories: number;
}

export interface SkillTimelineData {
  years: number[];
  allLanguages: string[];
  growthByYear: YearLanguageGrowth[];
  totalEvaluated: number;
}

/**
 * Aggregates repository list into year-over-year technology growth trends.
 */
export function buildSkillTimeline(repos: RepositoryTimelineInput[]): SkillTimelineData {
  if (!repos || repos.length === 0) {
    return {
      years: [],
      allLanguages: [],
      growthByYear: [],
      totalEvaluated: 0,
    };
  }

  const languageSet = new Set<string>();
  const yearBuckets: Record<number, Record<string, number>> = {};

  for (const repo of repos) {
    if (repo.is_fork) continue; // Focus on original projects

    const date = new Date(repo.created_at);
    if (Number.isNaN(date.getTime())) continue;

    const year = date.getUTCFullYear();
    const lang = repo.language?.trim() || "Other";

    languageSet.add(lang);

    if (!yearBuckets[year]) {
      yearBuckets[year] = {};
    }
    yearBuckets[year][lang] = (yearBuckets[year][lang] || 0) + 1;
  }

  const sortedYears = Object.keys(yearBuckets)
    .map(Number)
    .sort((a, b) => a - b);

  const growthByYear: YearLanguageGrowth[] = sortedYears.map((year) => {
    const langs = yearBuckets[year] || {};
    const total = Object.values(langs).reduce((sum, count) => sum + count, 0);
    return {
      year,
      languages: langs,
      totalRepositories: total,
    };
  });

  const allLanguages = Array.from(languageSet).sort((a, b) => {
    // Sort "Other" to the end
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  return {
    years: sortedYears,
    allLanguages,
    growthByYear,
    totalEvaluated: repos.length,
  };
}

/**
 * Filters out minor languages that account for fewer than minRepositories across all years.
 */
export function filterMinorLanguages(
  timeline: SkillTimelineData,
  minRepositories = 2
): SkillTimelineData {
  const languageTotals: Record<string, number> = {};

  for (const yearData of timeline.growthByYear) {
    for (const [lang, count] of Object.entries(yearData.languages)) {
      languageTotals[lang] = (languageTotals[lang] || 0) + count;
    }
  }

  const majorLanguages = timeline.allLanguages.filter(
    (lang) => (languageTotals[lang] || 0) >= minRepositories
  );

  const filteredGrowth = timeline.growthByYear.map((yearData) => {
    const filteredLangs: Record<string, number> = {};
    let otherCount = 0;

    for (const [lang, count] of Object.entries(yearData.languages)) {
      if (majorLanguages.includes(lang)) {
        filteredLangs[lang] = count;
      } else {
        otherCount += count;
      }
    }

    if (otherCount > 0) {
      filteredLangs["Other"] = (filteredLangs["Other"] || 0) + otherCount;
    }

    return {
      year: yearData.year,
      languages: filteredLangs,
      totalRepositories: yearData.totalRepositories,
    };
  });

  return {
    ...timeline,
    allLanguages: majorLanguages.includes("Other") || filteredGrowth.some((g) => g.languages["Other"])
      ? [...majorLanguages.filter((l) => l !== "Other"), "Other"]
      : majorLanguages,
    growthByYear: filteredGrowth,
  };
}
