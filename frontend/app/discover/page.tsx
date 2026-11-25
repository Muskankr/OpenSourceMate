"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "../../hooks/useTheme";
import { ThemeSegmentedToggle } from "../../components/ThemeToggle";
import { RateLimitBanner } from "../../components/RateLimitBanner";
import {
  fetchDiscoveredRepositories,
  ApiClientError,
} from "../../utils/apiClient";
import type { DiscoveredRepository } from "../../types/api";
import {
  getNewcomerTierBadgeStyle,
  formatRelativeTime,
} from "../../utils/newcomerFriendliness";

const POPULAR_LANGUAGES = [
  "All",
  "Python",
  "TypeScript",
  "JavaScript",
  "Go",
  "Rust",
  "HTML",
  "Java",
  "C++",
];

const STAR_RANGES = [
  { id: "all", label: "All Sizes", min: 0, max: undefined },
  { id: "small", label: "< 1k Stars (Emerging)", min: 0, max: 1000 },
  { id: "medium", label: "1k – 10k Stars (Active)", min: 1000, max: 10000 },
  { id: "large", label: "10k+ Stars (Established)", min: 10000, max: undefined },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialLang = searchParams.get("lang") || searchParams.get("language") || "Python";
  const initialUser = searchParams.get("user") || searchParams.get("username") || "";

  const [repositories, setRepositories] = useState<DiscoveredRepository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [rateLimitResetAt, setRateLimitResetAt] = useState<string | undefined>(undefined);

  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLang);
  const [selectedStarRangeId, setSelectedStarRangeId] = useState<string>("all");
  const [usernameInput, setUsernameInput] = useState<string>(initialUser);
  const [appliedUsername, setAppliedUsername] = useState<string>(initialUser);

  const { theme, themePreference, setThemePreference } = useTheme();
  const isDark = theme === "dark";

  const loadRepositories = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRateLimited(false);

    const activeStarRange = STAR_RANGES.find((r) => r.id === selectedStarRangeId);
    const langParam = selectedLanguage === "All" ? undefined : selectedLanguage;

    try {
      const data = await fetchDiscoveredRepositories({
        language: langParam,
        username: appliedUsername.trim() || undefined,
        minStars: activeStarRange?.min,
        maxStars: activeStarRange?.max,
        limit: 25,
      });

      setRepositories(data.repositories || []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 429) {
        setIsRateLimited(true);
        setRateLimitResetAt(err.resetAt);
        setError("GitHub API rate limit reached. Please wait a moment before retrying.");
      } else {
        const msg = err instanceof Error ? err.message : "Failed to load welcoming repositories.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, selectedStarRangeId, appliedUsername]);

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  const handleResetFilters = () => {
    setSelectedLanguage("All");
    setSelectedStarRangeId("all");
    setUsernameInput("");
    setAppliedUsername("");
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedUsername(usernameInput.trim());
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-gray-900"
      } py-10 px-4 sm:px-6 lg:px-8`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Navigation */}
        <header
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b ${
            isDark ? "border-slate-800" : "border-gray-200"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span aria-hidden="true">&larr;</span> Back to Home
              </Link>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Discover Welcoming Repositories
            </h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"} mt-1 max-w-2xl`}>
              Find active, beginner-friendly open source projects to join. Ranked deterministically by
              newcomer-friendliness: beginner issues, maintainer activity, CONTRIBUTING guide, and Code of Conduct.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <ThemeSegmentedToggle
              preference={themePreference}
              resolvedTheme={theme}
              onChangePreference={setThemePreference}
            />
          </div>
        </header>

        {/* Rate Limit Alert */}
        {isRateLimited && (
          <RateLimitBanner
            message="GitHub API rate limit reached. Showing existing cached recommendations or wait for the limit to reset."
            onDismiss={() => setIsRateLimited(false)}
          />
        )}

        {/* Filter Controls Panel */}
        <section
          aria-label="Filter repositories"
          className={`p-5 rounded-2xl border transition-colors ${
            isDark ? "bg-slate-900/60 border-slate-800 shadow-xl" : "bg-white border-gray-200 shadow-sm"
          } space-y-5`}
        >
          {/* Top row: Language Pills */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
              isDark ? "text-slate-400" : "text-gray-500"
            }`}>
              Filter by Programming Language
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {POPULAR_LANGUAGES.map((lang) => {
                const isActive = selectedLanguage === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    aria-pressed={isActive}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : isDark
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom row: Size (Stars Range) + Optional Username */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
            {/* Star Size Selector */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                isDark ? "text-slate-400" : "text-gray-500"
              }`}>
                Repository Size (Stars)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {STAR_RANGES.map((range) => {
                  const isActive = selectedStarRangeId === range.id;
                  return (
                    <button
                      key={range.id}
                      onClick={() => setSelectedStarRangeId(range.id)}
                      aria-pressed={isActive}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                          : isDark
                          ? "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username Input for Skill Match */}
            <form onSubmit={handleUsernameSubmit} className="flex items-end gap-2">
              <div>
                <label
                  htmlFor="discover-username"
                  className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  Match User Skills
                </label>
                <input
                  id="discover-username"
                  type="text"
                  placeholder="GitHub username..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    isDark
                      ? "bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                Match
              </button>
              {(selectedLanguage !== "All" || selectedStarRangeId !== "all" || appliedUsername) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isDark
                      ? "bg-slate-800 text-slate-400 hover:text-slate-200"
                      : "bg-gray-200 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Reset
                </button>
              )}
            </form>
          </div>
        </section>

        {/* Scoring Criteria Summary Box */}
        <section
          aria-label="Score criteria"
          className={`p-4 rounded-xl border text-xs leading-relaxed ${
            isDark ? "bg-slate-900/40 border-slate-800 text-slate-400" : "bg-gray-100/70 border-gray-200 text-gray-600"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold mb-1 text-slate-300">
            <span>ℹ️</span>
            <span>How Newcomer-Friendliness is Ranked (100 pts max):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <div>• Open Beginner Issues: <strong className="text-emerald-400">30 pts</strong></div>
            <div>• Recent Maintainer Activity: <strong className="text-emerald-400">25 pts</strong></div>
            <div>• CONTRIBUTING Guide: <strong className="text-emerald-400">25 pts</strong></div>
            <div>• Code of Conduct: <strong className="text-emerald-400">20 pts</strong></div>
          </div>
        </section>

        {/* Results Section */}
        <main aria-label="Discovered repositories">
          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="discover-loading">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`p-6 rounded-2xl border animate-pulse space-y-4 ${
                    isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="h-5 bg-slate-700/50 rounded w-1/2" />
                  <div className="h-4 bg-slate-700/30 rounded w-5/6" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-700/40 rounded w-20" />
                    <div className="h-6 bg-slate-700/40 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : error && !isRateLimited ? (
            /* Error Card */
            <div
              role="alert"
              className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 text-center space-y-3"
            >
              <p className="font-semibold">{error}</p>
              <button
                onClick={loadRepositories}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : repositories.length === 0 ? (
            /* Empty State Card */
            <div
              data-testid="discover-empty-state"
              className={`p-10 rounded-2xl border text-center space-y-4 ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-gray-200"
              }`}
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl">
                🔍
              </div>
              <h3 className="text-lg font-bold">No repositories found matching your filters</h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                We couldn&apos;t find any active projects matching the selected language and star range.
                Try selecting a different language or widening the stars filter.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* Discovered Repositories Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="discover-results">
              {repositories.map((repo, idx) => {
                const tierStyle = getNewcomerTierBadgeStyle(repo.newcomer_friendliness_tier);
                return (
                  <article
                    key={repo.full_name}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      isDark
                        ? "bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/30 hover:bg-slate-900"
                        : "bg-white border-gray-200 hover:border-emerald-500/40 hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* Top Row: Rank, Full Name, Score Badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            isDark ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"
                          }`}>
                            #{idx + 1}
                          </span>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-base hover:text-emerald-400 transition-colors line-clamp-1"
                          >
                            {repo.full_name}
                          </a>
                        </div>

                        {/* Friendliness Score Badge */}
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                          title={`Newcomer-Friendliness Score: ${repo.newcomer_friendliness_score} / 100 (${repo.newcomer_friendliness_tier})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dot}`} />
                          <span>{repo.newcomer_friendliness_score}</span>
                          <span className="font-normal opacity-75">/ 100</span>
                        </div>
                      </div>

                      {/* Tier Label */}
                      <div className="mb-3">
                        <span className={`text-xs font-semibold ${tierStyle.text}`}>
                          {repo.newcomer_friendliness_tier}
                        </span>
                      </div>

                      {/* Description */}
                      <p className={`text-xs ${isDark ? "text-slate-300" : "text-gray-600"} line-clamp-2 mb-4 leading-relaxed`}>
                        {repo.description || "No description provided for this repository."}
                      </p>

                      {/* Signal Breakdown Chips */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
                        <div className={`px-2 py-1 rounded border flex items-center gap-1.5 ${
                          repo.good_first_issues_count > 0
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : isDark ? "bg-slate-800/50 border-slate-700/40 text-slate-400" : "bg-gray-100 border-gray-200 text-gray-500"
                        }`}>
                          <span>⭐</span>
                          <span>{repo.good_first_issues_count} beginner issues</span>
                        </div>

                        <div className={`px-2 py-1 rounded border flex items-center gap-1.5 ${
                          repo.score_breakdown.recent_activity_points >= 15
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : isDark ? "bg-slate-800/50 border-slate-700/40 text-slate-400" : "bg-gray-100 border-gray-200 text-gray-500"
                        }`}>
                          <span>🕒</span>
                          <span>{formatRelativeTime(repo.last_activity_at)}</span>
                        </div>

                        <div className={`px-2 py-1 rounded border flex items-center gap-1.5 ${
                          repo.has_contributing
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : isDark ? "bg-slate-800/50 border-slate-700/40 text-slate-400" : "bg-gray-100 border-gray-200 text-gray-500"
                        }`}>
                          <span>📖</span>
                          <span>{repo.has_contributing ? "CONTRIBUTING guide" : "No guide"}</span>
                        </div>

                        <div className={`px-2 py-1 rounded border flex items-center gap-1.5 ${
                          repo.has_code_of_conduct
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : isDark ? "bg-slate-800/50 border-slate-700/40 text-slate-400" : "bg-gray-100 border-gray-200 text-gray-500"
                        }`}>
                          <span>📜</span>
                          <span>{repo.has_code_of_conduct ? "Code of Conduct" : "No conduct"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Metadata & Links */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center gap-3 text-slate-400">
                        {repo.language && (
                          <span className="font-semibold text-emerald-400">
                            {repo.language}
                          </span>
                        )}
                        <span>★ {repo.stars.toLocaleString()}</span>
                        <span>⑂ {repo.forks.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`${repo.html_url}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          Issues ({repo.good_first_issues_count}) &rarr;
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Loading welcoming repositories...
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
