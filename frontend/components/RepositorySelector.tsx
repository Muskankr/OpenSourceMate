"use client";

import React, { useMemo, useState } from "react";

export interface RepositoryItem {
  id?: number | string;
  name: string;
  full_name: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  fork: boolean;
  archived?: boolean;
  updated_at?: string;
}

export interface RepositorySelectorProps {
  repositories: RepositoryItem[];
  selectedRepoNames?: string[];
  onChange?: (selectedRepos: RepositoryItem[]) => void;
  className?: string;
}

/**
 * RepositorySelector Component
 *
 * Allows users to choose which repositories are included when calculating
 * their skills and matching issues.
 *
 * Defaults:
 * - Original source repositories are checked by default.
 * - Forks and archived repositories are unchecked by default.
 * - Supports "Select All", "Clear All", and filter searches.
 * - Includes ARIA live announcements for screen readers.
 */
export default function RepositorySelector({
  repositories,
  selectedRepoNames,
  onChange,
  className = "",
}: RepositorySelectorProps) {
  // Initialize selection: default to non-fork, non-archived repositories
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(() => {
    if (selectedRepoNames && selectedRepoNames.length > 0) {
      const initial: Record<string, boolean> = {};
      selectedRepoNames.forEach((name) => {
        initial[name] = true;
      });
      return initial;
    }

    const defaultSelection: Record<string, boolean> = {};
    repositories.forEach((repo) => {
      // Exclude forks and archived repos by default
      defaultSelection[repo.full_name] = !repo.fork && !repo.archived;
    });
    return defaultSelection;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sources" | "forks">("all");
  const [announcement, setAnnouncement] = useState("");

  // Notify parent component on selection changes
  const notifyChange = (updatedMap: Record<string, boolean>) => {
    if (onChange) {
      const selected = repositories.filter((r) => updatedMap[r.full_name]);
      onChange(selected);
    }
  };

  const toggleRepo = (fullName: string) => {
    const nextState = !selectedMap[fullName];
    const updated = { ...selectedMap, [fullName]: nextState };
    setSelectedMap(updated);
    setAnnouncement(
      `${fullName} ${nextState ? "included in" : "excluded from"} analysis.`
    );
    notifyChange(updated);
  };

  const handleSelectAll = () => {
    const updated: Record<string, boolean> = {};
    repositories.forEach((r) => {
      updated[r.full_name] = true;
    });
    setSelectedMap(updated);
    setAnnouncement(`All ${repositories.length} repositories selected.`);
    notifyChange(updated);
  };

  const handleClearAll = () => {
    const updated: Record<string, boolean> = {};
    repositories.forEach((r) => {
      updated[r.full_name] = false;
    });
    setSelectedMap(updated);
    setAnnouncement("All repositories deselected.");
    notifyChange(updated);
  };

  const handleSelectDefaults = () => {
    const updated: Record<string, boolean> = {};
    repositories.forEach((r) => {
      updated[r.full_name] = !r.fork && !r.archived;
    });
    setSelectedMap(updated);
    setAnnouncement("Restored default selection (forks and archived excluded).");
    notifyChange(updated);
  };

  // Filtered view list
  const filteredRepositories = useMemo(() => {
    return repositories.filter((repo) => {
      if (filterType === "sources" && (repo.fork || repo.archived)) return false;
      if (filterType === "forks" && !repo.fork) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = repo.name.toLowerCase().includes(term);
        const matchesLang = repo.language?.toLowerCase().includes(term);
        const matchesDesc = repo.description?.toLowerCase().includes(term);
        return matchesName || matchesLang || matchesDesc;
      }
      return true;
    });
  }, [repositories, searchTerm, filterType]);

  const selectedCount = Object.values(selectedMap).filter(Boolean).length;

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm ${className}`}
    >
      {/* ARIA live region for screen-reader feedback */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🗂️</span> Included Repositories
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              {selectedCount} of {repositories.length} selected
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select which repositories best reflect your skills. Forks and archived repositories are excluded by default.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleSelectDefaults}
            className="px-2.5 py-1.5 rounded-lg text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200/60 dark:border-primary-800/60 transition-colors"
          >
            Defaults
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter repositories by name or language..."
          aria-label="Filter repositories"
          className="w-full sm:flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="flex items-center gap-1 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterType === "all"
                ? "bg-slate-200 dark:bg-slate-700 font-medium text-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            All ({repositories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("sources")}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterType === "sources"
                ? "bg-slate-200 dark:bg-slate-700 font-medium text-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Sources ({repositories.filter((r) => !r.fork && !r.archived).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("forks")}
            className={`px-2 py-1 rounded-md transition-colors ${
              filterType === "forks"
                ? "bg-slate-200 dark:bg-slate-700 font-medium text-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Forks ({repositories.filter((r) => r.fork).length})
          </button>
        </div>
      </div>

      {/* Repositories Checklist Container */}
      <div
        role="group"
        aria-label="Repository selection checklist"
        className="max-h-72 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40"
      >
        {filteredRepositories.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No repositories matching your filter.
          </p>
        ) : (
          filteredRepositories.map((repo) => {
            const isSelected = Boolean(selectedMap[repo.full_name]);
            return (
              <label
                key={repo.full_name}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer select-none text-xs ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 border-primary-300 dark:border-primary-800 shadow-xs"
                    : "bg-slate-50/70 dark:bg-slate-950/20 border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/40 opacity-70"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRepo(repo.full_name)}
                  aria-label={`Include repository ${repo.full_name}`}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {repo.name}
                    </span>
                    {repo.fork && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Fork
                      </span>
                    )}
                    {repo.archived && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Archived
                      </span>
                    )}
                    {repo.language && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • {repo.language}
                      </span>
                    )}
                    {typeof repo.stargazers_count === "number" && repo.stargazers_count > 0 && (
                      <span className="text-[11px] text-amber-500">
                        ★ {repo.stargazers_count}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">
                      {repo.description}
                    </p>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
