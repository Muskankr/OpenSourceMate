"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type ThemePreference,
  type ResolvedTheme,
  getStoredThemePreference,
  resolveTheme,
  applyThemeToDocument,
  persistThemePreference,
  THEME_STORAGE_KEY,
} from "../utils/theme";

export interface UseThemeReturn {
  theme: ResolvedTheme;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  cycleTheme: () => void;
}

const THEME_CHANGE_EVENT = "os-theme-change";

export function useTheme(): UseThemeReturn {
  const [themePreference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window !== "undefined") {
      return getStoredThemePreference();
    }
    return "system";
  });

  const [theme, setThemeState] = useState<ResolvedTheme>(() => {
    if (typeof document !== "undefined") {
      const active = document.documentElement.dataset.theme;
      if (active === "light" || active === "dark") {
        return active;
      }
    }
    if (typeof window !== "undefined") {
      return resolveTheme(getStoredThemePreference());
    }
    return "dark";
  });

  // Apply theme to document on mount and whenever theme changes
  useEffect(() => {
    const initialPref = getStoredThemePreference();
    const resolved = resolveTheme(initialPref);
    setPreferenceState(initialPref);
    setThemeState(resolved);
    applyThemeToDocument(initialPref, resolved);
  }, []);

  // Listen to OS system preference changes (e.g. user toggles dark mode in OS settings)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Only react if current preference is "system"
      const currentPref = getStoredThemePreference();
      if (currentPref === "system") {
        const nextTheme: ResolvedTheme = e.matches ? "dark" : "light";
        setThemeState(nextTheme);
        applyThemeToDocument("system", nextTheme);
      }
    };

    // Modern API with fallback
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    } else {
      // @ts-ignore - legacy Safari support
      mediaQuery.addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemChange);
      } else {
        // @ts-ignore - legacy Safari support
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, []);

  // Listen to cross-tab or in-page theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newPref = e.newValue as ThemePreference;
        if (newPref === "light" || newPref === "dark" || newPref === "system") {
          const resolved = resolveTheme(newPref);
          setPreferenceState(newPref);
          setThemeState(resolved);
          applyThemeToDocument(newPref, resolved);
        }
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemePreference>;
      const newPref = customEvent.detail;
      if (newPref === "light" || newPref === "dark" || newPref === "system") {
        const resolved = resolveTheme(newPref);
        setPreferenceState(newPref);
        setThemeState(resolved);
        applyThemeToDocument(newPref, resolved);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
    };
  }, []);

  const setThemePreference = useCallback((newPref: ThemePreference) => {
    setPreferenceState(newPref);
    persistThemePreference(newPref);
    const resolved = resolveTheme(newPref);
    setThemeState(resolved);
    applyThemeToDocument(newPref, resolved);

    // Notify other hook instances in the same window
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: newPref }));
    }
  }, []);

  // Cycles through: light -> dark -> system -> light
  const cycleTheme = useCallback(() => {
    const cycle: ThemePreference[] = ["light", "dark", "system"];
    const currentIndex = cycle.indexOf(themePreference);
    const nextPref = cycle[(currentIndex + 1) % cycle.length] ?? "system";
    setThemePreference(nextPref);
  }, [themePreference, setThemePreference]);

  // Two-state toggle for backwards compatibility: dark <-> light
  const toggleTheme = useCallback(() => {
    const nextPref: ThemePreference = theme === "dark" ? "light" : "dark";
    setThemePreference(nextPref);
  }, [theme, setThemePreference]);

  return {
    theme,
    themePreference,
    setThemePreference,
    toggleTheme,
    cycleTheme,
  };
}
