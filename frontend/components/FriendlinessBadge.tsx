"use client";

import React, { useEffect, useState } from "react";
import {
  getCachedFriendlinessScore,
  getRepoFriendliness,
  calculateFriendlinessScore,
  type FriendlinessScoreResult,
  type FriendlinessTier,
} from "../utils/repoFriendliness";

export interface FriendlinessBadgeProps {
  repository: string;
  theme?: "dark" | "light";
  friendlinessResult?: FriendlinessScoreResult;
  className?: string;
}

export default function FriendlinessBadge({
  repository,
  theme = "dark",
  friendlinessResult,
  className = "",
}: FriendlinessBadgeProps) {
  const isDark = theme === "dark";

  // Check cache synchronously to avoid layout shifts and unnecessary re-renders
  const cached = React.useMemo(() => {
    if (friendlinessResult) return friendlinessResult;
    return getCachedFriendlinessScore(repository);
  }, [repository, friendlinessResult]);

  const [result, setResult] = useState<FriendlinessScoreResult>(() => {
    return cached || calculateFriendlinessScore(repository, null);
  });

  useEffect(() => {
    if (friendlinessResult) {
      setResult(friendlinessResult);
      return;
    }
    if (cached) {
      setResult(cached);
      return;
    }

    let isMounted = true;
    getRepoFriendliness(repository).then((res) => {
      if (isMounted) {
        setResult(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [repository, friendlinessResult, cached]);

  const { score, tier, breakdown, summary } = result;

  const getBadgeStyle = (currentTier: FriendlinessTier) => {
    switch (currentTier) {
      case "Very Welcoming":
        return isDark
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
      case "Welcoming":
        return isDark
          ? "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
          : "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100";
      case "Moderate":
        return isDark
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100";
      case "Challenging":
      default:
        return isDark
          ? "border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-slate-800"
          : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200";
    }
  };

  const getTierIcon = (currentTier: FriendlinessTier) => {
    switch (currentTier) {
      case "Very Welcoming":
        return "💚";
      case "Welcoming":
        return "🌱";
      case "Moderate":
        return "⚖️";
      case "Challenging":
      default:
        return "⚠️";
    }
  };

  return (
    <span
      className={`group relative inline-flex items-center gap-1 ${className}`}
      data-testid="friendliness-badge-container"
    >
      <button
        type="button"
        tabIndex={0}
        aria-label={`Repository Friendliness: ${score} out of 100 (${tier}). View breakdown.`}
        data-testid="friendliness-badge"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 ${getBadgeStyle(
          tier
        )}`}
      >
        <span aria-hidden="true" className="text-xs">
          {getTierIcon(tier)}
        </span>
        <span>
          {score} {tier}
        </span>
      </button>

      {/* Accessible Interactive Popover / Tooltip with Breakdown */}
      <div
        role="tooltip"
        data-testid="friendliness-breakdown"
        className={`pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 origin-bottom-left scale-95 rounded-xl border p-3.5 shadow-xl transition-all duration-150 group-hover:pointer-events-auto group-hover:scale-100 group-focus-within:pointer-events-auto group-focus-within:scale-100 ${
          isDark
            ? "border-white/10 bg-[#161b26] text-white shadow-black/60"
            : "border-gray-200 bg-white text-gray-900 shadow-gray-400/30"
        } opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        <div className="flex items-center justify-between border-b pb-2 mb-2.5 border-white/10">
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-purple-400">
              Friendliness Score
            </div>
            <div className="text-xs font-bold text-gray-300">Community Health</div>
          </div>
          <div className="text-right">
            <span className="text-sm font-extrabold text-purple-400">{score}</span>
            <span className="text-[10px] text-gray-400"> / 100</span>
          </div>
        </div>

        {/* Signals Breakdown List */}
        <div className="space-y-2 text-[11px]">
          {breakdown.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-1.5"
              data-testid={`signal-${item.id}`}
            >
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="mt-0.5" aria-hidden="true">
                  {item.passed ? "✅" : "❌"}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold leading-tight truncate">{item.label}</div>
                  <div
                    className={`text-[10px] leading-tight ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {item.valueDescription}
                  </div>
                </div>
              </div>
              <div className="font-mono text-[10px] whitespace-nowrap text-right">
                <span
                  className={item.points > 0 ? "text-emerald-400 font-semibold" : "text-gray-500"}
                >
                  +{item.points}
                </span>
                <span className="text-gray-500">/{item.maxPoints}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div
          className={`mt-3 pt-2 text-[10px] leading-relaxed border-t ${
            isDark ? "border-white/10 text-gray-300" : "border-gray-100 text-gray-600"
          }`}
        >
          {summary}
        </div>
      </div>
    </span>
  );
}
