/**
 * Typed user contribution preference schema and storage utilities (Issue #191).
 */

export type ContributionGoal =
  | "learn"
  | "portfolio"
  | "gsoc"
  | "hacktoberfest"
  | "mentorship"
  | "general";

export type PreferredDifficulty =
  | "any"
  | "good-first-issue"
  | "intermediate"
  | "advanced";

export type TimeAvailability =
  | "casual"     // 1-3 hours/week
  | "regular"    // 4-8 hours/week
  | "dedicated"; // 10+ hours/week

export interface UserPreferences {
  goal: ContributionGoal;
  difficulty: PreferredDifficulty;
  includeLanguages: string[];
  excludeLanguages: string[];
  timeAvailability: TimeAvailability;
  onlyAssignedOpportunities: boolean;
  notifyOnNewMatches: boolean;
  updatedAt?: string;
}

export const DEFAULT_PREFERENCES: Readonly<UserPreferences> = {
  goal: "general",
  difficulty: "any",
  includeLanguages: [],
  excludeLanguages: [],
  timeAvailability: "regular",
  onlyAssignedOpportunities: false,
  notifyOnNewMatches: false,
};

const STORAGE_KEY = "osm_recommendation_preferences_v1";

/**
 * Safely loads user recommendation preferences from localStorage.
 * Guaranteed not to crash during SSR or when localStorage is blocked.
 */
export function loadUserPreferences(): UserPreferences {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      goal: parsed.goal || DEFAULT_PREFERENCES.goal,
      difficulty: parsed.difficulty || DEFAULT_PREFERENCES.difficulty,
      includeLanguages: Array.isArray(parsed.includeLanguages) ? parsed.includeLanguages : [],
      excludeLanguages: Array.isArray(parsed.excludeLanguages) ? parsed.excludeLanguages : [],
      timeAvailability: parsed.timeAvailability || DEFAULT_PREFERENCES.timeAvailability,
      onlyAssignedOpportunities: Boolean(parsed.onlyAssignedOpportunities),
      notifyOnNewMatches: Boolean(parsed.notifyOnNewMatches),
      updatedAt: parsed.updatedAt || undefined,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Persists user preferences into localStorage with exception guards.
 */
export function saveUserPreferences(prefs: UserPreferences): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    const payload: UserPreferences = {
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Resets user preferences back to initial default values.
 */
export function resetUserPreferences(): UserPreferences {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage clear errors
    }
  }
  return { ...DEFAULT_PREFERENCES };
}
