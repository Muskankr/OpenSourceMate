"use client";

import React from "react";
import { type MatchingPreferences } from "../utils/preferences";

export interface ActivePreferencesBarProps {
  preferences: MatchingPreferences;
  onReset: () => void;
  className?: string;
  theme?: "dark" | "light";
}

export default function ActivePreferencesBar({
  preferences,
  onReset,
  className = "",
  theme = "dark",
}: ActivePreferencesBarProps) {
  const isDark = theme === "dark";

  const { preferredLanguages, excludedOrgs, maxAgeDays, expectedTime } = preferences;
  const hasPrefs =
    (preferredLanguages && preferredLanguages.length > 0) ||
    (excludedOrgs && excludedOrgs.length > 0) ||
    maxAgeDays !== null ||
    expectedTime !== null;

  if (!hasPrefs) return null;

  return (
    <div
      data-testid="active-preferences-bar"
      className={`mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border p-3 text-xs ${
        isDark
          ? "border-purple-500/30 bg-purple-500/10 text-purple-200"
          : "border-purple-200 bg-purple-50 text-purple-900"
      } ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-purple-300">Active Preferences:</span>

        {preferredLanguages && preferredLanguages.length > 0 && (
          <span
            data-testid="active-pref-languages"
            className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-emerald-300 border border-emerald-500/30"
          >
            Languages: {preferredLanguages.join(", ")}
          </span>
        )}

        {excludedOrgs && excludedOrgs.length > 0 && (
          <span
            data-testid="active-pref-excluded"
            className="rounded-lg bg-red-500/20 px-2 py-0.5 text-red-300 border border-red-500/30"
          >
            Excluded: {excludedOrgs.join(", ")}
          </span>
        )}

        {maxAgeDays !== null && (
          <span
            data-testid="active-pref-age"
            className="rounded-lg bg-blue-500/20 px-2 py-0.5 text-blue-300 border border-blue-500/30"
          >
            Max Age: {maxAgeDays} days
          </span>
        )}

        {expectedTime !== null && (
          <span
            data-testid="active-pref-time"
            className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-amber-300 border border-amber-500/30"
          >
            Time: {expectedTime === "quick" ? "Quick" : expectedTime === "weekend" ? "A Weekend" : "Ongoing"}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onReset}
        data-testid="reset-active-preferences-btn"
        className="font-semibold text-purple-400 hover:text-purple-300 underline underline-offset-2 focus-visible:outline-none"
      >
        Reset preferences
      </button>
    </div>
  );
}
