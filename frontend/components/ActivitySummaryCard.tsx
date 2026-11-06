"use client";

import { memo } from "react";
import { type ActivitySummary } from "../utils/activitySummary";

export interface ActivitySummaryCardProps {
  summary: ActivitySummary | null;
  loading?: boolean;
  theme?: "dark" | "light";
  className?: string;
}

export const ActivitySummaryCard = memo(function ActivitySummaryCard({
  summary,
  loading = false,
  theme = "dark",
  className = "",
}: ActivitySummaryCardProps) {
  const isDark = theme === "dark";

  if (loading) {
    return (
      <div
        className={`rounded-2xl border p-5 sm:p-6 animate-pulse ${
          isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
        } ${className}`}
      >
        <div className="h-5 w-44 rounded bg-white/10 mb-4" />
        <div className="h-24 w-full rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!summary) return null;

  const maxWeeklyCount = Math.max(
    1,
    ...summary.weeklyBuckets.map((b) => b.count)
  );

  const levelBadgeColors = {
    Active: isDark
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : "border-emerald-300 bg-emerald-50 text-emerald-800",
    Occasional: isDark
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-amber-300 bg-amber-50 text-amber-800",
    Inactive: isDark
      ? "border-gray-500/30 bg-gray-500/10 text-gray-400"
      : "border-gray-300 bg-gray-100 text-gray-700",
  }[summary.level];

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-colors ${
        isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
      } ${className}`}
      role="region"
      aria-label="Recent public activity summary"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight sm:text-base">
              Recent Public Activity
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${levelBadgeColors}`}
            >
              {summary.level}
            </span>
          </div>
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Public events in the last 90 days across GitHub
          </p>
        </div>

        {/* Counts Overview */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="font-bold text-white text-sm">{summary.pushesCount}</span>{" "}
            <span className="opacity-70">pushes</span>
          </div>
          <div>
            <span className="font-bold text-white text-sm">{summary.pullRequestsCount}</span>{" "}
            <span className="opacity-70">PRs</span>
          </div>
          <div>
            <span className="font-bold text-white text-sm">{summary.issuesCount}</span>{" "}
            <span className="opacity-70">issues</span>
          </div>
        </div>
      </div>

      {/* 12-Week Activity Mini Bar Chart */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-70 mb-2">
          12-Week Activity Distribution
        </div>
        <div className="flex items-end gap-1.5 h-16 pt-2">
          {summary.weeklyBuckets.map((bucket) => {
            const heightPercent = Math.max(8, Math.round((bucket.count / maxWeeklyCount) * 100));
            return (
              <div
                key={bucket.weekIndex}
                className="flex-1 flex flex-col items-center group relative h-full justify-end"
              >
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-sm transition-all duration-300 ${
                    bucket.count === 0
                      ? isDark
                        ? "bg-white/5"
                        : "bg-gray-200"
                      : isDark
                      ? "bg-purple-500 hover:bg-purple-400"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                  aria-label={`Week of ${bucket.startDate}: ${bucket.count} events`}
                />

                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block z-20 rounded bg-black px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-lg">
                  {bucket.startDate}: {bucket.count} events ({bucket.pushes} pushes, {bucket.pullRequests} PRs)
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] opacity-50 mt-1">
          <span>90 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {summary.totalEvents90d === 0 && (
        <p className={`mt-4 text-xs text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          No public events recorded in the last 90 days. User may be working in private repositories or taking a break.
        </p>
      )}
    </div>
  );
});

export default ActivitySummaryCard;
