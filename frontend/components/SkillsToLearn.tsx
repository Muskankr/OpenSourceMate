"use client";

import React, { useMemo } from "react";
import { SkillItem } from "../types/api";
import { getSkillsToLearn, SkillSuggestion, SkillsMapping } from "../utils/skillsToLearn";
import TechIcon from "./TechIcon";

export interface SkillsToLearnProps {
  /** Array of user's detected skills (either SkillItem objects from API or plain string names) */
  skills?: (SkillItem | string)[] | null;
  /** Active UI theme ('dark' or 'light') */
  theme?: "dark" | "light";
  /** Optional custom container CSS classes */
  className?: string;
  /** Maximum number of suggestions to display (default: 3 per Issue #401) */
  maxSuggestions?: number;
  /** Optional custom mapping for testing or extensibility */
  customMapping?: SkillsMapping;
  /** Optional issue pool to calculate empirical unlocked issues against */
  issuesPool?: Array<{ language?: string | null; labels?: string[]; title?: string }>;
}

/**
 * SkillsToLearn Component
 *
 * Displays the top three suggested technologies to learn next based on the user's
 * detected skills from a static mapping, showing how many additional open issues
 * each related skill would unlock.
 *
 * Acceptance Criteria (Issue #401):
 * - Suggestions exclude skills the user already has.
 * - Adding a relationship needs only a config change in skills_to_learn.json.
 * - Shows top three suggestions with the number of extra matching issues.
 * - Users with no detected skills see a helpful message.
 */
export default function SkillsToLearn({
  skills,
  theme = "dark",
  className = "",
  maxSuggestions = 3,
  customMapping,
  issuesPool,
}: SkillsToLearnProps) {
  const isDark = theme === "dark";

  // Acceptance Criterion 3: Users with no detected skills see a helpful message
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return (
      <section
        aria-label="Skills to learn next"
        data-testid="skills-to-learn-empty"
        className={`rounded-2xl border border-dashed p-6 text-center transition-all duration-300 ${
          isDark
            ? "border-white/10 bg-white/[0.02] text-gray-300"
            : "border-purple-200 bg-purple-50/30 text-gray-700"
        } ${className}`}
      >
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-xl text-purple-400">
          💡
        </div>
        <h4 className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          No skills detected yet
        </h4>
        <p
          className={`mt-1 text-xs sm:text-sm max-w-md mx-auto ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Connect repositories or add skills to discover which nearby skills unlock more open-source
          contribution opportunities.
        </p>
      </section>
    );
  }

  const suggestions: SkillSuggestion[] = useMemo(() => {
    try {
      return getSkillsToLearn(skills, customMapping, maxSuggestions, issuesPool);
    } catch {
      // Safe fallback: never throw or crash the UI
      return [];
    }
  }, [skills, customMapping, maxSuggestions, issuesPool]);

  // If there are no suggestions (e.g. all companion skills already owned or unknown in mapping),
  // return null cleanly without errors.
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Skills to learn next"
      data-testid="skills-to-learn-section"
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
        isDark
          ? "border-purple-500/20 bg-white/[0.025]"
          : "border-purple-200/80 bg-purple-50/40 shadow-sm"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/25 bg-purple-400/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-purple-400 uppercase">
            <span aria-hidden="true">💡</span> LEARNING PATHS
          </div>

          <h4
            className={`mt-2 text-lg font-bold tracking-tight sm:text-xl ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Skills to learn next
          </h4>

          <p className={`mt-1 text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Top nearby skills that unlock more open-source contribution opportunities.
          </p>
        </div>

        <span
          className={`self-start sm:self-auto rounded-full px-2.5 py-1 text-xs font-medium ${
            isDark
              ? "bg-purple-950/40 text-purple-300 border border-purple-800/40"
              : "bg-purple-100 text-purple-800 border border-purple-200"
          }`}
        >
          {suggestions.length} {suggestions.length === 1 ? "nearby skill" : "nearby skills"}
        </span>
      </div>

      {/* Suggested Skills Grid (Top 3) */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.name}
            data-testid={`skill-to-learn-${suggestion.name}`}
            className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${
              isDark
                ? "border-white/10 bg-white/[0.02] hover:border-purple-400/40 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-purple-900/10"
                : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:shadow-purple-100"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <TechIcon name={suggestion.name} theme={theme} className="h-4 w-4 shrink-0" />
                  <span
                    className={`text-sm font-bold tracking-tight truncate ${
                      isDark
                        ? "text-gray-100 group-hover:text-purple-300"
                        : "text-gray-900 group-hover:text-purple-700"
                    } transition-colors`}
                  >
                    {suggestion.name}
                  </span>
                </div>

                <span
                  aria-hidden="true"
                  className="text-xs opacity-60 transition-transform duration-200 group-hover:scale-110 group-hover:opacity-100"
                >
                  ✨
                </span>
              </div>

              <p className={`mt-1.5 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Pairs with{" "}
                <span className="font-semibold text-purple-400">{suggestion.recommendedFrom}</span>
              </p>
            </div>

            {/* Unlocked Issues Count Badge */}
            <div className="mt-4 flex items-center justify-between gap-1 border-t border-white/5 pt-2.5">
              <span
                data-testid={`unlock-badge-${suggestion.name}`}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isDark
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <span aria-hidden="true">🔓</span>
                <span>+{suggestion.unlockedIssuesCount ?? 10} issues unlocked</span>
              </span>

              <span
                className={`text-[10px] font-medium tracking-wide uppercase ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Nearby
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
