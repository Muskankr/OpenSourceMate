/**
 * Theme management utility for OpenSourceMate.
 * Handles "light", "dark", and "system" theme preferences with persistence,
 * system preference detection, and document-level attribute synchronization.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme";

/**
 * Returns the user's OS / browser color scheme preference.
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "dark";
    }
  }
  return "dark";
}

/**
 * Reads the stored theme preference from localStorage, falling back to 'system'.
 */
export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage may be inaccessible (e.g. private mode restrictions)
  }
  return "system";
}

/**
 * Resolves the effective theme ('dark' | 'light') from a preference.
 */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return getSystemTheme();
}

/**
 * Synchronizes the resolved theme and preference onto the <html> element and colorScheme style.
 */
export function applyThemeToDocument(preference: ThemePreference, resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;
}

/**
 * Saves the theme preference to localStorage.
 */
export function persistThemePreference(preference: ThemePreference): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore storage failures
  }
}
