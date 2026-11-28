"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { IssueRecommendation } from "../types/api";
import {
  buildFirstPrSteps,
  loadChecklistProgress,
  saveChecklistProgress,
} from "../utils/firstPrChecklist";

export interface FirstPrChecklistPanelProps {
  issue: IssueRecommendation;
  theme?: "dark" | "light";
  hasContributing?: boolean;
}

export default function FirstPrChecklistPanel({
  issue,
  theme = "dark",
  hasContributing = true,
}: FirstPrChecklistPanelProps) {
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);

  useEffect(() => {
    setProgress(loadChecklistProgress(issue.repository, issue.id));
  }, [issue.repository, issue.id]);

  const steps = useMemo(
    () =>
      buildFirstPrSteps({
        repository: issue.repository,
        issueUrl: issue.url,
        issueId: issue.id,
        hasContributing,
      }),
    [issue.repository, issue.url, issue.id, hasContributing]
  );

  const completedCount = steps.filter((s) => Boolean(progress[s.id])).length;

  const toggleStep = (stepId: string) => {
    setProgress((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      saveChecklistProgress(issue.repository, issue.id, next);
      return next;
    });
  };

  const handleCopyCommand = async (stepId: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedStepId(stepId);
      setTimeout(() => {
        setCopiedStepId((curr) => (curr === stepId ? null : curr));
      }, 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        data-testid="start-contributing-toggle"
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
          isDark
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        }`}
      >
        <span>Start contributing</span>
        <span className="opacity-80">
          ({completedCount}/{steps.length})
        </span>
        <span aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div
          data-testid="first-pr-checklist-panel"
          className={`mt-3 rounded-xl border p-4 text-xs ${
            isDark
              ? "border-white/10 bg-black/25 text-gray-200"
              : "border-gray-200 bg-gray-50 text-gray-800"
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <p className="font-semibold text-emerald-400">First Pull Request Checklist</p>
            <span data-testid="checklist-progress" className="text-[11px] text-gray-400">
              {completedCount} of {steps.length} completed
            </span>
          </div>

          <ul className="mt-3 space-y-3">
            {steps.map((step) => {
              const checked = Boolean(progress[step.id]);
              return (
                <li key={step.id} data-testid={`checklist-step-${step.id}`} className="space-y-1.5">
                  <div className="flex items-start gap-2.5">
                    <input
                      id={`step-${issue.id}-${step.id}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStep(step.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-400 text-emerald-500 focus:ring-purple-400"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`step-${issue.id}-${step.id}`}
                        className={`font-semibold cursor-pointer ${
                          checked ? "line-through opacity-60" : ""
                        }`}
                      >
                        {step.title}
                      </label>
                      <p className={`mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {step.description}
                      </p>

                      {step.linkUrl && step.linkLabel && (
                        <a
                          href={step.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block font-medium text-purple-400 underline underline-offset-2 hover:text-purple-300"
                        >
                          {step.linkLabel}
                        </a>
                      )}

                      {step.command && (
                        <div
                          className={`mt-2 flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] ${
                            isDark
                              ? "border-white/10 bg-slate-950 text-gray-300"
                              : "border-gray-300 bg-white text-gray-800"
                          }`}
                        >
                          <code className="overflow-x-auto whitespace-nowrap">{step.command}</code>
                          <button
                            type="button"
                            onClick={() => handleCopyCommand(step.id, step.command!)}
                            data-testid={`copy-cmd-${step.id}`}
                            className="shrink-0 rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300 hover:bg-purple-500/20"
                          >
                            {copiedStepId === step.id ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
