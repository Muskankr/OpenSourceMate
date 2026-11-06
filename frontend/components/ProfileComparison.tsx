"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchUserProfile, fetchUserSkills, ApiClientError } from "../utils/apiClient";
import { validateGitHubUsername } from "../utils/validation";
import { computeProfileComparison } from "../utils/compareProfiles";
import type { UserComparisonState } from "../types/compare";

interface ProfileComparisonProps {
  initialUser1?: string;
  initialUser2?: string;
  theme?: "dark" | "light";
  onUsernamesChange?: (u1: string, u2: string) => void;
}

export default function ProfileComparison({
  initialUser1 = "",
  initialUser2 = "",
  theme = "dark",
  onUsernamesChange,
}: ProfileComparisonProps) {
  const [input1, setInput1] = useState(initialUser1);
  const [input2, setInput2] = useState(initialUser2);

  const [user1State, setUser1State] = useState<UserComparisonState>({
    username: initialUser1,
    loading: false,
    error: null,
    profile: null,
    skills: null,
  });

  const [user2State, setUser2State] = useState<UserComparisonState>({
    username: initialUser2,
    loading: false,
    error: null,
    profile: null,
    skills: null,
  });

  const [activeTab, setActiveTab] = useState<"shared" | "unique" | "all">("shared");

  const input1Id = useId();
  const input2Id = useId();

  // Helper to extract a friendly error message from unknown error
  const getErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof ApiClientError) {
      if (err.status === 404) return "GitHub user not found.";
      if (err.status === 403 || err.code === "RATE_LIMIT_EXCEEDED") {
        return "GitHub API rate limit exceeded. Please try again later.";
      }
      return err.message || fallback;
    }
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 404
    ) {
      return "GitHub user not found.";
    }
    if (err instanceof Error) return err.message;
    return fallback;
  };

  // Fetch individual user data isolated so one failure doesn't affect the other
  const fetchSingleUser = useCallback(
    async (
      rawName: string,
      setUserState: React.Dispatch<React.SetStateAction<UserComparisonState>>
    ) => {
      const validation = validateGitHubUsername(rawName);
      if (!validation.isValid) {
        setUserState((prev) => ({
          ...prev,
          username: rawName,
          loading: false,
          error: validation.error || "Invalid GitHub username",
          // Preserve previously fetched profile/skills if any, or clear if username is empty
          ...(rawName.trim() === "" ? { profile: null, skills: null } : {}),
        }));
        return;
      }

      const clean = validation.cleanUsername;
      setUserState((prev) => ({
        ...prev,
        username: clean,
        loading: true,
        error: null,
      }));

      try {
        const [profile, skills] = await Promise.all([
          fetchUserProfile(clean),
          fetchUserSkills(clean),
        ]);

        setUserState({
          username: clean,
          loading: false,
          error: null,
          profile,
          skills,
        });
      } catch (err: unknown) {
        setUserState((prev) => ({
          ...prev,
          username: clean,
          loading: false,
          error: getErrorMessage(err, `Failed to load data for @${clean}`),
        }));
      }
    },
    []
  );

  // Compare both profiles together
  const handleCompare = useCallback(async () => {
    const clean1 = input1.trim().replace(/^@+/, "");
    const clean2 = input2.trim().replace(/^@+/, "");

    // Reject duplicate usernames if both are provided
    if (clean1 && clean2 && clean1.toLowerCase() === clean2.toLowerCase()) {
      setUser1State((prev) => ({
        ...prev,
        username: clean1,
        loading: false,
        error: "Cannot compare a developer with themselves. Please enter two different GitHub usernames.",
      }));
      setUser2State((prev) => ({
        ...prev,
        username: clean2,
        loading: false,
        error: "Duplicate username detected. Please enter two different GitHub usernames.",
      }));
      onUsernamesChange?.(input1, input2);
      return;
    }

    onUsernamesChange?.(input1, input2);
    await Promise.allSettled([
      fetchSingleUser(input1, setUser1State),
      fetchSingleUser(input2, setUser2State),
    ]);
  }, [input1, input2, fetchSingleUser, onUsernamesChange]);

  // Handle single user retry
  const handleRetryUser1 = () => fetchSingleUser(input1, setUser1State);
  const handleRetryUser2 = () => fetchSingleUser(input2, setUser2State);

  // Swap usernames
  const handleSwap = () => {
    const tempInput = input1;
    setInput1(input2);
    setInput2(tempInput);

    const tempState = user1State;
    setUser1State(user2State);
    setUser2State(tempState);

    onUsernamesChange?.(input2, tempInput);
  };

  // Initial load if params provided
  useEffect(() => {
    if (initialUser1 && initialUser2) {
      handleCompare();
    } else if (initialUser1) {
      fetchSingleUser(initialUser1, setUser1State);
    } else if (initialUser2) {
      fetchSingleUser(initialUser2, setUser2State);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comparison = computeProfileComparison(
    user1State.username || "User 1",
    user1State.skills,
    user2State.username || "User 2",
    user2State.skills
  );

  const hasData1 = !!user1State.profile && !user1State.loading;
  const hasData2 = !!user2State.profile && !user2State.loading;
  const hasBothData = hasData1 && hasData2;
  const isAnyLoading = user1State.loading || user2State.loading;

  // Theming classes
  const isDark = theme === "dark";
  const cardBg = isDark
    ? "bg-gradient-to-b from-[#131722] to-[#0c0f17] border-white/10"
    : "bg-white border-gray-200 shadow-sm";
  const inputBg = isDark
    ? "bg-black/30 border-white/10 text-white placeholder-gray-500 focus:border-purple-500"
    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const textMuted = isDark ? "text-gray-500" : "text-gray-400";

  return (
    <div className="w-full space-y-8" role="region" aria-label="Profile comparison view">
      {/* Search and Comparison Controls */}
      <section
        aria-label="Compare developer profiles"
        className={`rounded-2xl border p-6 transition-all duration-300 ${cardBg}`}
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${textPrimary}`}>
              Compare GitHub Profiles
            </h2>
            <p className={`text-sm ${textSecondary}`}>
              Analyze shared skills, unique competencies, and repository metrics side-by-side.
            </p>
          </div>
          {(input1 || input2) && (
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap developer positions"
              className={`inline-flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isDark
                  ? "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Swap Developers
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCompare();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-5 md:items-end"
        >
          {/* User 1 Input */}
          <div className="md:col-span-2">
            <label
              htmlFor={input1Id}
              className={`block text-xs font-semibold uppercase tracking-wider ${textSecondary} mb-1`}
            >
              Developer 1
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                @
              </span>
              <input
                id={input1Id}
                type="text"
                value={input1}
                onChange={(e) => setInput1(e.target.value)}
                placeholder="e.g. torvalds"
                aria-label="First developer username"
                className={`w-full rounded-xl border py-2.5 pl-8 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-purple-500/20 ${inputBg}`}
              />
            </div>
          </div>

          {/* User 2 Input */}
          <div className="md:col-span-2">
            <label
              htmlFor={input2Id}
              className={`block text-xs font-semibold uppercase tracking-wider ${textSecondary} mb-1`}
            >
              Developer 2
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                @
              </span>
              <input
                id={input2Id}
                type="text"
                value={input2}
                onChange={(e) => setInput2(e.target.value)}
                placeholder="e.g. gaearon"
                aria-label="Second developer username"
                className={`w-full rounded-xl border py-2.5 pl-8 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-purple-500/20 ${inputBg}`}
              />
            </div>
          </div>

          {/* Swap Button In Center on Desktop */}
          <div className="flex justify-center md:col-span-5 -my-2">
            <button
              type="button"
              onClick={handleSwap}
              disabled={isAnyLoading || (!input1.trim() && !input2.trim())}
              aria-label="Swap developer positions"
              title="Swap Developer 1 and Developer 2"
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1 text-xs font-medium shadow-sm transition hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 ${
                isDark
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                  : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <span>Swap Order</span>
            </button>
          </div>

          {/* Action Button */}
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={isAnyLoading || (!input1.trim() && !input2.trim())}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnyLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Comparing...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Compare
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Side-by-side or stacked developer profile overview */}
      <section
        aria-label="Developer profiles side by side"
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {/* User 1 Profile Column */}
        <div className="flex flex-col">
          <ProfileSummaryCard
            userState={user1State}
            onRetry={handleRetryUser1}
            isDark={isDark}
            cardBg={cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            userNumber={1}
          />
        </div>

        {/* User 2 Profile Column */}
        <div className="flex flex-col">
          <ProfileSummaryCard
            userState={user2State}
            onRetry={handleRetryUser2}
            isDark={isDark}
            cardBg={cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            userNumber={2}
          />
        </div>
      </section>

      {/* Both profiles loaded: Comparison Metrics & Skills Breakdown */}
      {hasBothData && (
        <section
          aria-label="Skill comparison results"
          className={`rounded-2xl border p-6 transition-all duration-300 ${cardBg}`}
        >
          {/* Header & Metrics Summary */}
          <div className="mb-6 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between border-white/10">
            <div>
              <h3 className={`text-lg font-bold ${textPrimary}`}>Skill Comparison Breakdown</h3>
              <p className={`text-sm ${textSecondary}`}>
                Comparing {comparison.user1.username} and {comparison.user2.username}
              </p>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-xl border px-3 py-1.5 text-center ${
                  isDark ? "border-purple-500/30 bg-purple-500/10" : "border-purple-200 bg-purple-50"
                }`}
              >
                <span className="block text-xs uppercase tracking-wider text-purple-400 font-semibold">
                  Similarity
                </span>
                <span className={`text-base font-extrabold ${textPrimary}`}>
                  {comparison.similarityScore}%
                </span>
              </div>

              <div
                className={`rounded-xl border px-3 py-1.5 text-center ${
                  isDark ? "border-blue-500/30 bg-blue-500/10" : "border-blue-200 bg-blue-50"
                }`}
              >
                <span className="block text-xs uppercase tracking-wider text-blue-400 font-semibold">
                  Shared Skills
                </span>
                <span className={`text-base font-extrabold ${textPrimary}`}>
                  {comparison.sharedSkills.length}
                </span>
              </div>

              <div
                className={`rounded-xl border px-3 py-1.5 text-center ${
                  isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
                }`}
              >
                <span className="block text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Total Skills
                </span>
                <span className={`text-base font-extrabold ${textPrimary}`}>
                  {comparison.totalUniqueSkillsCombined}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 flex border-b border-white/10" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "shared"}
              onClick={() => setActiveTab("shared")}
              className={`relative border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "shared"
                  ? "border-purple-500 text-purple-400"
                  : `border-transparent ${textSecondary} hover:${textPrimary}`
              }`}
            >
              Shared Skills ({comparison.sharedSkills.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "unique"}
              onClick={() => setActiveTab("unique")}
              className={`relative border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "unique"
                  ? "border-purple-500 text-purple-400"
                  : `border-transparent ${textSecondary} hover:${textPrimary}`
              }`}
            >
              Unique Skills (
              {comparison.uniqueSkillsUser1.length + comparison.uniqueSkillsUser2.length}
              )
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              className={`relative border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "all"
                  ? "border-purple-500 text-purple-400"
                  : `border-transparent ${textSecondary} hover:${textPrimary}`
              }`}
            >
              All Skills Matrix
            </button>
          </div>

          {/* Tab 1: Shared Skills */}
          {activeTab === "shared" && (
            <div role="tabpanel" aria-label="Shared skills list" className="space-y-4">
              {comparison.sharedSkills.length === 0 ? (
                <p className={`py-8 text-center text-sm ${textMuted}`}>
                  No overlapping skills found in the analyzed repositories of these two developers.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" role="table">
                    <thead>
                      <tr className={`border-b border-white/10 text-xs uppercase tracking-wider ${textSecondary}`}>
                        <th className="py-3 px-4 font-semibold">Skill</th>
                        <th className="py-3 px-4 font-semibold">
                          @{comparison.user1.username} Repos
                        </th>
                        <th className="py-3 px-4 font-semibold">Distribution</th>
                        <th className="py-3 px-4 font-semibold text-right">
                          @{comparison.user2.username} Repos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {comparison.sharedSkills.map((skill) => (
                        <tr key={skill.name} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-medium">
                            <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              isDark ? "bg-purple-500/10 text-purple-300" : "bg-purple-50 text-purple-700"
                            }`}>
                              {skill.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${textPrimary}`}>
                              {skill.user1RepositoryCount}
                            </span>
                            <span className={`text-xs ml-1 ${textMuted}`}>
                              ({skill.user1Percentage}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 min-w-[140px]">
                            {/* Visual comparative bar */}
                            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-700/30">
                              <div
                                style={{ width: `${Math.round(skill.ratio * 100)}%` }}
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                                title={`@${comparison.user1.username}: ${skill.user1RepositoryCount} repos`}
                              />
                              <div
                                style={{ width: `${100 - Math.round(skill.ratio * 100)}%` }}
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                title={`@${comparison.user2.username}: ${skill.user2RepositoryCount} repos`}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-semibold ${textPrimary}`}>
                              {skill.user2RepositoryCount}
                            </span>
                            <span className={`text-xs ml-1 ${textMuted}`}>
                              ({skill.user2Percentage}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Unique Skills Side-by-Side */}
          {activeTab === "unique" && (
            <div role="tabpanel" aria-label="Unique skills comparison" className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Unique to User 1 */}
              <div
                className={`rounded-xl border p-4 ${
                  isDark ? "border-purple-500/20 bg-purple-500/5" : "border-purple-100 bg-purple-50/50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className={`text-sm font-bold ${textPrimary}`}>
                    Exclusive to @{comparison.user1.username}
                  </h4>
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-semibold text-purple-400">
                    {comparison.uniqueSkillsUser1.length}
                  </span>
                </div>
                {comparison.uniqueSkillsUser1.length === 0 ? (
                  <p className={`text-xs ${textMuted}`}>No unique skills detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {comparison.uniqueSkillsUser1.map((skill) => (
                      <span
                        key={skill.name}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          isDark
                            ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                            : "border-purple-200 bg-white text-purple-700"
                        }`}
                      >
                        {skill.name}
                        <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold text-gray-300">
                          {skill.repository_count} repos
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Unique to User 2 */}
              <div
                className={`rounded-xl border p-4 ${
                  isDark ? "border-blue-500/20 bg-blue-500/5" : "border-blue-100 bg-blue-50/50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className={`text-sm font-bold ${textPrimary}`}>
                    Exclusive to @{comparison.user2.username}
                  </h4>
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">
                    {comparison.uniqueSkillsUser2.length}
                  </span>
                </div>
                {comparison.uniqueSkillsUser2.length === 0 ? (
                  <p className={`text-xs ${textMuted}`}>No unique skills detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {comparison.uniqueSkillsUser2.map((skill) => (
                      <span
                        key={skill.name}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          isDark
                            ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                            : "border-blue-200 bg-white text-blue-700"
                        }`}
                      >
                        {skill.name}
                        <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold text-gray-300">
                          {skill.repository_count} repos
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: All Skills Matrix */}
          {activeTab === "all" && (
            <div role="tabpanel" aria-label="All skills comparative matrix" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" role="table">
                  <thead>
                    <tr className={`border-b border-white/10 text-xs uppercase tracking-wider ${textSecondary}`}>
                      <th className="py-3 px-4 font-semibold">Skill</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">@{comparison.user1.username}</th>
                      <th className="py-3 px-4 font-semibold text-right">@{comparison.user2.username}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {/* Shared rows */}
                    {comparison.sharedSkills.map((skill) => (
                      <tr key={`shared-${skill.name}`} className="hover:bg-white/[0.02]">
                        <td className={`py-3 px-4 font-semibold ${textPrimary}`}>{skill.name}</td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                            Shared
                          </span>
                        </td>
                        <td className="py-3 px-4">{skill.user1RepositoryCount} repos</td>
                        <td className="py-3 px-4 text-right">{skill.user2RepositoryCount} repos</td>
                      </tr>
                    ))}

                    {/* Unique to user 1 */}
                    {comparison.uniqueSkillsUser1.map((skill) => (
                      <tr key={`u1-${skill.name}`} className="hover:bg-white/[0.02]">
                        <td className={`py-3 px-4 font-semibold ${textPrimary}`}>{skill.name}</td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-400">
                            @{comparison.user1.username} only
                          </span>
                        </td>
                        <td className="py-3 px-4">{skill.repository_count} repos</td>
                        <td className={`py-3 px-4 text-right ${textMuted}`}>—</td>
                      </tr>
                    ))}

                    {/* Unique to user 2 */}
                    {comparison.uniqueSkillsUser2.map((skill) => (
                      <tr key={`u2-${skill.name}`} className="hover:bg-white/[0.02]">
                        <td className={`py-3 px-4 font-semibold ${textPrimary}`}>{skill.name}</td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                            @{comparison.user2.username} only
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${textMuted}`}>—</td>
                        <td className="py-3 px-4 text-right">{skill.repository_count} repos</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * Subcomponent rendering an individual developer's profile card or error state.
 * Encapsulated so an error in one card never crashes or masks the other card.
 */
interface ProfileSummaryCardProps {
  userState: UserComparisonState;
  onRetry: () => void;
  isDark: boolean;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  userNumber: 1 | 2;
}

function ProfileSummaryCard({
  userState,
  onRetry,
  isDark,
  cardBg,
  textPrimary,
  textSecondary,
  userNumber,
}: ProfileSummaryCardProps) {
  const { username, loading, error, profile, skills } = userState;

  if (loading) {
    return (
      <div
        className={`flex min-h-[220px] flex-col items-center justify-center rounded-2xl border p-6 text-center ${cardBg}`}
      >
        <svg
          className="h-8 w-8 animate-spin text-purple-500 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className={`text-sm font-semibold ${textPrimary}`}>
          Loading developer @{username}...
        </p>
      </div>
    );
  }

  // Error condition: isolated to this user's card
  if (error) {
    return (
      <div
        role="alert"
        className={`flex min-h-[220px] flex-col items-center justify-center rounded-2xl border p-6 text-center ${
          isDark
            ? "border-red-500/20 bg-red-500/5 text-red-300"
            : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h4 className="text-base font-bold mb-1">Developer #{userNumber} Error</h4>
        <p className="text-xs mb-4 max-w-xs">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-red-500/20 px-3.5 py-1.5 text-xs font-semibold transition hover:bg-red-500/30"
        >
          Retry @{username}
        </button>
      </div>
    );
  }

  // Empty state before query
  if (!profile) {
    return (
      <div
        className={`flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center ${
          isDark ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-400"
        }`}
      >
        <span className="text-3xl mb-2 opacity-50">👤</span>
        <h4 className="text-sm font-medium">Developer #{userNumber}</h4>
        <p className="text-xs mt-1">Enter a GitHub username above to compare</p>
      </div>
    );
  }

  // Loaded Profile Card
  return (
    <article
      aria-label={`Profile details for ${profile.username}`}
      className={`flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 ${cardBg}`}
    >
      <div>
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-white/10">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${profile.username}'s avatar`}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-purple-500/20 font-bold text-purple-400">
                {profile.username[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`truncate text-base font-bold ${textPrimary}`}>
                {profile.name || profile.username}
              </h3>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                #{userNumber}
              </span>
            </div>
            <p className={`truncate text-xs ${textSecondary}`}>@{profile.username}</p>
            {profile.bio && (
              <p className={`mt-1.5 line-clamp-2 text-xs leading-relaxed ${textSecondary}`}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-b py-3 text-center border-white/10">
          <div>
            <span className="block text-xs text-gray-400">Repositories</span>
            <span className={`text-sm font-bold ${textPrimary}`}>
              {profile.public_repositories}
            </span>
          </div>
          <div>
            <span className="block text-xs text-gray-400">Followers</span>
            <span className={`text-sm font-bold ${textPrimary}`}>
              {profile.followers}
            </span>
          </div>
          <div>
            <span className="block text-xs text-gray-400">Following</span>
            <span className={`text-sm font-bold ${textPrimary}`}>
              {profile.following}
            </span>
          </div>
        </div>

        {/* Repositories Analyzed info */}
        {skills && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>Repositories Analyzed:</span>
            <span className={`font-semibold ${textPrimary}`}>
              {skills.total_repositories_analyzed}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5">
        <a
          href={profile.profile_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
        >
          View GitHub Profile
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <Link
          href={`/?user=${encodeURIComponent(profile.username)}`}
          className="text-xs text-gray-400 hover:text-white"
        >
          Full Analysis &rarr;
        </Link>
      </div>
    </article>
  );
}
