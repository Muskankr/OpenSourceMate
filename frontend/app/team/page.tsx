"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ThemeSegmentedToggle } from "../../components/ThemeToggle";
import { useTheme } from "../../hooks/useTheme";
import TeamSkillMatrix from "../../components/TeamSkillMatrix";
import { fetchUserSkills, ApiClientError, isAbortError } from "../../utils/apiClient";
import {
  MAX_TEAM_MEMBERS,
  parseTeamUsernames,
  computeTeamSkillMatrix,
} from "../../utils/teamMatrix";
import type { TeamMemberState } from "../../types/team";

function TeamContent() {
  const searchParams = useSearchParams();
  const { theme, themePreference, setThemePreference } = useTheme();
  const isDark = theme === "dark";

  // Raw input state in the search form
  const [inputVal, setInputVal] = useState("");
  // Error state for validations (such as > 5 usernames)
  const [validationError, setValidationError] = useState<string | null>(null);

  // Array of TeamMemberState representing parallel analysis
  const [members, setMembers] = useState<TeamMemberState[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize from query param e.g. /team?users=alice,bob,carol
  useEffect(() => {
    if (!searchParams) return;
    const rawUsers = searchParams.get("users") || searchParams.get("u") || "";
    if (rawUsers) {
      setInputVal(rawUsers);
      analyzeTeam(rawUsers);
    }
  }, [searchParams]);

  const updateUrl = (usernames: string[]) => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (usernames.length > 0) {
        params.set("users", usernames.join(","));
      } else {
        params.delete("users");
      }
      params.delete("u");
      const queryStr = params.toString();
      const newUrl = queryStr
        ? `${window.location.pathname}?${queryStr}`
        : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  };

  const analyzeTeam = async (rawInput: string) => {
    const parsed = parseTeamUsernames(rawInput);
    setValidationError(null);

    if (parsed.length === 0) {
      setMembers([]);
      updateUrl([]);
      return;
    }

    // Acceptance criterion: More than five usernames are rejected with a clear message
    if (parsed.length > MAX_TEAM_MEMBERS) {
      setValidationError(
        `Too many usernames. Maximum allowed is ${MAX_TEAM_MEMBERS} team members (you entered ${parsed.length}). Please remove ${
          parsed.length - MAX_TEAM_MEMBERS
        } username${parsed.length - MAX_TEAM_MEMBERS === 1 ? "" : "s"}.`
      );
      return;
    }

    updateUrl(parsed);
    setIsAnalyzing(true);

    // Initial member states
    const initialStates: TeamMemberState[] = parsed.map((username) => ({
      username,
      loading: true,
      error: null,
      skills: null,
    }));
    setMembers(initialStates);

    // Analyze in parallel respecting rate limits and handling failures per user
    const results = await Promise.allSettled(
      parsed.map(async (username) => {
        try {
          const skills = await fetchUserSkills(username);
          return { username, skills, error: null };
        } catch (err: unknown) {
          if (isAbortError(err)) throw err;
          let errMsg = "Failed to analyze technical profile";
          if (
            err instanceof ApiClientError ||
            (err && typeof err === "object" && "status" in err)
          ) {
            const status = (err as any).status;
            if (status === 404) {
              errMsg = "GitHub user not found";
            } else if (status === 429) {
              errMsg = "GitHub API rate limit reached";
            } else {
              errMsg = (err as any).message || `API error (${status})`;
            }
          } else if (err instanceof Error) {
            errMsg = err.message;
          }
          return { username, skills: null, error: errMsg };
        }
      })
    );

    const updatedMembers: TeamMemberState[] = results.map((res, i) => {
      if (res.status === "fulfilled") {
        return {
          username: res.value.username,
          loading: false,
          error: res.value.error,
          skills: res.value.skills,
        };
      } else {
        return {
          username: parsed[i],
          loading: false,
          error: "Request failed",
          skills: null,
        };
      }
    });

    setMembers(updatedMembers);
    setIsAnalyzing(false);
  };

  const handleRemoveUser = (usernameToRemove: string) => {
    const nextMembers = members.filter(
      (m) => m.username.toLowerCase() !== usernameToRemove.toLowerCase()
    );
    setMembers(nextMembers);
    const nextUsernames = nextMembers.map((m) => m.username);
    setInputVal(nextUsernames.join(", "));
    updateUrl(nextUsernames);
  };

  const summary = useMemo(() => {
    return computeTeamSkillMatrix(members);
  }, [members]);

  const hasAnyLoaded = summary.analyzedUsers.length > 0;
  const hasFailedOnly =
    members.length > 0 &&
    !isAnalyzing &&
    summary.analyzedUsers.length === 0 &&
    summary.failedUsers.length > 0;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDark ? "bg-[#05070d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Decorative gradient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute right-[-200px] top-[400px] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      {/* Header and Navbar */}
      <header
        role="banner"
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark ? "border-white/5 bg-[#05070d]/80" : "border-gray-200 bg-white/90"
        }`}
      >
        <nav
          aria-label="Team matrix navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5"
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition group-hover:scale-105"
                aria-hidden="true"
              >
                ✦
              </div>
              <span className="text-lg font-semibold tracking-tight">OpenSourceMate</span>
            </Link>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-700"
              }`}
            >
              Team Matrix
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm font-medium transition hover:text-purple-400 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              &larr; Analyzer
            </Link>
            <Link
              href="/compare"
              className={`text-sm font-medium transition hover:text-purple-400 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Compare
            </Link>

            <ThemeSegmentedToggle
              preference={themePreference}
              resolvedTheme={theme}
              onChangePreference={setThemePreference}
            />
          </div>
        </nav>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Intro Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            <span aria-hidden="true">👥</span> TEAM SKILL MATRIX
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Map your team&apos;s collective skills
          </h1>
          <p
            className={`mt-3 text-sm sm:text-base leading-relaxed ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Enter up to 5 GitHub usernames to discover shared technologies, identify overall coverage,
            and spotlight competencies that only one person knows.
          </p>

          {/* Usernames Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              analyzeTeam(inputVal);
            }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
          >
            <div className="relative flex-1 max-w-xl">
              <input
                type="text"
                aria-label="Enter GitHub usernames separated by commas or spaces (up to 5)"
                placeholder="e.g. torvalds, gaearon, octocat"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition ${
                  validationError
                    ? "border-red-500 focus:border-red-600"
                    : isDark
                    ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-600 shadow-sm"
                }`}
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-gray-400">
                Max 5
              </span>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="rounded-2xl bg-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing Team..." : "Analyze Team"}
            </button>
          </form>

          {/* Validation Error Message */}
          {validationError && (
            <div
              role="alert"
              data-testid="team-validation-error"
              className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {validationError}
            </div>
          )}

          {/* Quick example team chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
            <span>Quick presets:</span>
            <button
              type="button"
              onClick={() => {
                const sample = "octocat, torvalds, gaearon";
                setInputVal(sample);
                analyzeTeam(sample);
              }}
              className="rounded-lg border border-white/10 px-2 py-1 hover:border-purple-400 hover:text-purple-300 transition"
            >
              octocat, torvalds, gaearon
            </button>
          </div>
        </div>

        {/* Results Matrix Section */}
        <div className="mt-12">
          {hasAnyLoaded && (
            <TeamSkillMatrix
              summary={summary}
              theme={theme}
              onRemoveUser={handleRemoveUser}
            />
          )}

          {hasFailedOnly && (
            <div
              role="alert"
              className={`rounded-2xl border p-8 text-center ${
                isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-300 bg-red-50 text-red-800"
              }`}
            >
              <h3 className="font-semibold text-lg">Unable to analyze team members</h3>
              <p className="mt-2 text-sm opacity-90">
                None of the provided usernames could be retrieved. Please check for spelling mistakes or rate limits.
              </p>
              <ul className="mt-4 space-y-1 text-sm font-mono">
                {summary.failedUsers.map((f) => (
                  <li key={f.username}>
                    @{f.username}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 text-center text-sm text-gray-400">
          Loading Team Matrix...
        </div>
      }
    >
      <TeamContent />
    </Suspense>
  );
}
