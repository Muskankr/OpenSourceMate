"use client";

import React, { useEffect, useState } from "react";
import type { ThemePreference, ResolvedTheme } from "../utils/theme";

export interface ThemeToggleProps {
  theme?: "dark" | "light";
  preference?: ThemePreference;
  onChangePreference?: (preference: ThemePreference) => void;
  onToggleTheme?: () => void;
  className?: string;
  id?: string;
  showTextLabel?: boolean;
  variant?: "switch" | "segmented";
}

/**
 * Segmented 3-mode toggle: Light | Dark | System
 */
export function ThemeSegmentedToggle({
  preference = "system",
  resolvedTheme = "dark",
  onChangePreference,
  className = "",
  id = "theme-segmented-toggle",
}: {
  preference?: ThemePreference;
  resolvedTheme?: ResolvedTheme;
  onChangePreference?: (pref: ThemePreference) => void;
  className?: string;
  id?: string;
}) {
  const isDark = resolvedTheme === "dark";

  return (
    <div
      id={id}
      role="group"
      aria-label="Theme preference"
      data-testid="theme-toggle-segmented"
      className={`inline-flex items-center rounded-xl p-1 border text-xs font-medium transition-colors ${
        isDark ? "border-white/10 bg-white/5" : "border-gray-300 bg-gray-100"
      } ${className}`}
    >
      {/* Light Option */}
      <button
        type="button"
        aria-label="Switch to light mode"
        aria-pressed={preference === "light"}
        data-testid="theme-option-light"
        onClick={() => onChangePreference?.("light")}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
          preference === "light"
            ? isDark
              ? "bg-purple-600 text-white shadow-sm font-semibold"
              : "bg-white text-gray-900 shadow-sm font-semibold ring-1 ring-gray-200"
            : isDark
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <span aria-hidden="true">☀️</span>
        <span>Light</span>
      </button>

      {/* Dark Option */}
      <button
        type="button"
        aria-label="Switch to dark mode"
        aria-pressed={preference === "dark"}
        data-testid="theme-option-dark"
        onClick={() => onChangePreference?.("dark")}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
          preference === "dark"
            ? isDark
              ? "bg-purple-600 text-white shadow-sm font-semibold"
              : "bg-white text-gray-900 shadow-sm font-semibold ring-1 ring-gray-200"
            : isDark
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <span aria-hidden="true">🌙</span>
        <span>Dark</span>
      </button>

      {/* System Option */}
      <button
        type="button"
        aria-label="Switch to system theme"
        aria-pressed={preference === "system"}
        data-testid="theme-option-system"
        onClick={() => onChangePreference?.("system")}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
          preference === "system"
            ? isDark
              ? "bg-purple-600 text-white shadow-sm font-semibold"
              : "bg-white text-gray-900 shadow-sm font-semibold ring-1 ring-gray-200"
            : isDark
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <span aria-hidden="true">💻</span>
        <span>System</span>
      </button>
    </div>
  );
}

/**
 * An accessible theme toggle switch component.
 *
 * Supports both:
 * 1. 2-state accessible switch (`variant="switch"`), complying with WCAG 2.1 AA `role="switch"`
 * 2. 3-state segmented control (`variant="segmented"`), supporting Light, Dark, and System preferences
 */
export default function ThemeToggle({
  theme = "dark",
  preference,
  onChangePreference,
  onToggleTheme,
  className = "",
  id = "theme-toggle-switch",
  showTextLabel = false,
  variant,
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // If explicitly requested segmented or preference was provided with onChangePreference
  if (variant === "segmented" || (preference && onChangePreference && variant !== "switch")) {
    return (
      <ThemeSegmentedToggle
        id={id}
        preference={preference}
        resolvedTheme={theme}
        onChangePreference={onChangePreference}
        className={className}
      />
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggleTheme?.();
    }
  };

  const actionLabel = isDark ? "Switch to light mode" : "Switch to dark mode";
  const currentModeDescription = isDark ? "Dark theme active" : "Light theme active";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={actionLabel}
        title={actionLabel}
        onClick={onToggleTheme}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-200 outline-none
          focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2
          ${
            isDark
              ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/80 focus-visible:ring-offset-slate-950"
              : "border-slate-200 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 focus-visible:ring-offset-white shadow-sm"
          }`}
      >
        <span className="sr-only">
          {actionLabel}. Currently {currentModeDescription}.
        </span>

        {/* Decorative Icons with aria-hidden="true" */}
        {isDark ? (
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-slate-700 transition-transform duration-200 hover:-rotate-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {showTextLabel && (
        <span
          aria-hidden="true"
          className={`text-xs font-medium select-none ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {isDark ? "Dark" : "Light"}
        </span>
      )}

      {/* Screen reader live notification on theme change */}
      <span aria-live="polite" className="sr-only">
        {mounted ? currentModeDescription : ""}
      </span>
    </div>
  );
}
