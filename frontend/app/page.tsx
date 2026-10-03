"use client";

import { useState } from "react";

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

type SkillsData = {
  skills: Skill[];
  total_repositories_analyzed: number;
};

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<SkillsData | null>(null);

  const [error, setError] = useState("");

  const analyzeProfile = async () => {
    if (!username.trim()) {
      setError("Enter a GitHub username to get started.");
      return;
    }

    setLoading(true);
    setError("");
    setProfile(null);
    setSkills(null);

    const cleanUsername = username.trim();

    try {
      // Fetch GitHub profile
      const profileResponse = await fetch(
  `${API_URL}/api/github/users/${cleanUsername}`
);

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => null);

        throw new Error(
          errorData?.detail || "GitHub user could not be found."
        );
      }

      const profileData: Profile = await profileResponse.json();

      setProfile(profileData);

      // Fetch technical skills
      const skillsResponse = await fetch(
  `${API_URL}/api/github/users/${cleanUsername}/skills`
);
      if (!skillsResponse.ok) {
        const errorData = await skillsResponse.json().catch(() => null);

        throw new Error(
          errorData?.detail || "Unable to analyze technical skills."
        );
      }

      const skillsData: SkillsData = await skillsResponse.json();

      setSkills(skillsData);
    } catch (err) {
      console.error("OpenSourceMate error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-white">

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute right-[-200px] top-[400px] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#05070d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
              ✦
            </div>

            <span className="text-lg font-semibold tracking-tight">
              OpenSourceMate
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
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
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              GitHub ↗
            </a>
          </div>

        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-16 pt-20 sm:pt-28">
        <div className="mx-auto max-w-5xl text-center">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Open-source contribution discovery
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Find the open-source issues
            <span className="block bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
              that fit your skills.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
            OpenSourceMate analyzes your GitHub profile and technical
            experience to help you discover meaningful open-source
            contribution opportunities.
          </p>

        </div>
      </section>

      {/* Analyzer */}
      <section id="analyzer" className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-4">

            <div className="flex flex-col gap-3 sm:flex-row">

              <div className="flex flex-1 items-center rounded-2xl border border-white/10 bg-black/20 px-5">

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
                    if (e.key === "Enter") {
                      analyzeProfile();
                    }
                  }}
                  className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-gray-600 sm:text-base"
                />

              </div>

              <button
                onClick={analyzeProfile}
                disabled={loading}
                className="rounded-2xl bg-white px-7 py-4 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                {loading ? "Analyzing..." : "Analyze Profile"}
              </button>

            </div>

          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-gray-600">
            No GitHub login required • Public profile data only
          </p>

        </div>
      </section>

      {/* Results */}
      {(profile || skills) && (
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">

            {/* Section heading */}
            <div className="mb-8">
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
                      We couldn&apos;t detect programming languages from this profile.
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

            {/* Coming next */}
            <div className="mt-6 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/5 p-6 sm:p-8">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <div className="mb-3 inline-flex rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-300">
                    NEXT
                  </div>

                  <h3 className="text-xl font-bold">
                    Find issues that match your skills
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                    OpenSourceMate will compare your technical profile with
                    open GitHub issues and recommend contribution opportunities
                    based on compatibility.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center">
                  <p className="text-2xl">🎯</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Coming next
                  </p>
                </div>

              </div>

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
            />

            <StepCard
              number="02"
              icon="✦"
              title="Understand your skills"
              description="OpenSourceMate analyzes your repositories to identify the technologies you already work with."
            />

            <StepCard
              number="03"
              icon="→"
              title="Find your match"
              description="Discover open-source issues that align with your skills and contribution goals."
            />

          </div>

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

        </div>
      </footer>

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


function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:bg-white/[0.04]">

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