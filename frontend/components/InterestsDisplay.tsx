"use client";

import React from "react";

export interface StarredTopic {
  topic: string;
  count: number;
}

export interface StarredLanguage {
  language: string;
  count: number;
}

export interface InterestsDisplayProps {
  topics: StarredTopic[];
  languages: StarredLanguage[];
  starredCount?: number;
  className?: string;
}

/**
 * InterestsDisplay Component
 *
 * Visually distinguishes user curiosity and aspirations (starred repositories)
 * from proven historical skills (authored repository codebase).
 */
export default function InterestsDisplay({
  topics,
  languages,
  starredCount,
  className = "",
}: InterestsDisplayProps) {
  if (topics.length === 0 && languages.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 backdrop-blur-md p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>✨</span> Areas of Interest & Curiosity
            {typeof starredCount === "number" && (
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                Derived from {starredCount} starred repos
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Topics and technologies you follow or explore, distinct from your authored code.
          </p>
        </div>
      </div>

      {/* Topics Cloud */}
      {topics.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
            Followed Topics
          </span>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span
                key={t.topic}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                <span>#{t.topic}</span>
                {t.count > 1 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    ×{t.count}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Starred Languages */}
      {languages.length > 0 && (
        <div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
            Languages You Follow
          </span>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <span
                key={l.language}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border border-amber-200/80 dark:border-amber-800/80"
              >
                <span>{l.language}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200">
                  {l.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
