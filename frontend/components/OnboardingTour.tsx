"use client";

import React, { useEffect, useRef } from "react";

export const ONBOARDING_TOUR_STORAGE_KEY = "opensourcemate_onboarding_tour_done";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId?: string;
}

export const ONBOARDING_TOUR_STEPS: TourStep[] = [
  {
    id: "enter-username",
    title: "1. Enter a GitHub username",
    description:
      "Type any public GitHub username in the analyzer box—or pick a sample profile—to inspect repositories and contribution readiness.",
    targetId: "github-username-input",
  },
  {
    id: "read-skills",
    title: "2. Read your detected skills",
    description:
      "Review your Technical Profile to see top languages, frameworks, proficiency levels, and skills you may want to learn next.",
    targetId: "analyzer",
  },
  {
    id: "browse-issues",
    title: "3. Browse matched issues",
    description:
      "Explore personalized open-source issue recommendations ranked by match score, language, and beginner-friendliness.",
    targetId: "analyzer",
  },
  {
    id: "open-issue",
    title: "4. Open an issue & start contributing",
    description:
      "Select any recommended issue to inspect its details on GitHub, check repository health, and make your first pull request.",
    targetId: "analyzer",
  },
];

export interface OnboardingTourProps {
  isOpen: boolean;
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
  onSkip: () => void;
  onComplete: () => void;
  theme?: "dark" | "light";
  steps?: TourStep[];
}

export default function OnboardingTour({
  isOpen,
  currentStep,
  onStepChange,
  onSkip,
  onComplete,
  theme = "dark",
  steps = ONBOARDING_TOUR_STEPS,
}: OnboardingTourProps) {
  const isDark = theme === "dark";
  const dialogRef = useRef<HTMLDivElement>(null);

  const safeStepIndex = Math.max(0, Math.min(currentStep, steps.length - 1));
  const step = steps[safeStepIndex];
  const isFirstStep = safeStepIndex === 0;
  const isLastStep = safeStepIndex === steps.length - 1;

  // Scroll target section into view when step changes (gracefully no-ops in JSDOM)
  useEffect(() => {
    if (!isOpen || !step?.targetId) return;
    const targetEl = document.getElementById(step.targetId);
    if (targetEl && typeof targetEl.scrollIntoView === "function") {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isOpen, step?.targetId]);

  // Close/skip on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onSkip]);

  if (!isOpen || !step) return null;

  return (
    <aside
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="onboarding-tour-title"
      aria-describedby="onboarding-tour-description"
      data-testid="onboarding-tour"
      className={`fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border p-4 shadow-2xl transition-all sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96 sm:p-5 ${
        isDark
          ? "border-purple-500/40 bg-slate-900/95 text-gray-100 backdrop-blur-xl shadow-purple-950/40"
          : "border-purple-300 bg-white/95 text-gray-900 backdrop-blur-xl shadow-xl"
      }`}
    >
      {/* Top Bar: Step Progress + Skip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            data-testid="tour-step-indicator"
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              isDark
                ? "bg-purple-500/20 text-purple-300"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            Step {safeStepIndex + 1} of {steps.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          data-testid="tour-skip-button"
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
            isDark
              ? "text-gray-400 hover:bg-white/10 hover:text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          Skip
        </button>
      </div>

      {/* Step Content */}
      <div className="mt-3">
        <h3
          id="onboarding-tour-title"
          className="text-sm font-bold leading-snug sm:text-base"
        >
          {step.title}
        </h3>
        <p
          id="onboarding-tour-description"
          className={`mt-1.5 text-xs leading-relaxed sm:text-sm ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {step.description}
        </p>
      </div>

      {/* Step Dots */}
      <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
        {steps.map((s, idx) => (
          <span
            key={s.id}
            className={`h-1.5 rounded-full transition-all ${
              idx === safeStepIndex
                ? "w-6 bg-purple-500"
                : idx < safeStepIndex
                  ? "w-2 bg-purple-400/60"
                  : isDark
                    ? "w-2 bg-white/15"
                    : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Navigation Buttons (touch-friendly for mobile) */}
      <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
        <button
          type="button"
          disabled={isFirstStep}
          onClick={() => onStepChange(safeStepIndex - 1)}
          data-testid="tour-back-button"
          className={`min-h-[36px] rounded-xl border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:cursor-not-allowed disabled:opacity-40 ${
            isDark
              ? "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
              : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={onComplete}
            data-testid="tour-finish-button"
            className="min-h-[36px] rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            Finish tour
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStepChange(safeStepIndex + 1)}
            data-testid="tour-next-button"
            className="min-h-[36px] rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            Next
          </button>
        )}
      </div>
    </aside>
  );
}
