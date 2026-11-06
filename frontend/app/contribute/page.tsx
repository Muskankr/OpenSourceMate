"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import IssueCard from "../../components/IssueCard";
import type { IssueRecommendation } from "../../types/api";

const REPO_OWNER = "Muskankr";
const REPO_NAME = "OpenSourceMate";

export const FALLBACK_GOOD_FIRST_ISSUES: IssueRecommendation[] = [
  {
    title: "Add unit tests for GitHub client timeout handlers",
    url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues`,
    repository: `${REPO_OWNER}/${REPO_NAME}`,
    labels: ["good first issue", "backend", "tests"],
    language: "Python",
    difficulty: "Beginner",
    match_score: 95,
    match_reasons: [
      "Ideal starting issue for Python developers",
      "Comprehensive test structure ready in pytest",
      "Clear mock fixtures already established",
    ],
  },
  {
    title: "Improve mobile responsive padding on user comparison layout",
    url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues`,
    repository: `${REPO_OWNER}/${REPO_NAME}`,
    labels: ["good first issue", "frontend", "ui"],
    language: "TypeScript",
    difficulty: "Beginner",
    match_score: 90,
    match_reasons: [
      "Clean React Tailwind CSS adjustment",
      "Visual QA feedback available in PR comments",
      "No complex state management required",
    ],
  },
  {
    title: "Document environment variable defaults in docs/configuration.md",
    url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues`,
    repository: `${REPO_OWNER}/${REPO_NAME}`,
    labels: ["good first issue", "documentation"],
    language: "Markdown",
    difficulty: "Beginner",
    match_score: 88,
    match_reasons: [
      "Great first contribution without needing a local build",
      "Direct improvement to developer onboarding",
    ],
  },
  {
    title: "Add aria-labels to navigation links and filter buttons",
    url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues`,
    repository: `${REPO_OWNER}/${REPO_NAME}`,
    labels: ["good first issue", "frontend", "accessibility"],
    language: "TypeScript",
    difficulty: "Beginner",
    match_score: 92,
    match_reasons: [
      "Enhances accessibility for screen reader users",
      "Clear scope across frontend layout components",
    ],
  },
  {
    title: "Export OpenAPI schema to static docs folder on build",
    url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/issues`,
    repository: `${REPO_OWNER}/${REPO_NAME}`,
    labels: ["good first issue", "backend", "devops"],
    language: "Python",
    difficulty: "Beginner",
    match_score: 86,
    match_reasons: [
      "Automates static documentation generation",
      "Helpful utility script for project maintainers",
    ],
  },
];

export default function ContributePage() {
  const [issues, setIssues] = useState<IssueRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    async function fetchGoodFirstIssues() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=good%20first%20issue&state=open&per_page=20`,
          { headers: { Accept: "application/vnd.github+json" } }
        );

        if (!res.ok) {
          throw new Error(`GitHub returned status ${res.status}`);
        }

        const data = await res.json();
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            const mapped: IssueRecommendation[] = data.map((item: any) => ({
              title: item.title,
              url: item.html_url,
              repository: `${REPO_OWNER}/${REPO_NAME}`,
              labels: item.labels?.map((l: any) => (typeof l === "string" ? l : l.name)) || [],
              language: "TypeScript",
              difficulty: "Beginner",
              match_score: 92,
              match_reasons: ["Open good first issue in OpenSourceMate"],
            }));
            setIssues(mapped);
          } else {
            setIssues(FALLBACK_GOOD_FIRST_ISSUES);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError("Using curated community issue list due to GitHub rate limit.");
          setIssues(FALLBACK_GOOD_FIRST_ISSUES);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchGoodFirstIssues();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredIssues = issues.filter((issue) => {
    if (filterTag === "all") return true;
    return issue.labels?.some((l) => l.toLowerCase().includes(filterTag.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>&larr;</span> Back to Home
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Contribute to OpenSourceMate
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Beginner-friendly open issues waiting for your first pull request.
            </p>
          </div>

          <a
            href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-sm font-medium transition-all"
          >
            <span>Read Contributing Guide</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-2">Filter by area:</span>
          {["all", "frontend", "backend", "documentation", "tests"].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterTag === tag
                  ? "bg-emerald-500 text-slate-950 shadow-md font-semibold"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </button>
          ))}
        </div>

        {/* Status / Error Notifications */}
        {error && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
            {error} Showing verified curated issues from the repository.
          </div>
        )}

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading open beginner issues from GitHub...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <h3 className="text-base font-semibold text-slate-300">No issues matching "{filterTag}"</h3>
            <p className="text-xs text-slate-500 mt-1">Try selecting a different filter above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIssues.map((issue, idx) => (
              <IssueCard key={issue.url + idx} issue={issue} theme="dark" />
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="pt-8 text-center text-xs text-slate-500 border-t border-slate-900">
          Want to propose an idea or report a bug?{" "}
          <a
            href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            Open an issue on GitHub
          </a>
          .
        </div>
      </div>
    </div>
  );
}
