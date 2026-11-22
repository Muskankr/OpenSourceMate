"use client";

import React, { useEffect, useRef, useState } from "react";
import type { IssueRecommendation } from "../types/api";
import { inferIssueDifficulty, type IssueDifficulty } from "../data/mockIssues";
import { SafeMarkdown, truncateMarkdown } from "../utils/markdownSanitizer";
import ResponsivenessBadge from "./ResponsivenessBadge";
import FriendlinessBadge from "./FriendlinessBadge";

export interface IssueDetailDrawerProps {
  issue: IssueRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
  maxBodyLength?: number;
}

export default function IssueDetailDrawer({
  issue,
  isOpen,
  onClose,
  theme = "dark",
  maxBodyLength = 1000,
}: IssueDetailDrawerProps) {
  const isDark = theme === "dark";
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Reset expanded state whenever a different issue is opened
  useEffect(() => {
    if (isOpen) {
      setIsExpanded(false);
    }
  }, [isOpen, issue?.id]);

  // Handle focus trapping and restoration
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      // Focus close button on mount
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
        triggerElementRef.current = null;
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle keyboard events (Escape and Tab focus cycle)
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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !issue) return null;

  const score = Math.round(issue.match_score ?? issue.score ?? 0);
  const difficulty: IssueDifficulty = issue.difficulty || inferIssueDifficulty(issue.labels);
  const reasons = issue.match_reasons ?? issue.reasons ?? [];

  const rawBody = issue.body || "";
  const { truncatedText, isTruncated } = truncateMarkdown(rawBody, maxBodyLength);
  const displayedBody = isExpanded || !isTruncated ? rawBody : truncatedText;

  const isGoodFirst = issue.labels?.some((l) => l.toLowerCase().includes("good first"));
  const isHelpWanted = issue.labels?.some((l) => l.toLowerCase().includes("help wanted"));

  const getDifficultyBadge = (diff: IssueDifficulty) => {
    switch (diff) {
      case "Beginner":
        return isDark
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-800";
      case "Intermediate":
        return isDark
          ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
          : "border-blue-200 bg-blue-50 text-blue-800";
      case "Advanced":
        return isDark
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-amber-200 bg-amber-50 text-amber-800";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-detail-title"
      aria-describedby="issue-detail-repo"
    >
      {/* Dimmed backdrop */}
      <div
        data-testid="issue-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer slide-over container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={drawerRef}
          data-testid="issue-detail-drawer"
          className={`flex w-screen max-w-2xl flex-col shadow-2xl transition-transform animate-in slide-in-from-right duration-300 ${
            isDark
              ? "border-l border-white/10 bg-slate-900 text-gray-100"
              : "border-l border-gray-200 bg-white text-gray-900"
          }`}
        >
          {/* Drawer Header */}
          <header
            className={`flex items-start justify-between gap-4 border-b p-6 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <div className="min-w-0 flex-1">
              {/* Repository & State badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  id="issue-detail-repo"
                  className={`font-semibold ${isDark ? "text-purple-400" : "text-purple-600"}`}
                >
                  {issue.repository}
                </span>

                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                    issue.state === "open"
                      ? isDark
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : isDark
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        : "bg-purple-100 text-purple-800 border border-purple-300"
                  }`}
                >
                  {issue.state || "Open"}
                </span>

                {issue.number && (
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                    #{issue.number}
                  </span>
                )}

                <ResponsivenessBadge repository={issue.repository} theme={theme} />
                <FriendlinessBadge repository={issue.repository} theme={theme} />
              </div>

              {/* Title */}
              <h2
                id="issue-detail-title"
                className="mt-2.5 text-lg font-bold leading-snug sm:text-xl"
              >
                {issue.title}
              </h2>
            </div>

            {/* Close Button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              data-testid="close-drawer-button"
              aria-label="Close issue details drawer"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Metadata Bar */}
            <div
              className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-xs ${
                isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-200 bg-gray-50"
              }`}
            >
              {/* Match Score */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-purple-400">Match:</span>
                <span className="font-bold">{score}%</span>
              </div>

              <span className="text-gray-500" aria-hidden="true">•</span>

              {/* Difficulty */}
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${getDifficultyBadge(
                  difficulty
                )}`}
              >
                {difficulty}
              </span>

              {/* Language */}
              {issue.language && (
                <>
                  <span className="text-gray-500" aria-hidden="true">•</span>
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                    {issue.language}
                  </span>
                </>
              )}

              {/* Comments Count */}
              <span className="text-gray-500" aria-hidden="true">•</span>
              <span
                data-testid="issue-comments-count"
                className={`flex items-center gap-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                <span aria-hidden="true">💬</span>
                <span>{issue.comments} {issue.comments === 1 ? "comment" : "comments"}</span>
              </span>

              {/* Author */}
              {issue.author && (
                <>
                  <span className="text-gray-500" aria-hidden="true">•</span>
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                    Opened by @{issue.author}
                  </span>
                </>
              )}
            </div>

            {/* Labels */}
            {issue.labels && issue.labels.length > 0 && (
              <div>
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Labels
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Issue labels">
                  {issue.labels.map((label, idx) => (
                    <span
                      key={idx}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        isGoodFirst && label.toLowerCase().includes("good first")
                          ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : isHelpWanted && label.toLowerCase().includes("help wanted")
                            ? "border border-amber-400/30 bg-amber-400/10 text-amber-300"
                            : isDark
                              ? "border border-white/10 bg-white/5 text-gray-300"
                              : "border border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Why this matches */}
            {(reasons.length > 0 || issue.explanation) && (
              <div
                className={`rounded-2xl border p-4 text-xs ${
                  issue.is_learning_mode
                    ? isDark
                      ? "border-emerald-500/30 bg-emerald-500/5 text-gray-200"
                      : "border-emerald-300 bg-emerald-50 text-gray-800"
                    : isDark
                      ? "border-purple-500/20 bg-purple-500/5 text-gray-200"
                      : "border-purple-200 bg-purple-50 text-gray-800"
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 font-semibold ${
                    issue.is_learning_mode ? "text-emerald-400" : "text-purple-400"
                  }`}
                >
                  <span aria-hidden="true">{issue.is_learning_mode ? "🌱" : "✦"}</span>
                  <span>Recommendation Insight</span>
                </div>
                {issue.explanation && (
                  <p className="mt-1.5 leading-relaxed">{issue.explanation}</p>
                )}
                {reasons.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {reasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-purple-400" aria-hidden="true">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Issue Description / Body Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Issue Description
                </h3>
                {isTruncated && (
                  <span className="text-[11px] text-gray-500">
                    {isExpanded
                      ? `Full length: ${rawBody.length} characters`
                      : `Preview: ${truncatedText.length} of ${rawBody.length} characters`}
                  </span>
                )}
              </div>

              <div
                data-testid="markdown-body-container"
                className={`rounded-2xl border p-5 ${
                  isDark ? "border-white/10 bg-white/[0.015]" : "border-gray-200 bg-gray-50/50"
                }`}
              >
                <SafeMarkdown content={displayedBody} theme={theme} />

                {/* Show more / Show less toggle */}
                {isTruncated && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center">
                    <button
                      type="button"
                      data-testid="toggle-show-more"
                      onClick={() => setIsExpanded((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                        isDark
                          ? "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                          : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      <span>{isExpanded ? "Show less" : "Show more"}</span>
                      <span aria-hidden="true">{isExpanded ? "▲" : "▼"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Footer - Actions */}
          <footer
            className={`flex items-center justify-between gap-4 border-t p-6 ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <div className="text-xs text-gray-500">
              Press <kbd className="rounded border px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close
            </div>

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
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="github-link-external"
                aria-label={`Open issue "${issue.title}" on GitHub in a new tab`}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  isDark
                    ? "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20"
                    : "bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                }`}
              >
                View on GitHub ↗
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
