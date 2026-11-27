"use client";

import React, { useState } from "react";
import { formatFetchedAt, formatRelativeTime } from "../utils/offlineStorage";

export interface OfflineBannerProps {
  isOnline: boolean;
  isViewingCached?: boolean;
  cachedUsername?: string;
  cachedFetchedAt?: string;
  onRefresh?: () => void;
  onRetryConnection?: () => void;
}

export default function OfflineBanner({
  isOnline,
  isViewingCached = false,
  cachedUsername,
  cachedFetchedAt,
  onRefresh,
  onRetryConnection,
}: OfflineBannerProps) {
  const [checking, setChecking] = useState(false);

  // If online and not viewing cached results, no banner needed
  if (isOnline && !isViewingCached) {
    return null;
  }

  const handleRetry = async () => {
    setChecking(true);
    if (onRetryConnection) {
      onRetryConnection();
    }
    // Give brief visual feedback
    setTimeout(() => {
      setChecking(false);
    }, 800);
  };

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="offline-banner"
        className="w-full bg-amber-500/15 dark:bg-amber-950/40 border-b border-amber-500/30 dark:border-amber-700/50 px-4 py-3 text-amber-900 dark:text-amber-200 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            {/* Offline signal icon */}
            <svg
              className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 0a5 5 0 01-.707-.707m-2.122 2.122a9 9 0 010-12.728M3 3l18 18"
              />
            </svg>
            <div>
              <span className="font-semibold">You are currently offline.</span>{" "}
              {isViewingCached && cachedFetchedAt ? (
                <span>
                  Viewing cached results
                  {cachedUsername ? ` for @${cachedUsername}` : ""} from{" "}
                  <time
                    dateTime={cachedFetchedAt}
                    className="font-medium underline decoration-amber-500/40"
                  >
                    {formatFetchedAt(cachedFetchedAt)}
                  </time>{" "}
                  ({formatRelativeTime(cachedFetchedAt)}).
                </span>
              ) : (
                <span>
                  Connect to the internet to analyze GitHub profiles and discover new
                  recommendations.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={handleRetry}
              disabled={checking}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-amber-600/10 hover:bg-amber-600/20 text-amber-900 dark:text-amber-200 border border-amber-600/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {checking ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Checking...</span>
                </>
              ) : (
                <span>Retry Connection</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is online, but currently viewing a saved cached result
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="cached-notice-banner"
      className="w-full bg-sky-500/15 dark:bg-sky-950/40 border-b border-sky-500/30 dark:border-sky-700/50 px-4 py-2.5 text-sky-900 dark:text-sky-200 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <svg
            className="w-5 h-5 flex-shrink-0 text-sky-600 dark:text-sky-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span className="font-semibold">Back Online!</span>{" "}
            {cachedFetchedAt && (
              <span>
                Displaying cached results
                {cachedUsername ? ` for @${cachedUsername}` : ""} fetched on{" "}
                <time
                  dateTime={cachedFetchedAt}
                  className="font-medium underline decoration-sky-500/40"
                >
                  {formatFetchedAt(cachedFetchedAt)}
                </time>{" "}
                ({formatRelativeTime(cachedFetchedAt)}).
              </span>
            )}
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-sky-600/10 hover:bg-sky-600/20 text-sky-900 dark:text-sky-200 border border-sky-600/30 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <svg
              className="w-3.5 h-3.5"
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
            <span>Refresh Live Data</span>
          </button>
        )}
      </div>
    </div>
  );
}
