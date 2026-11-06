"use client";

import { memo } from "react";

export interface ExternalPrHistory {
  username: string;
  total_merged_prs: number;
  repositories_count: number;
  top_repositories: Array<{ repository: string; count: number }>;
  recent_prs: Array<{
    id: number;
    title: string;
    html_url: string;
    repository: string;
    created_at: string;
    closed_at?: string;
  }>;
}

export interface ExternalContributionsProps {
  data: ExternalPrHistory | null;
  loading?: boolean;
  theme?: "dark" | "light";
  className?: string;
}

export const ExternalContributions = memo(function ExternalContributions({
  data,
  loading = false,
  theme = "dark",
  className = "",
}: ExternalContributionsProps) {
  const isDark = theme === "dark";

  if (loading) {
    return (
      <div
        className={`rounded-2xl border p-5 sm:p-6 animate-pulse ${
          isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
        } ${className}`}
      >
        <div className="h-5 w-48 rounded bg-white/10 mb-4" />
        <div className="h-12 w-full rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!data || data.total_merged_prs === 0) {
    return (
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-colors ${
          isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
        } ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold tracking-tight sm:text-base">
            Open-Source Contributions
          </h3>
          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-xs text-purple-300">
            0 Merged PRs
          </span>
        </div>
        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          No merged pull requests detected in external repositories yet. OpenSourceMate can help you find beginner-friendly issues to make your very first open-source contribution!
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-colors ${
        isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight sm:text-base">
            External Open-Source Impact
          </h3>
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Merged pull requests authored in repositories outside @{data.username}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold tracking-tight text-purple-400">
            {data.total_merged_prs}
          </span>
          <div className="text-[10px] uppercase font-semibold opacity-70">
            Merged PRs
          </div>
        </div>
      </div>

      {data.top_repositories.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
            Contributed Repositories
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.top_repositories.map((repo) => (
              <a
                key={repo.repository}
                href={`https://github.com/${repo.repository}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg px-2.5 py-1 text-xs font-mono border transition hover:underline ${
                  isDark
                    ? "border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800"
                }`}
              >
                {repo.repository}{" "}
                <span className="text-[10px] text-purple-400 font-bold ml-1">
                  ({repo.count})
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ExternalContributions;
