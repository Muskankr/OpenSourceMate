"use client";
import { useEffect, useState } from "react";

import GitHubLink from "../components/GitHubLink";
import StarterCommentModal from "../components/StarterCommentModal";
import FAQ from "../components/FAQ";
import {
  downloadFile,
  generateJsonReport,
  generateMarkdownReport,
  type ExportPayload,
} from "../utils/exportAnalysis";

type Profile = {
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repositories: number;
  followers: number;
  following: number;
  profile_url: string;
};

type Skill = {
  name: string;
  repository_count: number;
  percentage: number;
};

type Recommendation = {
  id: number;
  title: string;
  repository: string;
  url: string;
  state: string;
  labels: string[];
  comments: number;
  created_at: string;
  updated_at: string;
  language?: string;
  match_score?: number;
  score?: number;
  match_reasons?: string[];
  reasons?: string[];
};

type SkillsData = {
  skills: Skill[];
  total_repositories_analyzed: number;
};

async function rateLimitMessage(response: Response): Promise<string> {
  let resetAt: Date | null = null;

  try {
    const data = await response.json();
    if (data.reset_at) resetAt = new Date(data.reset_at);
  } catch {
    // Body was not JSON, use the generic text below.
  }

  if (resetAt && !Number.isNaN(resetAt.getTime())) {
    const time = resetAt.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return `GitHub rate limit reached, try again at ${time}.`;
  }

  return "GitHub API rate limit reached. Please try again in a few minutes.";
}

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const [theme, setTheme] = useState<"dark" | "light">("dark");

