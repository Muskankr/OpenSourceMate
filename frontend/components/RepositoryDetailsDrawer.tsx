"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { RepositoryDetails } from "../types/api";
import { ApiClientError, fetchRepositoryDetails, isAbortError } from "../utils/apiClient";

export interface RepositoryDetailsDrawerProps {
  repository: string | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
  triggerElement?: HTMLElement | null;
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat("en-US").format(val);
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "Unknown";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RepositoryDetailsDrawer({
  repository,
  isOpen,
  onClose,
  theme = "dark",
  triggerElement = null,
}: RepositoryDetailsDrawerProps) {
  const isDark = theme === "dark";
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const savedTriggerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef<boolean>(false);

  const [details, setDetails] = useState<RepositoryDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState<number>(0);

  // Track trigger element and restore focus when drawer closes
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      savedTriggerRef.current =
        triggerElement || (document.activeElement as HTMLElement | null);
      wasOpenRef.current = true;
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      document.body.style.overflow = "";
      const target = triggerElement || savedTriggerRef.current;
      if (target && typeof target.focus === "function") {
        target.focus();
      }
      savedTriggerRef.current = null;
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, triggerElement]);

  // Lazy load repository details ONLY when the drawer is open
  useEffect(() => {
    if (!isOpen || !repository) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setLoading(true);
    setError(null);
    setDetails(null);

    fetchRepositoryDetails(repository, { signal: controller.signal })
      .then((data) => {
        if (!isActive) return;
        setDetails(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isActive || isAbortError(err)) return;
        if (err instanceof ApiClientError) {
          if (err.status === 429 && err.resetAt) {
            setError(`${err.message} (Resets at ${err.resetAt})`);
          } else {
            setError(err.message || "Failed to load repository details.");
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load repository details.");
        }
        setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [isOpen, repository, retryToken]);

  const handleRetry = useCallback(() => {
    setRetryToken((prev) => prev + 1);
  }, []);

  // Keyboard accessibility: close on Escape and trap Tab focus inside the drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !repository) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repo-drawer-title"
    >
      {/* Dimmed backdrop */}
      <div
        data-testid="repo-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={drawerRef}
          data-testid="repo-details-drawer"
          className={`flex w-screen max-w-lg flex-col shadow-2xl ${
            isDark
              ? "border-l border-white/10 bg-slate-900 text-gray-100"
              : "border-l border-gray-200 bg-white text-gray-900"
          }`}
        >
          {/* Header */}
          <header
            className={`flex items-start justify-between gap-4 border-b p-6 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Repository Details
              </p>
              <h2
                id="repo-drawer-title"
                className="mt-1 truncate text-lg font-bold sm:text-xl"
              >
                {repository}
              </h2>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              data-testid="close-repo-drawer-button"
              aria-label="Close repository details drawer"
              className={`rounded-xl border p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                isDark
                  ? "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Loading Skeleton */}
            {loading && (
              <div
                data-testid="repo-drawer-loading"
                role="status"
                aria-label="Loading repository details"
                className="space-y-4 animate-pulse"
              >
                <div className={`h-4 w-3/4 rounded ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
                <div className={`h-4 w-1/2 rounded ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className={`h-16 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
                  <div className={`h-16 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
                  <div className={`h-16 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
                </div>
                <div className={`h-24 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
              </div>
            )}

            {/* Error State with Retry Button */}
            {!loading && error && (
              <div
                data-testid="repo-drawer-error"
                role="alert"
                className={`rounded-2xl border p-5 text-sm ${
                  isDark
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <p className="font-semibold">Unable to load repository details</p>
                <p className="mt-1 text-xs opacity-90">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  data-testid="retry-repo-details-button"
                  className={`mt-4 rounded-xl border px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    isDark
                      ? "border-red-400/40 bg-red-500/20 text-white hover:bg-red-500/30"
                      : "border-red-300 bg-white text-red-700 hover:bg-red-100"
                  }`}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loaded Repository Details */}
            {!loading && !error && details && (
              <>
                {/* Description */}
                <div>
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Description
                  </h3>
                  <p
                    data-testid="repo-description"
                    className={`mt-2 text-sm leading-relaxed ${
                      isDark ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {details.description || "No description provided."}
                  </p>
                </div>

                {/* Key Metrics Grid: Stars, Open Issues, Last Commit */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <span className="text-xs text-gray-400">Stars</span>
                    <p
                      data-testid="repo-stars"
                      className="mt-1 text-lg font-bold"
                    >
                      ★ {formatNumber(details.stars)}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <span className="text-xs text-gray-400">Open Issues</span>
                    <p
                      data-testid="repo-open-issues"
                      className="mt-1 text-lg font-bold"
                    >
                      {formatNumber(details.open_issues_count)}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <span className="text-xs text-gray-400">Last Commit</span>
                    <p
                      data-testid="repo-last-commit"
                      className="mt-1 text-sm font-semibold"
                    >
                      {formatDate(details.last_commit_date)}
                    </p>
                  </div>
                </div>

                {/* Main Languages */}
                <div>
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Main Languages
                  </h3>
                  {details.languages.length > 0 ? (
                    <div
                      data-testid="repo-languages"
                      className="mt-2.5 flex flex-wrap gap-2"
                    >
                      {(details.language_breakdown && details.language_breakdown.length > 0
                        ? details.language_breakdown
                        : details.languages.map((name) => ({ name, percentage: null }))
                      ).map((lang) => (
                        <span
                          key={lang.name}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                            isDark
                              ? "border-purple-500/30 bg-purple-500/10 text-purple-200"
                              : "border-purple-200 bg-purple-50 text-purple-800"
                          }`}
                        >
                          <span>{lang.name}</span>
                          {lang.percentage !== null && (
                            <span className="opacity-75">{lang.percentage}%</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">No language metadata available.</p>
                  )}
                </div>

                {/* Contributing Guide Link (only when present) */}
                {details.contributing_url && (
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            isDark ? "text-emerald-300" : "text-emerald-800"
                          }`}
                        >
                          Contributor Guidelines Available
                        </p>
                        <p
                          className={`mt-0.5 text-xs ${
                            isDark ? "text-emerald-200/80" : "text-emerald-700"
                          }`}
                        >
                          Review setup and PR expectations before starting.
                        </p>
                      </div>
                      <a
                        href={details.contributing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="repo-contributing-link"
                        className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                          isDark
                            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        CONTRIBUTING ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* License & Topics */}
                {(details.license || (details.topics && details.topics.length > 0)) && (
                  <div className="space-y-3 pt-1">
                    {details.license && (
                      <p className="text-xs text-gray-400">
                        License: <span className="font-semibold text-gray-200">{details.license}</span>
                      </p>
                    )}
                    {details.topics && details.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {details.topics.slice(0, 8).map((topic) => (
                          <span
                            key={topic}
                            className={`rounded-md border px-2 py-0.5 text-[11px] ${
                              isDark
                                ? "border-white/10 bg-white/5 text-gray-300"
                                : "border-gray-200 bg-gray-100 text-gray-700"
                            }`}
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <footer
            className={`flex items-center justify-between gap-4 border-t p-6 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <span className="text-xs text-gray-500">
              Press <kbd className="rounded border px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl border px-4 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Close
              </button>

              <a
                href={details?.url || `https://github.com/${repository}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="repo-github-link"
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                Open Repository ↗
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
