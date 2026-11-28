"use client";

import React, { useState } from "react";

export interface FriendlinessCheckItem {
  id: string;
  label: string;
  passed: boolean;
  explanation: string;
}

export interface FriendlinessResult {
  repository: string;
  exists: boolean;
  is_accessible: boolean;
  is_archived?: boolean;
  is_private?: boolean;
  description?: string;
  stars?: number;
  primary_language?: string;
  median_response_hours?: number;
  good_first_issues_count?: number;
  passed_checks_count?: number;
  total_checks_count?: number;
  message?: string;
  checks?: FriendlinessCheckItem[];
}

export interface ContributorFriendlinessProps {
  theme?: "dark" | "light";
  initialRepo?: string;
  onAnalyze?: (repoUrl: string) => Promise<FriendlinessResult | null>;
  className?: string;
}

/**
 * ContributorFriendlinessChecklist Component (Issue #270)
 *
 * Evaluates repository welcomingness for newcomers:
 * - Contributing guide, Code of conduct, License
 * - Recent commits, open good-first-issues, response time
 * - Shows clear structured checklist with explanations instead of a single arbitrary score
 */
export const ContributorFriendlinessChecklist: React.FC<ContributorFriendlinessProps> = ({
  theme = "dark",
  initialRepo = "",
  onAnalyze,
  className = "",
}) => {
  const [repoInput, setRepoInput] = useState(initialRepo);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FriendlinessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === "dark";

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (onAnalyze) {
        const res = await onAnalyze(repoInput.trim());
        setResult(res);
      } else {
        const response = await fetch(
          `/api/v1/repositories/friendliness?repo=${encodeURIComponent(repoInput.trim())}`
        );
        if (!response.ok) {
          throw new Error(`Evaluation failed with status ${response.status}`);
        }
        const data = await response.json();
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Repository Contributor-Friendliness Checklist"
      className={`rounded-2xl border p-6 transition-all ${
        isDark
          ? "border-slate-800 bg-slate-900/60 text-slate-100"
          : "border-slate-200 bg-white text-slate-800 shadow-sm"
      } ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold tracking-tight">Contributor-Friendliness Check</h3>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Paste any open-source repository to verify whether it welcomes new contributors.
        </p>
      </div>

      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3 mb-6">
        <label htmlFor="repo-url-input" className="sr-only">
          Repository URL or Slug
        </label>
        <input
          id="repo-url-input"
          type="text"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          placeholder="e.g. facebook/react or github.com/owner/repo"
          data-testid="repo-url-input"
          className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
            isDark
              ? "bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
              : "bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400"
          }`}
        />
        <button
          type="submit"
          disabled={loading || !repoInput.trim()}
          data-testid="repo-check-submit-btn"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110 disabled:opacity-50 transition-all"
        >
          {loading ? "Checking..." : "Inspect Repository"}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="p-4 mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs sm:text-sm"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4" data-testid="friendliness-results-container">
          {!result.is_accessible ? (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
              {result.message || "Repository is inaccessible, private, or does not exist."}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-800/40">
                <div>
                  <h4 className="font-semibold text-base">{result.repository}</h4>
                  {result.description && (
                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {result.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-400">
                    {result.passed_checks_count} of {result.total_checks_count}
                  </span>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Welcoming Signals
                  </div>
                </div>
              </div>

              {/* Checklist Elements */}
              <div className="space-y-2.5">
                {result.checks?.map((check) => (
                  <div
                    key={check.id}
                    data-testid={`friendliness-check-${check.id}`}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                      check.passed
                        ? isDark
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-emerald-200 bg-emerald-50/50"
                        : isDark
                          ? "border-slate-800 bg-slate-950/40"
                          : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {check.passed ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-700/30 text-slate-400 flex items-center justify-center font-bold text-xs">
                          ✕
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold">{check.label}</h5>
                      <p
                        className={`text-xs mt-0.5 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {check.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ContributorFriendlinessChecklist;
