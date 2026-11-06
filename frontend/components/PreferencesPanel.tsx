"use client";

import { useState, useEffect, useId, useCallback } from "react";
import {
  type UserPreferences,
  type ContributionGoal,
  type PreferredDifficulty,
  type TimeAvailability,
  DEFAULT_PREFERENCES,
  loadUserPreferences,
  saveUserPreferences,
  resetUserPreferences,
} from "../utils/preferences";

export interface PreferencesPanelProps {
  theme?: "dark" | "light";
  onPreferencesChange?: (prefs: UserPreferences) => void;
  className?: string;
}

const COMMON_LANGUAGES = [
  "TypeScript",
  "Python",
  "JavaScript",
  "Rust",
  "Go",
  "C++",
  "Java",
  "Ruby",
  "PHP",
  "Kotlin",
  "Swift",
  "HTML/CSS",
];

export default function PreferencesPanel({
  theme = "dark",
  onPreferencesChange,
  className = "",
}: PreferencesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [customInclude, setCustomInclude] = useState("");
  const [customExclude, setCustomExclude] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  const panelId = useId();
  const isDark = theme === "dark";

  useEffect(() => {
    const loaded = loadUserPreferences();
    setPrefs(loaded);
  }, []);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        saveUserPreferences(next);
        onPreferencesChange?.(next);
        return next;
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    },
    [onPreferencesChange]
  );

  const handleReset = () => {
    const defaultVals = resetUserPreferences();
    setPrefs(defaultVals);
    onPreferencesChange?.(defaultVals);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const toggleLanguage = (lang: string, listType: "include" | "exclude") => {
    const targetKey = listType === "include" ? "includeLanguages" : "excludeLanguages";
    const currentList = prefs[targetKey];
    const exists = currentList.includes(lang);

    const nextList = exists
      ? currentList.filter((item) => item !== lang)
      : [...currentList, lang];

    updatePreference(targetKey, nextList);
  };

  const addCustomLanguage = (listType: "include" | "exclude") => {
    const val = (listType === "include" ? customInclude : customExclude).trim();
    if (!val) return;

    toggleLanguage(val, listType);
    if (listType === "include") setCustomInclude("");
    else setCustomExclude("");
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
      } ${className}`}
    >
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between p-4 text-left sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${
              isDark ? "bg-purple-500/10 text-purple-300" : "bg-purple-100 text-purple-700"
            }`}
            aria-hidden="true"
          >
            ⚙
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight sm:text-base">
              Contribution Match Preferences
            </h3>
            <p className="text-xs opacity-70">
              Customize contribution goals, difficulty, and languages for future recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedToast && (
            <span className="text-[11px] font-medium text-emerald-400 animate-pulse">
              Saved
            </span>
          )}
          <span
            className={`transform text-xs transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            ▼
          </span>
        </div>
      </button>

      {/* Expanded Preferences Form */}
      {isOpen && (
        <div id={panelId} className="border-t border-white/5 p-4 sm:p-6 space-y-6">
          {/* Goal Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
              Contribution Goal
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { id: "general", label: "General Exploration", desc: "Open to anything" },
                { id: "learn", label: "Learning & Practice", desc: "Build new skills" },
                { id: "portfolio", label: "Portfolio Building", desc: "High-visibility repos" },
                { id: "gsoc", label: "Google Summer of Code", desc: "Mentored projects" },
                { id: "hacktoberfest", label: "Hacktoberfest / Sprints", desc: "Event issues" },
                { id: "mentorship", label: "Mentorship Wanted", desc: "Good first issues" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => updatePreference("goal", g.id as ContributionGoal)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    prefs.goal === g.id
                      ? isDark
                        ? "border-purple-500 bg-purple-500/20 text-white"
                        : "border-purple-600 bg-purple-50 text-purple-900"
                      : isDark
                      ? "border-white/10 hover:border-white/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xs font-semibold">{g.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Difficulty */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
              Preferred Issue Difficulty
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "any", label: "Any Difficulty" },
                { id: "good-first-issue", label: "Beginner (Good First Issue)" },
                { id: "intermediate", label: "Intermediate" },
                { id: "advanced", label: "Advanced / Architecture" },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => updatePreference("difficulty", diff.id as PreferredDifficulty)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                    prefs.difficulty === diff.id
                      ? "border-purple-500 bg-purple-500/20 text-purple-300"
                      : isDark
                      ? "border-white/10 bg-white/5"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Availability */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
              Weekly Time Availability
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: "casual", label: "Casual", time: "1–3 hours / week" },
                { id: "regular", label: "Regular", time: "4–8 hours / week" },
                { id: "dedicated", label: "Dedicated", time: "10+ hours / week" },
              ].map((time) => (
                <button
                  key={time.id}
                  type="button"
                  onClick={() => updatePreference("timeAvailability", time.id as TimeAvailability)}
                  className={`rounded-xl border p-2.5 text-center transition ${
                    prefs.timeAvailability === time.id
                      ? "border-purple-500 bg-purple-500/20 text-purple-300"
                      : isDark
                      ? "border-white/10 bg-white/5"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="text-xs font-semibold">{time.label}</div>
                  <div className="text-[10px] opacity-70">{time.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Languages to Include */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
              Languages to Prioritize
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_LANGUAGES.map((lang) => {
                const isSelected = prefs.includeLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang, "include")}
                    className={`rounded-lg px-2.5 py-1 text-xs border transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold"
                        : isDark
                        ? "border-white/10 bg-white/5 opacity-70"
                        : "border-gray-200 bg-gray-50 opacity-80"
                    }`}
                  >
                    {isSelected ? `✓ ${lang}` : `+ ${lang}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
            <span className="opacity-60">
              Preferences stored locally in your browser.
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-purple-400 hover:underline focus-visible:outline-none"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
