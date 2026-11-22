/**
 * Utility functions for persisting user-added and customized skills in browser localStorage.
 * Enables skills added by the user (coursework, private projects, college tools) to persist
 * across reloads and visits.
 */

export const CUSTOM_SKILLS_STORAGE_PREFIX = "osm_custom_skills_";

/**
 * Returns the normalized localStorage key for a given GitHub username.
 */
export function getCustomSkillsStorageKey(username: string): string {
  return `${CUSTOM_SKILLS_STORAGE_PREFIX}${username.trim().toLowerCase()}`;
}

/**
 * Loads customized skills array from browser localStorage for a given username.
 * Returns null if no custom skills have been stored or if running in SSR.
 */
export function loadCustomSkills(username: string): string[] | null {
  if (typeof window === "undefined" || !username) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(getCustomSkillsStorageKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves customized skills array to browser localStorage for a given username.
 */
export function saveCustomSkills(username: string, skills: string[]): void {
  if (typeof window === "undefined" || !username) {
    return;
  }
  try {
    const cleanSkills = Array.from(
      new Set(skills.map((s) => s.trim()).filter((s) => s.length > 0))
    );
    window.localStorage.setItem(getCustomSkillsStorageKey(username), JSON.stringify(cleanSkills));
  } catch {
    // Gracefully handle storage quota exceeded or disabled storage
  }
}

/**
 * Clears customized skills for a given username from browser localStorage.
 */
export function clearCustomSkills(username: string): void {
  if (typeof window === "undefined" || !username) {
    return;
  }
  try {
    window.localStorage.removeItem(getCustomSkillsStorageKey(username));
  } catch {
    // Ignore
  }
}
