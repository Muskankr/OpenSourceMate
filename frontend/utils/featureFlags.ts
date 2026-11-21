/**
 * Typed Feature Flags Configuration & Helpers for OpenSourceMate.
 *
 * Provides build-time and runtime feature flags for toggling in-progress features
 * across development, staging, and production environments.
 *
 * Rules:
 * - In production (`process.env.NODE_ENV === 'production'`), unreleased features default to `false`.
 * - In development or test, flags can be enabled via `NEXT_PUBLIC_FEATURE_*` environment variables.
 * - Flags can be dynamically overridden in tests or client sessions when permitted.
 */

export interface FeatureFlags {
  /** Enables pasted-text / resume skill analysis (Issue #342) */
  pastedTextAnalysis: boolean;
  /** Enables custom repository selection before profiling (Issue #343) */
  repositorySelection: boolean;
  /** Enables starred repository topics as user interest signals (Issue #344) */
  starredRepoInterests: boolean;
  /** Enables username autocomplete with debouncing and rate limiting (Issue #346) */
  usernameAutocomplete: boolean;
  /** Enables experimental AI-driven natural language match explanations */
  aiExplanations: boolean;
}

/**
 * Default production flag state. All unreleased features default strictly to false.
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  pastedTextAnalysis: false,
  repositorySelection: false,
  starredRepoInterests: false,
  usernameAutocomplete: false,
  aiExplanations: false,
};

/**
 * Parses an environment variable or string into a strict boolean.
 */
export function parseFlagValue(val: string | undefined, defaultValue = false): boolean {
  if (val === undefined || val === null || val === '') {
    return defaultValue;
  }
  const normalized = val.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

/**
 * Resolves current feature flags based on environment variables and defaults.
 */
export function getFeatureFlags(env: Record<string, string | undefined> = process.env): FeatureFlags {
  const isDevOrTest = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';

  return {
    pastedTextAnalysis: parseFlagValue(
      env.NEXT_PUBLIC_FEATURE_PASTED_TEXT_ANALYSIS,
      DEFAULT_FEATURE_FLAGS.pastedTextAnalysis
    ),
    repositorySelection: parseFlagValue(
      env.NEXT_PUBLIC_FEATURE_REPOSITORY_SELECTION,
      DEFAULT_FEATURE_FLAGS.repositorySelection
    ),
    starredRepoInterests: parseFlagValue(
      env.NEXT_PUBLIC_FEATURE_STARRED_REPO_INTERESTS,
      DEFAULT_FEATURE_FLAGS.starredRepoInterests
    ),
    usernameAutocomplete: parseFlagValue(
      env.NEXT_PUBLIC_FEATURE_USERNAME_AUTOCOMPLETE,
      DEFAULT_FEATURE_FLAGS.usernameAutocomplete
    ),
    aiExplanations: parseFlagValue(
      env.NEXT_PUBLIC_FEATURE_AI_EXPLANATIONS,
      DEFAULT_FEATURE_FLAGS.aiExplanations
    ),
  };
}

/**
 * Convenience helper to check if a specific feature flag is currently active.
 */
export function isFeatureEnabled(flagKey: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return Boolean(flags[flagKey]);
}
