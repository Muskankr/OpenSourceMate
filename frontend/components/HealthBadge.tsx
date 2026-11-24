"use client";

import React, { useEffect, useState } from "react";
import {
  getCachedHealth,
  getRepoHealth,
  determineHealthStatus,
  type HealthStatus,
  type RepositoryHealthResult,
} from "../utils/repoHealth";

export interface HealthBadgeProps {
  repository: string;
  theme?: "dark" | "light";
  healthResult?: RepositoryHealthResult;
  status?: HealthStatus;
  tooltipText?: string;
  className?: string;
}

export default function HealthBadge({
  repository,
  theme = "dark",
  healthResult,
  status,
  tooltipText,
  className = "",
}: HealthBadgeProps) {
  const isDark = theme === "dark";

  // Check cache synchronously to avoid layout shifts
  const initialResult = React.useMemo(() => {
    if (healthResult) return healthResult;
    return getCachedHealth(repository);
  }, [repository, healthResult]);

  const [result, setResult] = useState<RepositoryHealthResult | null>(initialResult);

  useEffect(() => {
    if (healthResult) {
      setResult(healthResult);
      return;
    }
    if (status) return;
    if (initialResult) return;

    let isMounted = true;
    getRepoHealth(repository).then((res) => {
      if (isMounted) {
        setResult(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [repository, healthResult, status, initialResult]);

  const activeStatus: HealthStatus = status || result?.status || "Unknown";

  const activeTooltip: string =
    tooltipText ||
    result?.tooltipText ||
    determineHealthStatus({ repository, sampleCount: 0, daysSinceLastCommit: null }).tooltipText;

  const getBadgeStyle = (curStatus: HealthStatus) => {
    switch (curStatus) {
      case "Active":
        return isDark
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-emerald-300 bg-emerald-50 text-emerald-800";
      case "Slow":
        return isDark
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-amber-300 bg-amber-50 text-amber-800";
      case "Inactive":
        return isDark
          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
          : "border-rose-300 bg-rose-50 text-rose-800";
      case "Unknown":
      default:
        return isDark
          ? "border-slate-700 bg-slate-800/80 text-slate-400"
          : "border-gray-300 bg-gray-100 text-gray-600";
    }
  };

  const getIcon = (curStatus: HealthStatus) => {
    switch (curStatus) {
      case "Active":
        return "🟢";
      case "Slow":
        return "🟡";
      case "Inactive":
        return "🔴";
      case "Unknown":
      default:
        return "⚪";
    }
  };

  return (
    <span
      className={`group relative inline-flex items-center gap-1 ${className}`}
      data-testid="health-badge-container"
    >
      <span
        data-testid="health-badge"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-help ${getBadgeStyle(
          activeStatus
        )}`}
        title={activeTooltip}
        aria-label={`Repository Health: ${activeStatus}. ${activeTooltip}`}
      >
        <span className="text-[10px]" aria-hidden="true">
          {getIcon(activeStatus)}
        </span>
        <span>{activeStatus}</span>
      </span>

      {/* Accessible Interactive Tooltip */}
      <div
        data-testid="health-tooltip"
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-normal rounded-lg border px-2.5 py-1.5 text-xs shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 w-64 ${
          isDark
            ? "border-white/10 bg-slate-900/95 text-slate-200 shadow-black/40 backdrop-blur-sm"
            : "border-gray-200 bg-white text-gray-800 shadow-md"
        }`}
      >
        <div className="font-semibold mb-0.5 flex items-center gap-1">
          <span>{getIcon(activeStatus)}</span>
          <span>Repository Health: {activeStatus}</span>
        </div>
        <p className="text-[11px] leading-relaxed opacity-90">{activeTooltip}</p>
      </div>
    </span>
  );
}
