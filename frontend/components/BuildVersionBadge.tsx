"use client";

import { useMemo } from "react";
import { getBuildVersionInfo } from "../utils/buildVersion";

export interface BuildVersionBadgeProps {
  className?: string;
  theme?: "dark" | "light";
}

/**
 * Renders the active deployment build version (first 7 characters of commit hash)
 * linked directly to the commit on GitHub, or "dev" when running locally.
 */
export function BuildVersionBadge({
  className = "",
  theme = "dark",
}: BuildVersionBadgeProps) {
  const version = useMemo(() => getBuildVersionInfo(), []);
  const isDark = theme === "dark";

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-mono ${
        isDark ? "text-gray-400" : "text-gray-600"
      } ${className}`}
      aria-label={`Build version: ${version.shortSha}`}
    >
      <span className="opacity-70">build:</span>
      {version.isDev || !version.commitUrl ? (
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
            isDark ? "bg-white/10 text-gray-300" : "bg-gray-200 text-gray-700"
          }`}
          title="Local development environment"
        >
          {version.shortSha}
        </span>
      ) : (
        <a
          href={version.commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400 ${
            isDark
              ? "bg-purple-950/40 text-purple-300 hover:bg-purple-900/60"
              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
          }`}
          title={`View commit ${version.commitSha} on GitHub`}
        >
          {version.shortSha} ↗
        </a>
      )}
    </div>
  );
}

export default BuildVersionBadge;
