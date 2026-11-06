"use client";

import { useState, useMemo } from "react";
import {
  type SkillTimelineData,
  filterMinorLanguages,
} from "../utils/skillTimeline";

export interface SkillTimelineChartProps {
  timeline: SkillTimelineData;
  theme?: "dark" | "light";
  className?: string;
}

const TIMELINE_PALETTE = [
  "#a855f7", // Purple
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#64748b", // Slate
];

export default function SkillTimelineChart({
  timeline,
  theme = "dark",
  className = "",
}: SkillTimelineChartProps) {
  const [hideMinor, setHideMinor] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const isDark = theme === "dark";

  const activeData = useMemo(() => {
    return hideMinor ? filterMinorLanguages(timeline, 2) : timeline;
  }, [timeline, hideMinor]);

  if (activeData.years.length === 0) {
    return (
      <div
        className={`rounded-2xl border p-5 sm:p-6 text-center ${
          isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
        } ${className}`}
      >
        <h3 className="text-sm font-semibold tracking-tight sm:text-base mb-1">
          Skill Growth Timeline
        </h3>
        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          No repository creation history available to construct a timeline.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-colors ${
        isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
      } ${className}`}
      role="region"
      aria-label="Skill growth timeline over years"
    >
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold tracking-tight sm:text-base">
            Skill Growth Timeline
          </h3>
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Evolution of programming languages based on repository creation dates
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Minor Languages */}
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideMinor}
              onChange={(e) => setHideMinor(e.target.checked)}
              className="rounded border-gray-400 text-purple-600 focus:ring-purple-400"
            />
            <span className="opacity-80">Hide minor (&lt;2 repos)</span>
          </label>

          {/* Toggle Table/Chart view */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "chart" ? "table" : "chart")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
              isDark
                ? "border-white/10 bg-white/5 hover:bg-white/10 text-gray-200"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800"
            }`}
            aria-label={`Switch to ${viewMode === "chart" ? "table" : "chart"} view`}
          >
            {viewMode === "chart" ? "View Table" : "View Stacked Bars"}
          </button>
        </div>
      </div>

      {/* Visual Chart View */}
      {viewMode === "chart" ? (
        <div className="space-y-4">
          {activeData.growthByYear.map((yearData) => (
            <div key={yearData.year} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>{yearData.year}</span>
                <span className="opacity-70">
                  {yearData.totalRepositories} {yearData.totalRepositories === 1 ? "repo" : "repos"}
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div
                className="flex h-5 w-full overflow-hidden rounded-lg bg-white/5"
                role="progressbar"
                aria-valuenow={yearData.totalRepositories}
                aria-label={`Repositories created in ${yearData.year}`}
              >
                {Object.entries(yearData.languages).map(([lang, count], idx) => {
                  const widthPercent = (count / yearData.totalRepositories) * 100;
                  const color = TIMELINE_PALETTE[idx % TIMELINE_PALETTE.length];
                  return (
                    <div
                      key={lang}
                      style={{ width: `${widthPercent}%`, backgroundColor: color }}
                      className="h-full relative group transition-all duration-300"
                      title={`${lang}: ${count} repos (${Math.round(widthPercent)}%)`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Palette Legend */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-white/5 text-[11px]">
            {activeData.allLanguages.map((lang, idx) => (
              <div key={lang} className="flex items-center gap-1.5">
                <span
                  style={{ backgroundColor: TIMELINE_PALETTE[idx % TIMELINE_PALETTE.length] }}
                  className="h-2.5 w-2.5 rounded-full"
                  aria-hidden="true"
                />
                <span className="opacity-80">{lang}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 font-semibold">Year</th>
                {activeData.allLanguages.map((lang) => (
                  <th key={lang} className="py-2 px-3 font-semibold">{lang}</th>
                ))}
                <th className="py-2 pl-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeData.growthByYear.map((row) => (
                <tr key={row.year}>
                  <td className="py-2 pr-4 font-bold">{row.year}</td>
                  {activeData.allLanguages.map((lang) => (
                    <td key={lang} className="py-2 px-3 opacity-80">
                      {row.languages[lang] || 0}
                    </td>
                  ))}
                  <td className="py-2 pl-4 font-semibold text-right text-purple-400">
                    {row.totalRepositories}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
