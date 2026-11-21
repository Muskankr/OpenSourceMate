"use client";

import React from "react";
import type { IssueRecommendation } from "../types/api";
import { inferIssueDifficulty, type IssueDifficulty } from "../data/mockIssues";
import ResponsivenessBadge from "./ResponsivenessBadge";

export interface IssueCardProps {
  issue: IssueRecommendation;
  theme?: "dark" | "light";
  isMock?: boolean;
  username?: string;
  isHidden?: boolean;
  onHide?: () => void;
  onRestore?: () => void;
}

export default function IssueCard({
  issue,
  theme = "dark",
  isMock = false,
  username = "",
  isHidden = false,
  onHide,
  onRestore,
}: IssueCardProps) {
  const isDark = theme === "dark";

  const isGoodFirst = issue.labels?.some((l) => l.toLowerCase().includes("good first"));
  const isHelpWanted = issue.labels?.some((l) => l.toLowerCase().includes("help wanted"));

  const score = Math.round(issue.match_score ?? issue.score ?? 0);
  const feedbackUrl = `https://github.com/Muskankr/OpenSourceMate/issues/new?${new URLSearchParams({
    template: "wrong_match.yml",
    username: username.trim(),
    issue_url: issue.url,
    match_score: String(score),
  })}`;
  const reasons = issue.match_reasons ?? issue.reasons ?? [];

  // Determine difficulty
  const difficulty: IssueDifficulty = issue.difficulty || inferIssueDifficulty(issue.labels);

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

  const getScoreBadgeStyle = (val: number) => {
    if (val >= 80)
      return isDark
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        : "border-emerald-300 bg-emerald-50 text-emerald-700";
    if (val >= 60)
      return isDark
        ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
        : "border-blue-300 bg-blue-50 text-blue-700";
    return isDark
      ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
      : "border-purple-300 bg-purple-50 text-purple-700";
  };

  const showMockBadge = isMock || issue.is_mock;

  return (
    <article
      aria-label={`${issue.title} in ${issue.repository}`}
      className={`rounded-2xl border p-5 transition-all duration-200 hover:border-purple-500/40 ${
        isDark
          ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.04]"
          : "border-gray-200 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        {/* Main Issue Information */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Repository Name */}
            <span className={`font-semibold ${isDark ? "text-purple-400" : "text-purple-600"}`}>
              {issue.repository}
            </span>

            {/* Responsiveness Signal Label */}
            <ResponsivenessBadge repository={issue.repository} theme={theme} />

            {/* Language */}
            {issue.language && (
              <>
                <span className="text-gray-500" aria-hidden="true">
                  •
                </span>
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>{issue.language}</span>
              </>
            )}

            {/* Comments Count */}
            {issue.comments > 0 && (
              <>
                <span className="text-gray-500" aria-hidden="true">
                  •
                </span>
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {issue.comments} comments
                </span>
              </>
            )}

            {/* Difficulty Badge */}
            <span
              data-testid="difficulty-badge"
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${getDifficultyBadge(
                difficulty
              )}`}
            >
              {difficulty}
            </span>

            {/* Learning Mode Badge */}
            {issue.is_learning_mode && (
              <span
                data-testid="learning-mode-badge"
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
                  isDark
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-emerald-300 bg-emerald-50 text-emerald-800"
                }`}
                title={`Picked for target learning skill: ${issue.learning_skill || issue.language || "Skill"}`}
              >
                🌱 Learning: {issue.learning_skill || issue.language || "Target Skill"}
              </span>
            )}

            {/* Demo / Coming Soon indicator */}
            {showMockBadge && (
              <span
                data-testid="demo-data-badge"
                className={`rounded-md border px-1.5 py-0.2 text-[10px] font-bold tracking-wider uppercase ${
                  isDark
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    : "border-cyan-300 bg-cyan-50 text-cyan-800"
                }`}
                title="This is realistic demo data because matching endpoint is in preview"
              >
                Demo Data
              </span>
            )}
          </div>

          {/* Issue Title Heading with Link */}
          <h4 className="mt-2 text-base font-semibold leading-snug">
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
            >
              {issue.title}
            </a>
          </h4>

          {/* Labels List */}
          {issue.labels && issue.labels.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Issue labels">
              {issue.labels.slice(0, 6).map((label, idx) => (
                <span
                  key={idx}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
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
          )}

          {/* Explanation if present */}
          {issue.explanation && (
            <div
              data-testid="issue-explanation"
              className={`mt-4 rounded-xl border p-3.5 text-xs ${
                issue.is_learning_mode
                  ? isDark
                    ? "border-emerald-500/30 bg-emerald-500/5 text-gray-200"
                    : "border-emerald-300 bg-emerald-50/70 text-gray-800"
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
                <span>
                  {issue.is_learning_mode
                    ? "Why this is recommended for you (Learning Mode)"
                    : "Why this is recommended for you"}
                </span>
                {issue.is_ai_generated && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[9px] uppercase tracking-wider font-bold ${
                      isDark ? "bg-purple-400/20 text-purple-300" : "bg-purple-200 text-purple-800"
                    }`}
                  >
                    AI MATCH
                  </span>
                )}
              </div>
              <p className={`mt-1 leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {issue.explanation}
              </p>
            </div>
          )}

          {/* Match Reasons */}
          {reasons.length > 0 && (
            <div
              className={`mt-4 rounded-xl border p-3 text-xs ${
                isDark
                  ? "border-white/5 bg-white/[0.02] text-gray-300"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              <p className="font-semibold text-purple-400">Why this matches:</p>
              <ul className="mt-1.5 space-y-1">
                {reasons.map((reason, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-purple-400" aria-hidden="true">
                      ✓
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Action / Score Column */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          {/* Match Score Badge */}
          <div
            data-testid="match-score-badge"
            className={`rounded-xl border px-3 py-1.5 text-center text-xs font-semibold ${getScoreBadgeStyle(
              score
            )}`}
          >
            <span className="text-sm font-bold sm:text-base">{score}%</span>
            <span className="block text-[10px] uppercase tracking-wider text-gray-400">Match</span>
          </div>

          {/* Link to GitHub */}
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open issue "${issue.title}" on GitHub in a new tab`}
            className={`rounded-xl border px-4 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
              isDark
                ? "border-white/10 bg-white/5 text-gray-200 hover:bg-white hover:text-black"
                : "border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-900 hover:text-white"
            }`}
          >
            View on GitHub ↗
          </a>
          <a
            href={feedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Report wrong match for "${issue.title}" on GitHub in a new tab`}
            className={`rounded text-xs underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
              isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Wrong match?
          </a>
          {(isHidden ? onRestore : onHide) && (
            <button
              type="button"
              onClick={isHidden ? onRestore : onHide}
              className={`rounded text-xs underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {isHidden ? "Undo" : "Not interested"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
