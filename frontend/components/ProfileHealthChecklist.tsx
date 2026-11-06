"use client";

import { memo } from "react";
import { type ProfileHealthResult } from "../utils/profileHealth";

export interface ProfileHealthChecklistProps {
  health: ProfileHealthResult;
  theme?: "dark" | "light";
  className?: string;
}

export const ProfileHealthChecklist = memo(function ProfileHealthChecklist({
  health,
  theme = "dark",
  className = "",
}: ProfileHealthChecklistProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-colors ${
        isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
      } ${className}`}
      role="region"
      aria-label="GitHub profile readiness checklist"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight sm:text-base">
            Open-Source Profile Readiness
          </h3>
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Practical tips to make your GitHub profile welcoming to maintainers and mentors
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-purple-400">
            {health.passedCount} of {health.totalCount}
          </span>
          <div className="text-[10px] uppercase font-semibold opacity-60">
            Checklist Completed
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {health.items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 rounded-xl border p-3 text-xs transition ${
              item.passed
                ? isDark
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-emerald-200 bg-emerald-50/50"
                : isDark
                ? "border-white/5 bg-white/[0.01]"
                : "border-gray-100 bg-gray-50/60"
            }`}
          >
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                item.passed
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : isDark
                  ? "bg-white/10 text-gray-400 border border-white/10"
                  : "bg-gray-200 text-gray-500 border border-gray-300"
              }`}
              aria-hidden="true"
            >
              {item.passed ? "✓" : "○"}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${item.passed ? "text-emerald-400" : ""}`}>
                  {item.title}
                </span>
                {item.impact === "high" && !item.passed && (
                  <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-amber-300 uppercase">
                    Recommended
                  </span>
                )}
              </div>
              <p
                className={`mt-0.5 leading-relaxed ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {item.tip}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ProfileHealthChecklist;
