"use client";

import React, { useState, useId } from "react";
import { SkillEvidenceRepository } from "../types/api";

export interface SkillEvidenceToggleProps {
  skillName: string;
  evidence?: SkillEvidenceRepository[] | null;
  theme?: "dark" | "light";
  className?: string;
}

/**
 * Format bytes into human-readable string (e.g. 1.2 KB, 450 KB, 2.5 MB).
 */
function formatBytes(bytes?: number | null): string {
  if (bytes == null || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format ISO timestamp into human-readable relative/short date.
 */
function formatDate(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * SkillEvidenceToggle (Issue #480)
 *
 * Displays a 'Why?' toggle next to a skill badge that expands the list of contributing
 * repositories with keyboard accessibility, screen reader announcements, and links.
 */
export default function SkillEvidenceToggle({
  skillName,
  evidence = [],
  theme = "dark",
  className = "",
}: SkillEvidenceToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();
  const buttonId = useId();
  const isDark = theme === "dark";

  const repoList = evidence || [];

  return (
    <div className={`inline-block ${className}`}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-label={`Why was ${skillName} detected? Click to ${isOpen ? "hide" : "view"} contributing repositories.`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
          isDark
            ? isOpen
              ? "border-purple-400/50 bg-purple-500/20 text-purple-200"
              : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10"
            : isOpen
              ? "border-purple-400 bg-purple-100 text-purple-900"
              : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <span aria-hidden="true" className="text-[10px]">
          {isOpen ? "▲" : "▼"}
        </span>
        <span>Why?</span>
      </button>

      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={buttonId}
          className={`mt-2.5 rounded-xl border p-3 text-xs shadow-lg transition-all duration-200 ${
            isDark
              ? "border-white/10 bg-black/40 text-gray-200 backdrop-blur-md"
              : "border-gray-200 bg-white text-gray-800 shadow-gray-200/50"
          }`}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-purple-400">
              Contributing Repositories
            </span>
            <span className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {repoList.length} {repoList.length === 1 ? "source" : "sources"} (max 5)
            </span>
          </div>

          {repoList.length === 0 ? (
            <p className={`mt-2 text-[11px] italic ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              No repository breakdown available for this skill.
            </p>
          ) : (
            <ul className="mt-2 space-y-2" aria-label={`Contributing repositories for ${skillName}`}>
              {repoList.map((repo, idx) => {
                const formattedBytes = formatBytes(repo.bytes);
                const formattedDate = formatDate(repo.last_updated);

                return (
                  <li
                    key={repo.name || idx}
                    className={`flex flex-col gap-0.5 rounded-lg p-1.5 transition ${
                      isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={repo.url || `https://github.com/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-purple-400 hover:underline hover:text-purple-300 truncate max-w-[200px] sm:max-w-[280px]"
                        aria-label={`Open repository ${repo.name} in new tab`}
                      >
                        {repo.name}
                      </a>

                      {repo.share != null && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono shrink-0 ${
                            isDark ? "bg-white/10 text-gray-300" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {repo.share}%
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex flex-wrap items-center gap-x-3 text-[10px] ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formattedBytes && <span>Bytes: {formattedBytes}</span>}
                      {formattedDate && <span>Updated: {formattedDate}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
