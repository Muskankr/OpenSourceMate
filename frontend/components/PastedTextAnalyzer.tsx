"use client";

import React, { useState } from "react";

export interface ExtractedSkill {
  skill: string;
  occurrences: number;
  confidence: number;
  category: string;
}

export interface PastedTextAnalysisResult {
  skills: ExtractedSkill[];
  total_extracted: number;
  character_count: number;
  categories: Record<string, number>;
}

export interface PastedTextAnalyzerProps {
  onSkillsExtracted?: (skills: ExtractedSkill[]) => void;
  apiEndpoint?: string;
  className?: string;
}

/**
 * PastedTextAnalyzer Component
 *
 * Allows users to paste a resume snippet, LinkedIn bio, or project description
 * to discover relevant open-source issues without requiring GitHub public history.
 *
 * Privacy Promise:
 * - Text is evaluated strictly in memory.
 * - No text is saved to persistent storage or logged.
 */
export default function PastedTextAnalyzer({
  onSkillsExtracted,
  apiEndpoint = "/api/v1/skills/analyze-text",
  className = "",
}: PastedTextAnalyzerProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PastedTextAnalysisResult | null>(null);

  const characterCount = text.length;
  const maxCharacters = 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 5) {
      setError("Please paste at least 5 characters of resume or bio text.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Analysis failed (${response.status})`);
      }

      const data: PastedTextAnalysisResult = await response.json();
      setResult(data);
      if (onSkillsExtracted) {
        onSkillsExtracted(data.skills);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze skills. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError(null);
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>📝</span> Paste Resume, Bio, or Project Description
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze your skills directly from text without needing a public GitHub profile.
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          🔒 Private & Ephemeral
        </span>
      </div>

      {/* Privacy Notice Disclaimer */}
      <div
        role="note"
        aria-label="Privacy disclaimer"
        className="mb-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60"
      >
        <strong>Privacy Assurance:</strong> Your pasted text is processed in-memory solely to detect skills. It is never stored on disk, written to a database, or shared.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your resume summary, tech stack, LinkedIn bio, or project description here (e.g. Experienced in TypeScript, React, Next.js, and Python backend microservices)..."
            rows={5}
            maxLength={maxCharacters}
            aria-label="Pasted resume or bio text input"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-y"
          />
          <div className="flex justify-between items-center text-xs text-slate-400 mt-1.5 px-1">
            <span>Minimum 5 characters</span>
            <span className={characterCount > maxCharacters * 0.9 ? "text-amber-500 font-medium" : ""}>
              {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} characters
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900"
          >
            {error}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-primary-600 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
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
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Extracting Skills...
              </>
            ) : (
              "Extract Skills from Text"
            )}
          </button>
          {text && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Extracted Skills Presentation */}
      {result && (
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Extracted Skills ({result.total_extracted})
            </h4>
            <span className="text-xs text-slate-400">
              Evaluated {result.character_count} characters
            </span>
          </div>

          {result.skills.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No matching technical skills detected in the provided text. Try including specific technologies, languages, or frameworks.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.skills.map((item) => (
                <span
                  key={item.skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                >
                  <span className="font-semibold">{item.skill}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary-200/60 dark:bg-primary-800/60 text-primary-800 dark:text-primary-200">
                    {item.confidence}%
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
