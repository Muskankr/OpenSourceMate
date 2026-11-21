"use client";

import React, { useMemo, useState } from "react";
import type { IssueRecommendation } from "../types/api";
import IssueCard from "./IssueCard";
import { inferIssueDifficulty, type IssueDifficulty } from "../data/mockIssues";
import { hiddenIssueId, useHiddenIssues } from "../hooks/useHiddenIssues";
import { rankIssuesForLearningMode, COMMON_TARGET_SKILLS } from "../utils/learningMode";

export interface RecommendedIssuesListProps {
  issues: IssueRecommendation[];
  theme?: "dark" | "light";
  isMock?: boolean;
  username?: string;
  initialLearningMode?: boolean;
  initialTargetSkills?: string[];
}

export default function RecommendedIssuesList({
  issues,
  theme = "dark",
  isMock = false,
  username = "",
  initialLearningMode = false,
  initialTargetSkills = [],
}: RecommendedIssuesListProps) {
  const isDark = theme === "dark";

  // Learning mode states
  const [isLearningMode, setIsLearningMode] = useState<boolean>(initialLearningMode);
  const [targetSkills, setTargetSkills] = useState<string[]>(initialTargetSkills);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const { hiddenIds, isHidden, hideIssue, restoreIssue } = useHiddenIssues();
  const hiddenCount = issues.filter((issue) => hiddenIds.includes(hiddenIssueId(issue))).length;

  // Extract available languages dynamically
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    issues.forEach((i) => {
      if (i.language) langs.add(i.language);
    });
    return Array.from(langs).sort();
  }, [issues]);

  // Dynamic set of selectable target skills for learning mode
  const selectableSkills = useMemo(() => {
    const set = new Set<string>(COMMON_TARGET_SKILLS);
    issues.forEach((i) => {
      if (i.language) set.add(i.language);
    });
    return Array.from(set).sort();
  }, [issues]);

  // Re-rank issues when Learning Mode is active
  const rankedIssues = useMemo(() => {
    return rankIssuesForLearningMode(issues, targetSkills, isLearningMode);
  }, [issues, targetSkills, isLearningMode]);

  // Filtering logic
  const filteredIssues = useMemo(() => {
    return rankedIssues.filter((issue) => {
      if (!showHidden && hiddenIds.includes(hiddenIssueId(issue))) return false;
      // Language filter
      if (
        languageFilter !== "all" &&
        issue.language?.toLowerCase() !== languageFilter.toLowerCase()
      ) {
        return false;
      }

      // Label filter
      if (labelFilter === "good-first-issue") {
        const hasGFI = issue.labels?.some((l) => l.toLowerCase().includes("good first"));
        if (!hasGFI) return false;
      } else if (labelFilter === "help-wanted") {
        const hasHW = issue.labels?.some((l) => l.toLowerCase().includes("help wanted"));
        if (!hasHW) return false;
      }

      // Difficulty filter
      if (difficultyFilter !== "all") {
        const diff: IssueDifficulty = issue.difficulty || inferIssueDifficulty(issue.labels);
        if (diff.toLowerCase() !== difficultyFilter.toLowerCase()) {
          return false;
        }
      }

      // Score filter
      const score = Math.round(issue.match_score ?? issue.score ?? 0);
      if (score < minScoreFilter) {
        return false;
      }

      // Search text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = issue.title?.toLowerCase().includes(q);
        const matchesRepo = issue.repository?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRepo) return false;
      }

      return true;
    });
  }, [
    rankedIssues,
    hiddenIds,
    showHidden,
    languageFilter,
    labelFilter,
    difficultyFilter,
    minScoreFilter,
    searchQuery,
  ]);

  const hasActiveFilters =
    languageFilter !== "all" ||
    labelFilter !== "all" ||
    difficultyFilter !== "all" ||
    minScoreFilter > 0 ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setLanguageFilter("all");
    setLabelFilter("all");
    setDifficultyFilter("all");
    setMinScoreFilter(0);
    setSearchQuery("");
  };

  const hasIssues = issues.length > 0;
  const isDemo = isMock || issues.some((i) => i.is_mock);

  return (
    <section
      id="recommendations"
      aria-label="Recommended open-source issues"
      className={`mt-6 rounded-3xl border p-5 sm:p-8 transition-all duration-300 ${
        isDark ? "border-white/10 bg-white/[0.035]" : "border-gray-200 bg-white shadow-sm"
      }`}
    >
      {/* Header section */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 sm:text-sm">
              OPPORTUNITIES
            </p>
            {isDemo && (
              <span
                data-testid="coming-soon-banner-badge"
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isDark
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    : "border-cyan-300 bg-cyan-50 text-cyan-800"
                }`}
              >
                Demo Data • Coming Soon
              </span>
            )}
          </div>

          <h3 className="mt-2 text-2xl font-bold">Recommended open-source issues</h3>

          <p className={`mt-2 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            Hand-picked issues ranked by relevance to your technical skills.
          </p>
        </div>

        {hasIssues && (
          <div className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Showing {filteredIssues.length} of {issues.length} issues
          </div>
        )}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowHidden((value) => !value)}
          className="mt-4 rounded text-xs font-medium text-purple-400 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          {showHidden ? "Hide hidden" : `Show hidden (${hiddenCount})`}
        </button>
      )}

      {/* Subtle Demo data indicator banner */}
      {isDemo && (
        <div
          role="note"
          className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 text-xs ${
            isDark
              ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-200"
              : "border-cyan-200 bg-cyan-50 text-cyan-900"
          }`}
        >
          <span className="text-base leading-none" aria-hidden="true">
            ℹ️
          </span>
          <div>
            <p className="font-semibold">Live matching service is currently in preview</p>
            <p className="mt-0.5 text-[11px] opacity-85">
              Displaying realistic open-source issues matched to{" "}
              {username ? `@${username}'s` : "your"} technical skill set. You can filter by
              difficulty, language, and keywords below.
            </p>
          </div>
        </div>
      )}

      {/* Learning Mode Toggle & Target Skills Picker */}
      {hasIssues && (
        <div
          data-testid="learning-mode-container"
          className={`mt-4 rounded-2xl border p-4 transition-all duration-200 ${
            isLearningMode
              ? isDark
                ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm"
                : "border-emerald-200 bg-emerald-50/70 shadow-sm"
              : isDark
                ? "border-white/5 bg-white/[0.02]"
                : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label
                htmlFor="learning-mode-toggle"
                className="relative inline-flex cursor-pointer items-center"
              >
                <input
                  id="learning-mode-toggle"
                  type="checkbox"
                  data-testid="learning-mode-toggle"
                  checked={isLearningMode}
                  onChange={(e) => setIsLearningMode(e.target.checked)}
                  className="peer sr-only"
                  aria-label="Toggle learning mode"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-700 peer-checked:bg-emerald-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-400 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    🌱 Learning Mode
                  </span>
                  {isLearningMode && (
                    <span
                      data-testid="learning-mode-active-indicator"
                      className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[10px] font-semibold text-emerald-300"
                    >
                      Active
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  Prioritize beginner-friendly issues in target skills you want to learn.
                </p>
              </div>
            </div>

            {isLearningMode && targetSkills.length > 0 && (
              <button
                type="button"
                onClick={() => setTargetSkills([])}
                className="self-start text-xs text-gray-400 hover:text-white underline sm:self-auto"
              >
                Clear target skills
              </button>
            )}
          </div>

          {/* Target Skills Picker */}
          {isLearningMode && (
            <div data-testid="target-skills-picker" className="mt-3.5 border-t border-white/5 pt-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold text-gray-300">
                  Select target technologies to learn:
                </span>
                {targetSkills.length > 0 && (
                  <span className="text-xs font-medium text-emerald-400">
                    {targetSkills.length} selected: {targetSkills.join(", ")}
                  </span>
                )}
              </div>

              <div
                className="mt-2.5 flex flex-wrap gap-1.5"
                role="group"
                aria-label="Target skills picker"
              >
                {selectableSkills.map((skill) => {
                  const isSelected = targetSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      data-testid={`target-skill-chip-${skill}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setTargetSkills((prev) =>
                          isSelected ? prev.filter((s) => s !== skill) : [...prev, skill]
                        );
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        isSelected
                          ? "border border-emerald-400 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50"
                          : isDark
                            ? "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      {hasIssues && (
        <div
          className={`mt-6 rounded-2xl border p-4 ${
            isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search filter */}
            <div className="lg:col-span-1">
              <label
                htmlFor="issue-search-filter"
                className="block text-xs font-semibold text-gray-400"
              >
                Search
              </label>
              <input
                id="issue-search-filter"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title or repo..."
                aria-label="Filter issues by title or repository"
                className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-600"
                }`}
              />
            </div>

            {/* Language filter */}
            <div>
              <label
                htmlFor="issue-lang-filter"
                className="block text-xs font-semibold text-gray-400"
              >
                Language
              </label>
              <select
                id="issue-lang-filter"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                aria-label="Filter issues by programming language"
                className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-[#0c101d] text-white focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 focus:border-purple-600"
                }`}
              >
                <option value="all">All Languages</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty filter */}
            <div>
              <label
                htmlFor="issue-difficulty-filter"
                className="block text-xs font-semibold text-gray-400"
              >
                Difficulty
              </label>
              <select
                id="issue-difficulty-filter"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                aria-label="Filter issues by difficulty"
                className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-[#0c101d] text-white focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 focus:border-purple-600"
                }`}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Label type filter */}
            <div>
              <label
                htmlFor="issue-label-filter"
                className="block text-xs font-semibold text-gray-400"
              >
                Label Type
              </label>
              <select
                id="issue-label-filter"
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
                aria-label="Filter issues by label type"
                className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-[#0c101d] text-white focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 focus:border-purple-600"
                }`}
              >
                <option value="all">All Labels</option>
                <option value="good-first-issue">Good First Issue</option>
                <option value="help-wanted">Help Wanted</option>
              </select>
            </div>

            {/* Min match score slider */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="issue-score-filter"
                  className="block text-xs font-semibold text-gray-400"
                >
                  Min Match
                </label>
                <span className="text-xs font-bold text-purple-400">{minScoreFilter}%</span>
              </div>
              <input
                id="issue-score-filter"
                type="range"
                min="0"
                max="90"
                step="10"
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                aria-label="Filter issues by minimum match score"
                className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-purple-500"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
              <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                Active filters applied
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filtered Empty State */}
      {hasIssues && filteredIssues.length === 0 && (
        <div
          data-testid="filter-empty-state"
          className={`mt-8 rounded-2xl border border-dashed p-8 text-center ${
            isDark ? "border-white/10 bg-white/[0.01]" : "border-gray-200 bg-gray-50"
          }`}
        >
          <p className="text-sm font-semibold">No issues match your filters</p>
          <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Try adjusting your language, difficulty, or search terms to see more recommendations.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-400 transition hover:bg-purple-500/20"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Overall Empty State (no issues at all) */}
      {!hasIssues && (
        <div
          data-testid="no-issues-empty-state"
          className={`mt-8 rounded-2xl border border-dashed p-10 text-center ${
            isDark ? "border-white/10 bg-white/[0.01]" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
            🔍
          </div>
          <h4 className="text-base font-semibold">No issues found</h4>
          <p
            className={`mt-1.5 text-xs ${
              isDark ? "text-gray-400" : "text-gray-500"
            } max-w-md mx-auto`}
          >
            We couldn&apos;t find matching open-source issues for your analyzed skills at this time.
            Check back soon as new repository issues are indexed continuously.
          </p>
        </div>
      )}

      {/* Render list of cards */}
      {filteredIssues.length > 0 && (
        <div className="mt-6 space-y-4" role="feed" aria-label="Issue list">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              theme={theme}
              isMock={isDemo}
              username={username}
              isHidden={isHidden(issue)}
              onHide={() => hideIssue(issue)}
              onRestore={() => restoreIssue(issue)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
