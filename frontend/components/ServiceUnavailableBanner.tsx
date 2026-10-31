"use client";

import React from "react";
import { GITHUB_ISSUES_URL } from "../utils/errorHandling";

export interface ServiceUnavailableBannerProps {
  /** Optional title override */
  title?: string;
  /** Friendly user-facing explanation message (no stack traces) */
  message?: string;
  /** Optional HTTP status code (e.g. 500, 502, 503) */
  statusCode?: number;
  /** Callback triggered when user clicks the Retry button */
  onRetry?: () => void;
  /** Callback triggered when user dismisses the banner */
  onDismiss?: () => void;
  /** Link to report the issue on GitHub */
  reportUrl?: string;
  /** Current theme: dark or light */
  theme?: "dark" | "light";
  /** Whether a retry action is currently in flight */
  isRetrying?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * ServiceUnavailableBanner
 *
 * Displays a friendly, non-technical notification when the backend cannot be reached
 * or returns 5xx errors. Prompts users with an actionable retry button and an issue
 * reporting link while strictly suppressing raw errors and stack traces (Issue #128).
 */
export default function ServiceUnavailableBanner({
  title = "Service Temporarily Unavailable",
  message = "We couldn't reach the OpenSourceMate backend service. It might be starting up, temporarily down, or undergoing maintenance.",
  statusCode,
  onRetry,
  onDismiss,
  reportUrl = GITHUB_ISSUES_URL,
  theme = "dark",
  isRetrying = false,
  className = "",
}: ServiceUnavailableBannerProps) {
  const isDark = theme === "dark";

  return (
    <aside
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="service-unavailable-banner"
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isDark
          ? "border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-red-950/20 to-amber-950/30 text-amber-100 shadow-[0_4px_20px_rgba(245,158,11,0.08)]"
          : "border-amber-300 bg-amber-50/95 text-amber-950 shadow-sm"
      } ${className}`}
    >
      {/* Decorative ambient glow */}
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${
          isDark ? "bg-amber-500/10" : "bg-amber-300/30"
        }`}
        aria-hidden="true"
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            {/* Server / Cloud Off Alert Icon */}
            <div
              className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
                isDark
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-amber-300 bg-amber-100 text-amber-700"
              }`}
              aria-hidden="true"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Cloud-off / connection disconnected icon */}
                <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0-4 7 5 5 0 0 0 5 5h11" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isDark
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-amber-200 text-amber-800"
                  }`}
                >
                  {statusCode ? `Status ${statusCode}` : "Offline"}
                </span>
                <h3 className="text-base font-bold tracking-tight sm:text-lg">
                  {title}
                </h3>
              </div>

              <p
                className={`max-w-2xl text-sm leading-relaxed ${
                  isDark ? "text-amber-200/90" : "text-amber-900/90"
                }`}
              >
                {message}
              </p>

              <div className="pt-1 text-xs opacity-75">
                Don&apos;t worry — your input was saved and no personal credentials were lost.
              </div>
            </div>
          </div>

          {/* Dismiss button if provided */}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss service unavailable notice"
              className={`self-end rounded-lg p-1.5 transition sm:self-start ${
                isDark
                  ? "text-amber-400/80 hover:bg-white/5 hover:text-amber-200"
                  : "text-amber-700 hover:bg-amber-100 hover:text-amber-900"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Action button bar */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-amber-500/20 pt-4 sm:flex-row">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60 ${
                isDark
                  ? "bg-amber-500 text-black hover:bg-amber-400 active:bg-amber-600"
                  : "bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800"
              }`}
            >
              <svg
                className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span>{isRetrying ? "Retrying..." : "Retry Connection"}</span>
            </button>
          )}

          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isDark
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
                : "border-amber-300 bg-white/70 text-amber-800 hover:bg-white hover:text-amber-950"
            }`}
          >
            <span>Report Problem</span>
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          <span
            className={`text-xs ${
              isDark ? "text-amber-400/70" : "text-amber-800/70"
            }`}
          >
            Backend endpoint: <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-[11px]">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</code>
          </span>
        </div>
      </div>
    </aside>
  );
}
