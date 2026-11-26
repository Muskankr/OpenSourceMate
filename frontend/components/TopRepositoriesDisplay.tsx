import React, { useState } from "react";
import type { Repository } from "../types/api";

export interface TopRepositoriesDisplayProps {
  repositories: Repository[];
  theme?: "dark" | "light";
  title?: string;
  className?: string;
}

export const TopRepositoriesDisplay: React.FC<TopRepositoriesDisplayProps> = ({
  repositories,
  theme = "dark",
  title = "Top Repositories",
  className = "",
}) => {
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"stars" | "recent">("stars");
  const [excludeForks, setExcludeForks] = useState(true);

  const filtered = repositories.filter((r) => !excludeForks || !r.is_fork);

  const topByStars = [...filtered].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 5);

  const mostRecent = [...filtered]
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime();
      const dateB = new Date(b.updated_at || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const displayedRepos = activeTab === "stars" ? topByStars : mostRecent;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recently";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div
      className={`rounded-2xl border p-6 transition-all ${
        isDark
          ? "bg-slate-900/40 border-slate-800 text-slate-100"
          : "bg-white border-slate-200 text-slate-900 shadow-sm"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Key repository signals used by the open-source matching engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Forks toggle */}
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludeForks}
              onChange={(e) => setExcludeForks(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-950"
            />
            <span className={isDark ? "text-slate-400" : "text-slate-600"}>Exclude forks</span>
          </label>

          {/* Tab selector */}
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("stars")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "stars"
                  ? isDark
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "bg-white text-emerald-700 shadow-sm"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Top Starred
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("recent")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "recent"
                  ? isDark
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "bg-white text-emerald-700 shadow-sm"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Recently Active
            </button>
          </div>
        </div>
      </div>

      {displayedRepos.length === 0 ? (
        <div
          className={`text-center py-12 rounded-xl border border-dashed ${
            isDark ? "border-slate-800 text-slate-500" : "border-slate-300 text-slate-500"
          }`}
        >
          No matching repositories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRepos.map((repo) => (
            <div
              key={repo.name}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:scale-[1.02] ${
                isDark
                  ? "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                  : "bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm hover:underline truncate group text-emerald-400"
                  >
                    {repo.name}
                  </a>
                  {repo.is_fork && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isDark
                          ? "bg-slate-800 text-slate-400 border border-slate-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      Fork
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs line-clamp-2 mb-3 min-h-[2rem] ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {repo.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/40">
                <div className="flex items-center gap-3">
                  {repo.language && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {repo.stars ?? 0}
                  </span>
                </div>

                <span className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  {formatDate(repo.updated_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopRepositoriesDisplay;
