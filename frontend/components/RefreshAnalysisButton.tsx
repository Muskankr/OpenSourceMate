"use client";

import React, { useEffect, useState } from "react";

export interface RefreshAnalysisButtonProps {
  /**
   * ISO 8601 timestamp string representing when the analysis was generated.
   */
  analyzedAt?: string | null;
  /**
   * Callback invoked when the user clicks the refresh button.
   */
  onRefresh: () => void | Promise<void>;
  /**
   * Whether a refresh or analysis request is currently in progress.
   */
  isLoading?: boolean;
  /**
   * Current color theme.
   */
  theme?: "dark" | "light";
  /**
   * Duration in seconds for client-side rate limit cooldown (default 30 seconds).
   */
  cooldownSeconds?: number;
}

/**
 * Formats an ISO timestamp into a localized string matching the user's browser time zone.
 */
export function formatLocalTimestamp(isoString?: string | null): string {
  if (!isoString) {
    return "Recently";
  }

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Recently";
    }

    // Use Intl.DateTimeFormat for robust cross-browser local time zone representation
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "Recently";
  }
}

export default function RefreshAnalysisButton({
  analyzedAt,
  onRefresh,
  isLoading = false,
  theme = "dark",
  cooldownSeconds = 30,
}: RefreshAnalysisButtonProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Timer effect to decrement cooldown every second
  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const isCooldownActive = secondsRemaining > 0;
  const isDisabled = isLoading || isCooldownActive;

  const handleClick = async () => {
    if (isDisabled) return;

    // Start 30s rate-limit cooldown immediately
    setSecondsRemaining(cooldownSeconds);

    try {
      await onRefresh();
    } catch {
      // Cooldown remains active to protect against rapid failed requests
    }
  };

  const formattedTime = formatLocalTimestamp(analyzedAt);

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-3 rounded-2xl border px-3.5 py-2 text-xs transition-colors ${
        theme === "dark"
          ? "border-white/10 bg-white/[0.03] text-gray-300"
          : "border-gray-200 bg-gray-50/80 text-gray-700"
      }`}
      role="region"
      aria-label="Analysis freshness controls"
    >
      {/* Analyzed At Timestamp */}
      <div className="flex items-center gap-1.5" title={`Analyzed at: ${formattedTime}`}>
        <svg
          className="h-3.5 w-3.5 text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Analyzed at: <strong className="font-semibold text-purple-400">{formattedTime}</strong>
        </span>
      </div>

      <div
        className={`hidden h-3 w-px sm:block ${theme === "dark" ? "bg-white/10" : "bg-gray-300"}`}
        aria-hidden="true"
      />

      {/* Refresh Button with Client-side Rate Limit */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-live="polite"
        title={
          isCooldownActive
            ? `Please wait ${secondsRemaining}s before refreshing again`
            : "Re-run analysis and bypass cached data"
        }
        className={`group relative flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all ${
          isDisabled
            ? "cursor-not-allowed opacity-60"
            : theme === "dark"
              ? "bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 hover:text-purple-200 active:scale-95"
              : "bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95"
        }`}
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${
            isLoading ? "animate-spin" : isCooldownActive ? "" : "group-hover:rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>

        <span>
          {isLoading
            ? "Refreshing..."
            : isCooldownActive
              ? `Refresh (${secondsRemaining}s)`
              : "Refresh analysis"}
        </span>
      </button>
    </div>
  );
}
