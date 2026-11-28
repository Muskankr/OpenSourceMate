"use client";

import React, { useEffect, useState } from "react";
import {
  getCachedResponsiveness,
  getRepoResponsiveness,
  determineResponsiveness,
  type ResponsivenessRating,
  type ResponsivenessResult,
} from "../utils/repoResponsiveness";

export interface ResponsivenessBadgeProps {
  repository: string;
  theme?: "dark" | "light";
  responsiveness?: ResponsivenessRating;
  tooltipText?: string;
  className?: string;
}

export default function ResponsivenessBadge({
  repository,
  theme = "dark",
  responsiveness,
  tooltipText,
  className = "",
}: ResponsivenessBadgeProps) {
  const isDark = theme === "dark";

  // Check synchronous cache first to avoid layout shifts
  const initialResult = React.useMemo(() => {
    if (responsiveness) {
      return null;
    }
    return getCachedResponsiveness(repository);
  }, [repository, responsiveness]);

  const [result, setResult] = useState<ResponsivenessResult | null>(initialResult);

  useEffect(() => {
    if (responsiveness) return;
    if (initialResult) return;

    let isMounted = true;
    getRepoResponsiveness(repository).then((res) => {
      if (isMounted) {
        setResult(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [repository, responsiveness, initialResult]);

  const activeRating: ResponsivenessRating = responsiveness || result?.rating || "Not enough data";

  const activeTooltip: string =
    tooltipText ||
    result?.tooltipText ||
    determineResponsiveness({ repository, sampleCount: 0, medianResponseHours: null }).tooltipText;

  const getBadgeStyle = (rating: ResponsivenessRating) => {
    switch (rating) {
      case "Fast":
        return isDark
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-emerald-300 bg-emerald-50 text-emerald-800";
      case "Moderate":
        return isDark
          ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
          : "border-blue-300 bg-blue-50 text-blue-800";
      case "Slow":
        return isDark
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-amber-300 bg-amber-50 text-amber-800";
      case "Not enough data":
      default:
        return isDark
          ? "border-slate-700 bg-slate-800/80 text-slate-400"
          : "border-gray-300 bg-gray-100 text-gray-600";
    }
  };

  const getIcon = (rating: ResponsivenessRating) => {
    switch (rating) {
      case "Fast":
        return "⚡";
      case "Moderate":
        return "⏱";
      case "Slow":
        return "⏳";
      case "Not enough data":
      default:
        return "❔";
    }
  };

  return (
    <span
      className={`group relative inline-flex items-center gap-1 ${className}`}
      data-testid="responsiveness-container"
    >
      <span
        data-testid="responsiveness-badge"
        title={activeTooltip}
        tabIndex={0}
        aria-label={`Maintainer responsiveness: ${activeRating}. ${activeTooltip}`}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border transition-all cursor-help focus:outline-none focus:ring-1 focus:ring-purple-400 ${getBadgeStyle(
          activeRating
        )}`}
      >
        <span aria-hidden="true" className="text-[11px] leading-none">
          {getIcon(activeRating)}
        </span>
        <span>{activeRating}</span>
      </span>

      {/* Hover/Focus Tooltip explaining the rule */}
      <span
        role="tooltip"
        data-testid="responsiveness-tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-56 rounded-xl border border-slate-700 bg-slate-900/95 p-2 text-center text-[11px] font-normal leading-tight text-slate-200 shadow-xl backdrop-blur-md group-hover:block group-focus-within:block z-50 animate-in fade-in zoom-in-95 duration-100"
      >
        <span className="font-semibold text-purple-300 block mb-0.5">
          Maintainer Responsiveness
        </span>
        {activeTooltip}
      </span>
    </span>
  );
}