useEffect(() => {
  const timer = setTimeout(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, 0);

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}, [theme]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<SkillsData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingMatching, setLoadingMatching] = useState(false);
  const [matchingError, setMatchingError] = useState("");

  const [error, setError] = useState("");
  const [lastAnalyzed, setLastAnalyzed] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchMatchedIssues = async (targetUsername: string) => {
    setLoadingMatching(true);
    setMatchingError("");

    try {
      const matchResponse = await fetch(
        `${API_URL}/api/matching/users/${encodeURIComponent(targetUsername)}/issues`
      );

      if (!matchResponse.ok) {
        setMatchingError("Unable to load recommended issues right now.");
        return;
      }

      const matchData = await matchResponse.json();
      setRecommendations(matchData.recommendations || []);
    } catch {
      setMatchingError("Unable to load recommended issues. Please try again later.");
    } finally {
      setLoadingMatching(false);
    }
  };

  const handleExport = (format: "markdown" | "json") => {
    if (!profile) return;

    const payload: ExportPayload = {
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      profileUrl: profile.profile_url,
      repositoriesCount: profile.public_repositories,
      followers: profile.followers,
      following: profile.following,
      skills: skills?.skills || [],
      totalRepositoriesAnalyzed: skills?.total_repositories_analyzed || 0,
      exportedAt: new Date().toISOString().split("T")[0],
    };

    if (format === "markdown") {
      const content = generateMarkdownReport(payload);
      downloadFile(
        content,
        `opensourcemate-${profile.username}-analysis.md`,
        "text/markdown;charset=utf-8"
      );
    } else {
      const content = generateJsonReport(payload);
      downloadFile(
        content,
        `opensourcemate-${profile.username}-analysis.json`,
        "application/json;charset=utf-8"
      );
    }
  };

  const analyzeProfile = async (override?: string) => {
    const cleanUsername = (override ?? username).trim().replace(/^@/, "");

    if (!cleanUsername) {
      setError("Please enter a GitHub username.");
      return;
    }

    const usernamePattern =
      /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

    if (!usernamePattern.test(cleanUsername)) {
      setError(
        "Invalid GitHub username. Use up to 39 letters, numbers, or single hyphens; don't start or end with a hyphen."
      );
      return;
    }

    if (loading) return;

    setUsername(cleanUsername);
    setLastAnalyzed(cleanUsername);
    setCanRetry(false);
    setLoading(true);
    setError("");

    // Only clear previous analysis if analyzing a different username
    if (cleanUsername.toLowerCase() !== profile?.username?.toLowerCase()) {
      setProfile(null);
      setSkills(null);
    }

    try {
      if (!API_URL) {
        throw new Error("The analyzer is not configured right now. Please try again later.");
      }

      const profileResponse = await fetch(
        `${API_URL}/api/github/users/${encodeURIComponent(cleanUsername)}`
      );

      if (profileResponse.status === 429) {
        throw new Error(await rateLimitMessage(profileResponse));
      }

      if (profileResponse.status === 502 || profileResponse.status === 503) {
        throw new Error("GitHub API is temporarily unavailable. Please try again in a few moments.");
      }

      if (profileResponse.status === 404) {
        setError("GitHub user not found. Check the username and try again.");
        return;
      }

      if (!profileResponse.ok) {
        throw new Error("Unable to retrieve this GitHub profile. Please try again.");
      }

      const profileData: Profile = await profileResponse.json();

      const skillsResponse = await fetch(
        `${API_URL}/api/github/users/${encodeURIComponent(cleanUsername)}/skills`
      );

      if (skillsResponse.status === 429) {
        throw new Error(await rateLimitMessage(skillsResponse));
      }

      if (skillsResponse.status === 502 || skillsResponse.status === 503) {
        throw new Error("GitHub API is temporarily unavailable. Please try again in a few moments.");
      }

      if (!skillsResponse.ok) {
        throw new Error("Unable to analyze this profile's skills. Please try again.");
      }

      const skillsData: SkillsData = await skillsResponse.json();

      setProfile(profileData);
      setSkills(skillsData);

      fetchMatchedIssues(cleanUsername);
    } catch (err) {
      setCanRetry(true);
      if (err instanceof TypeError) {
        setError("Unable to connect to server. Please check your internet connection and ensure the backend is running.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
  className={`min-h-screen overflow-hidden transition-colors duration-300 ${
    theme === "dark"
      ? "bg-[#05070d] text-white"
      : "bg-gray-50 text-gray-900"
  }`}
>

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute right-[-200px] top-[400px] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav
  className={`border-b backdrop-blur-xl transition-colors duration-300 ${
    theme === "dark"
      ? "border-white/5 bg-[#05070d]/80"
      : "border-gray-200 bg-white/90"
  }`}
>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
              ✦
            </div>

            <span className="text-lg font-semibold tracking-tight">
              OpenSourceMate
            </span>
          </div>

          <div
  className={`hidden items-center gap-8 text-sm md:flex ${
    theme === "dark" ? "text-gray-400" : "text-gray-600"
  }`}
>
            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How it works
            </a>

            <a
              href="#analyzer"
              className="transition hover:text-white"
            >
              Analyzer
            </a>

            <a
              href="#faq"
              className="transition hover:text-white"
            >
              FAQ
            </a>

            <button
              onClick={() => setIsCommentModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
            >
              <span>💬</span> Starter Comments
            </button>
            <GitHubLink className="transition hover:text-white"/>
            <button
  type="button"
  onClick={() => setTheme((current) =>
    current === "dark" ? "light" : "dark"
  )}
  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
>
  {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
</button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:bg-white/10 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/5 bg-[#05070d]/95 px-6 py-4 shadow-2xl backdrop-blur-2xl md:hidden">
            <div className="flex flex-col gap-3 text-sm text-gray-300">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-white"
              >
                How it works
              </a>

              <a
                href="#analyzer"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-white"
              >
                Analyzer
              </a>

              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-white"
              >
                FAQ
              </a>

              <div
                className="rounded-xl px-3 py-2 transition hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <GitHubLink className="transition hover:text-white" />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="px-6 pb-16 pt-20 sm:pt-28">
        <div className="mx-auto max-w-5xl text-center">

          <div
  className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
    theme === "dark"
      ? "border-white/10 bg-white/[0.04] text-gray-300"
      : "border-gray-200 bg-white text-gray-700"
  }`}
>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Open-source contribution discovery
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Find the open-source issues
    <span
  className={`block bg-clip-text text-transparent ${
    theme === "dark"
      ? "bg-gradient-to-r from-white via-gray-300 to-gray-500"
      : "bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500"
  }`}
>
  that fit your skills.
</span>
          </h1>

          <p
  className={`mx-auto mt-6 max-w-2xl text-base leading-7 sm:text-lg ${
    theme === "dark" ? "text-gray-400" : "text-gray-600"
  }`}
>
            OpenSourceMate analyzes your GitHub profile and technical
            experience to help you discover meaningful open-source
            contribution opportunities.
          </p>

        </div>
      </section>

      {/* Analyzer */}
      <section id="analyzer" className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">

         <div
  className={`rounded-3xl border p-3 shadow-2xl backdrop-blur-xl sm:p-4 ${
    theme === "dark"
      ? "border-white/10 bg-white/[0.035] shadow-black/30"
      : "border-gray-200 bg-white shadow-gray-300/40"
  }`}
> 

            <div className="flex flex-col gap-3 sm:flex-row">

              <div
  className={`flex flex-1 items-center rounded-2xl border px-5 ${
    theme === "dark"
      ? "border-white/10 bg-black/20"
      : "border-gray-200 bg-white"
  }`}
>

                <span className="mr-3 text-gray-500">
                  @
                </span>

                <input
                  type="text"
                  placeholder="Enter your GitHub username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      analyzeProfile();
                    }
                  }}
                  className={`w-full bg-transparent py-4 text-sm outline-none sm:text-base ${
  theme === "dark"
    ? "text-white placeholder:text-gray-500"
    : "text-gray-900 placeholder:text-gray-500"
}`}
                />

              </div>

              <button
                onClick={() => analyzeProfile()}
                disabled={loading}
                className="rounded-2xl bg-white px-7 py-4 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                {loading ? "Analyzing..." : "Analyze Profile"}
              </button>

            </div>

          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center text-sm text-red-400 sm:flex-row"
            >
              <span>{error}</span>
              {canRetry && lastAnalyzed && !loading && (
                <button
                  onClick={() => analyzeProfile(lastAnalyzed)}
                  className="rounded-lg border border-red-400/30 px-3 py-1 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <p
  className={`mt-4 text-center text-xs ${
    theme === "dark" ? "text-gray-600" : "text-gray-500"
  }`}
>
            No GitHub login required • Public profile data only
          </p>

        </div>
      </section>

      {/* Loading skeleton */}
      {loading && (
        <section className="px-6 pb-24" aria-busy="true" aria-label="Analyzing profile">
          <div className="mx-auto max-w-5xl">
            <ProfileSkeleton />
            <SkillsSkeleton />
          </div>
        </section>
      )}

      {/* Results */}
      {(profile || skills) && (
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">

            {/* Section heading */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-purple-400">
                  PROFILE ANALYSIS
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Your developer profile
                </h2>

                <p className="mt-2 text-gray-500">
                  Here&apos;s what OpenSourceMate discovered from your GitHub activity.
                </p>
              </div>

              {profile && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport("markdown")}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                    title="Export summary as Markdown (.md)"
                  >
                    <span>↓</span> Export Markdown
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                    title="Export raw data as JSON (.json)"
                  >
                    <span>↓</span> Export JSON
                  </button>
                </div>
              )}
            </div>

            {/* Profile card */}
            {profile && (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">

                <div className="p-6 sm:p-8">

                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-5">

                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="h-20 w-20 rounded-2xl border border-white/10 object-cover sm:h-24 sm:w-24"
                      />

                      <div>
                        <h3 className="text-xl font-bold sm:text-2xl">
                          {profile.name || profile.username}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          @{profile.username}
                        </p>

                        {profile.bio && (
                          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
                            {profile.bio}
                          </p>
                        )}
                      </div>

                    </div>

                    <a
                      href={profile.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >
                      View GitHub ↗
                    </a>

                  </div>

                  {/* Stats */}
                  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">

                    <StatCard
                      value={profile.public_repositories}
                      label="Repositories"
                    />

                    <StatCard
                      value={profile.followers}
                      label="Followers"
                    />

                    <StatCard
                      value={profile.following}
                      label="Following"
                    />

                  </div>

                </div>
              </div>
            )}

            {/* Skills */}
            {skills && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">

                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">

                  <div>
                    <p className="text-sm font-medium text-purple-400">
                      TECHNICAL PROFILE
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      Your technical skills
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Detected from your public GitHub repositories.
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    {skills.total_repositories_analyzed} repositories analyzed
                  </div>

                </div>

                {skills.skills.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-center">
                    <p className="text-gray-400">
                      No public repositories with a language were found for this
                      profile, so there are no skills to show yet.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-5 sm:grid-cols-2">

                    {skills.skills.map((skill) => (
                      <SkillCard
                        key={skill.name}
                        skill={skill}
                      />
                    ))}

                  </div>
                )}

              </div>
            )}

            {/* Recommended Issues Section (Issue #40) */}
            <div id="recommendations" className="mt-6 rounded-3xl border border-purple-500/20 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-300">
                    <span>🎯</span> MATCHED ISSUES
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight">
                    Recommended contribution opportunities
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Opportunities matching your skills and experience, ranked by compatibility score.
                  </p>
                </div>

                {recommendations.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {recommendations.length} {recommendations.length === 1 ? "issue" : "issues"} recommended
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loadingMatching && (
                <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                  <p className="text-sm text-gray-300">Searching GitHub for issues matching your skills...</p>
                </div>
              )}

              {/* Error State */}
              {!loadingMatching && matchingError && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center">
                  <p className="text-sm text-red-300">{matchingError}</p>
                </div>
              )}

              {/* Empty State */}
              {!loadingMatching && !matchingError && recommendations.length === 0 && (
                <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <p className="text-gray-400">
                    No matching open issues found for the detected skills at this time.
                  </p>
                </div>
              )}

              {/* Issue list */}
              {!loadingMatching && recommendations.length > 0 && (
                <div className="mt-6 space-y-4">
                  {recommendations.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-y border-white/5 bg-white/[0.015] px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">

          <div className="text-center">
            <p className="text-sm font-medium text-purple-400">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From profile to contribution
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              A simple workflow designed to remove the guesswork from
              getting started with open source.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">

            <StepCard
              number="01"
              icon="⌕"
              title="Analyze your profile"
              description="Connect your public GitHub profile and understand your existing technical experience."
              theme={theme}
            />

            <StepCard
              number="02"
              icon="✦"
              title="Understand your skills"
              description="OpenSourceMate analyzes your repositories to identify the technologies you already work with."
              theme={theme}
            />

            <StepCard
              number="03"
              icon="→"
              title="Find your match"
              description="Discover open-source issues that align with your skills and contribution goals."
              theme={theme}
            />

          </div>

        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 pt-24">
        <div className="mx-auto max-w-5xl">

          <div className="text-center">
            <p className="text-sm font-medium text-purple-400">
              FAQ
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              What OpenSourceMate looks at, and what it leaves alone.
            </p>
          </div>

          <FAQ theme={theme} />

        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-14 text-center sm:px-12">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-black">
            ✦
          </div>

          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Your next contribution is out there.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Stop scrolling through thousands of issues.
            Start contributing to projects where your skills can make an impact.
          </p>

          <button
            onClick={() => {
              document
                .getElementById("analyzer")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-8 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            Analyze My GitHub →
          </button>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">

          <p>
            © {new Date().getFullYear()} OpenSourceMate
          </p>

          <p>
            Built for the open-source community.
          </p>

          <GitHubLink className="transition hover:text-white">
            View Repository ↗
          </GitHubLink>

        </div>
      </footer>

    <StarterCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        defaultTech={skills?.skills?.[0]?.name || "Python"}
      />
    </main>
  );
}


/* ---------------------------------- */
/* Reusable Components                */
/* ---------------------------------- */

function StatCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
      <p className="text-2xl font-bold tracking-tight">
        {value.toLocaleString()}
      </p>

      <p className="mt-1 text-xs uppercase tracking-wider text-gray-600">
        {label}
      </p>
    </div>
  );
}


function SkillCard({
  skill,
}: {
  skill: Skill;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-5">

      <div className="flex items-center justify-between">

        <div>
          <h4 className="font-semibold">
            {skill.name}
          </h4>

          <p className="mt-1 text-xs text-gray-600">
            {skill.repository_count}{" "}
            {skill.repository_count === 1 ? "repository" : "repositories"}
          </p>
        </div>

        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
          {skill.percentage}%
        </span>

      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-700"
          style={{
            width: `${skill.percentage}%`,
          }}
        />

      </div>

    </div>
  );
}


function IssueCard({
  issue,
}: {
  issue: Recommendation;
}) {
  const score = issue.match_score ?? issue.score ?? 0;
  const reasons = issue.match_reasons ?? issue.reasons ?? [];

  const getScoreBadgeStyle = (s: number) => {
    if (s >= 70) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    if (s >= 40) return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  };

  const formattedDate = issue.updated_at
    ? new Date(issue.updated_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-white/20 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-purple-300">{issue.repository}</span>
            {issue.language && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-gray-300">
                {issue.language}
              </span>
            )}
            {formattedDate && (
              <span className="text-gray-500">Updated {formattedDate}</span>
            )}
            <span className="text-gray-500">💬 {issue.comments} comments</span>
          </div>

          <h4 className="mt-2 text-base font-semibold leading-snug sm:text-lg">
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-purple-300"
            >
              {issue.title}
            </a>
          </h4>

          {issue.labels && issue.labels.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {issue.labels.slice(0, 6).map((label, idx) => {
                const isGoodFirst = label.toLowerCase().includes("good first issue");
                const isHelpWanted = label.toLowerCase().includes("help wanted");
                return (
                  <span
                    key={idx}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      isGoodFirst
                        ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : isHelpWanted
                        ? "border border-amber-400/30 bg-amber-400/10 text-amber-300"
                        : "border border-white/10 bg-white/5 text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}

          {reasons.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-400">
              <p className="font-medium text-gray-300">Why this matches:</p>
              <ul className="mt-1.5 space-y-1">
                {reasons.map((reason, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-purple-400">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div
            className={`rounded-xl border px-3 py-1.5 text-center text-xs font-semibold ${getScoreBadgeStyle(
              score
            )}`}
          >
            <span className="text-sm font-bold sm:text-base">{score}%</span>
            <span className="block text-[10px] uppercase text-gray-400">Match</span>
          </div>

          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 transition hover:bg-white hover:text-black"
          >
            View on GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
  theme,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
  theme: "dark" | "light";
}) 

{
  return (
  <div
  className={`group rounded-3xl border p-6 transition hover:-translate-y-1 ${
    theme === "dark"
      ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.04]"
      : "border-gray-200 bg-white shadow-sm hover:bg-gray-50"
  }`}
>  

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
          {icon}
        </div>

        <span className="text-xs font-medium tracking-widest text-gray-700">
          {number}
        </span>

      </div>

      <h3 className="mt-7 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-gray-500">
        {description}
      </p>

    </div>
  );
}

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}


function ProfileSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 animate-pulse rounded-2xl bg-white/10 sm:h-24 sm:w-24" />
        <div className="flex-1 space-y-3">
          <Bar className="h-6 w-48" />
          <Bar className="h-4 w-28" />
          <Bar className="h-4 w-full max-w-xl" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-black/20 p-5">
            <Bar className="h-7 w-16" />
            <Bar className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}


function SkillsSkeleton() {
  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <Bar className="h-4 w-32" />
      <Bar className="mt-3 h-7 w-56" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-black/20 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Bar className="h-4 w-24" />
                <Bar className="h-3 w-16" />
              </div>
              <Bar className="h-6 w-12" />
            </div>
            <Bar className="mt-5 h-1.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
