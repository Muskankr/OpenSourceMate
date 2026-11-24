"use client";

import React, { useState, useId } from "react";
import {
  type MatchingPreferences,
  type ExpectedTimeCommitment,
  hasActiveMatchingPreferences,
} from "../utils/preferences";

export interface ContributionPreferencesPanelProps {
  theme?: "dark" | "light";
  preferences: MatchingPreferences;
  onPreferencesChange: (newPrefs: MatchingPreferences) => void;
  onReset: () => void;
  className?: string;
}

const COMMON_PREF_LANGS = [
  "Python",
  "TypeScript",
  "JavaScript",
  "Go",
  "Rust",
  "Java",
  "C++",
  "Ruby",
];

export default function ContributionPreferencesPanel({
  theme = "dark",
  preferences,
  onPreferencesChange,
  onReset,
  className = "",
}: ContributionPreferencesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customOrg, setCustomOrg] = useState("");
  const [customLang, setCustomLang] = useState("");
  const panelId = useId();
  const isDark = theme === "dark";

  const isConfigured = hasActiveMatchingPreferences(preferences);

  const toggleLanguage = (lang: string) => {
    const current = preferences.preferredLanguages || [];
    const exists = current.some((l) => l.toLowerCase() === lang.toLowerCase());
    const updated = exists
      ? current.filter((l) => l.toLowerCase() !== lang.toLowerCase())
      : [...current, lang];
    onPreferencesChange({
      ...preferences,
      preferredLanguages: updated,
    });
  };

  const addCustomLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customLang.trim();
    if (!clean) return;
    toggleLanguage(clean);
    setCustomLang("");
  };

  const addExcludedOrg = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customOrg.trim().toLowerCase();
    if (!clean) return;
    const current = preferences.excludedOrgs || [];
    if (!current.some((o) => o.toLowerCase() === clean)) {
      onPreferencesChange({
        ...preferences,
        excludedOrgs: [...current, clean],
      });
    }
    setCustomOrg("");
  };

  const removeExcludedOrg = (orgToRemove: string) => {
    const current = preferences.excludedOrgs || [];
    onPreferencesChange({
      ...preferences,
      excludedOrgs: current.filter((o) => o.toLowerCase() !== orgToRemove.toLowerCase()),
    });
  };

  const setMaxAge = (days: number | null) => {
    onPreferencesChange({
      ...preferences,
      maxAgeDays: days,
    });
  };

  const setExpectedTime = (time: ExpectedTimeCommitment | null) => {
    onPreferencesChange({
      ...preferences,
      expectedTime: time,
    });
  };

  return (
    <div
      data-testid="contribution-preferences-panel"
      className={`rounded-2xl border transition-all duration-300 ${
        isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
      } ${className}`}
    >
      {/* Header Bar */}
      <div className="flex w-full items-center justify-between p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          data-testid="toggle-preferences-panel-btn"
          className="flex flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-xl"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${
              isDark ? "bg-purple-500/10 text-purple-300" : "bg-purple-100 text-purple-700"
            }`}
            aria-hidden="true"
          >
            ⚙
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                Matching Preferences
              </h3>
              {isConfigured && (
                <span
                  data-testid="preferences-active-badge"
                  className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300"
                >
                  Customized
                </span>
              )}
            </div>
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Filter by preferred languages, excluded orgs/repos, issue age, and time commitment
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3 ml-2">
          {isConfigured && (
            <button
              type="button"
              onClick={onReset}
              data-testid="reset-preferences-quick-btn"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline focus-visible:outline-none"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Collapse preferences panel" : "Expand preferences panel"}
            className="p-1 text-gray-400 hover:text-white"
          >
            <span
              className={`inline-block transform text-xs transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>
        </div>
      </div>

      {/* Expanded Form */}
      {isOpen && (
        <div
          id={panelId}
          data-testid="preferences-panel-content"
          className="border-t border-white/5 p-4 sm:p-6 space-y-6"
        >
          {/* 1. Preferred Languages */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Preferred Languages
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_PREF_LANGS.map((lang) => {
                const isSelected = (preferences.preferredLanguages || []).some(
                  (l) => l.toLowerCase() === lang.toLowerCase()
                );
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    data-testid={`pref-lang-${lang}`}
                    aria-pressed={isSelected}
                    className={`rounded-lg px-2.5 py-1 text-xs border transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold"
                        : isDark
                        ? "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {isSelected ? `✓ ${lang}` : `+ ${lang}`}
                  </button>
                );
              })}
            </div>

            <form onSubmit={addCustomLanguage} className="flex gap-2 max-w-xs">
              <input
                type="text"
                value={customLang}
                onChange={(e) => setCustomLang(e.target.value)}
                placeholder="Add other language..."
                data-testid="custom-lang-input"
                className={`w-full rounded-xl border px-3 py-1.5 text-xs outline-none ${
                  isDark
                    ? "border-white/10 bg-black/30 text-white placeholder:text-gray-500 focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-600"
                }`}
              />
              <button
                type="submit"
                data-testid="add-custom-lang-btn"
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 transition"
              >
                Add
              </button>
            </form>
          </div>

          {/* 2. Excluded Organizations / Repositories */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Excluded Organizations or Repositories
            </label>
            <p className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Issues from these organizations or repositories will never appear in your results.
            </p>

            {(preferences.excludedOrgs || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5" data-testid="excluded-orgs-list">
                {preferences.excludedOrgs.map((org) => (
                  <span
                    key={org}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300"
                  >
                    <span>{org}</span>
                    <button
                      type="button"
                      onClick={() => removeExcludedOrg(org)}
                      aria-label={`Remove exclusion for ${org}`}
                      className="ml-1 text-red-400 hover:text-red-200"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            <form onSubmit={addExcludedOrg} className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={customOrg}
                onChange={(e) => setCustomOrg(e.target.value)}
                placeholder="e.g. facebook or facebook/react"
                data-testid="exclude-org-input"
                className={`w-full rounded-xl border px-3 py-1.5 text-xs outline-none ${
                  isDark
                    ? "border-white/10 bg-black/30 text-white placeholder:text-gray-500 focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-600"
                }`}
              />
              <button
                type="submit"
                data-testid="exclude-org-btn"
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 transition text-red-300"
              >
                Exclude
              </button>
            </form>
          </div>

          {/* 3. Maximum Issue Age */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Maximum Issue Age
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Any age", value: null },
                { label: "Past 7 days", value: 7 },
                { label: "Past 30 days", value: 30 },
                { label: "Past 90 days", value: 90 },
                { label: "Past 180 days", value: 180 },
              ].map((opt) => {
                const isSelected = preferences.maxAgeDays === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setMaxAge(opt.value)}
                    data-testid={`pref-age-${opt.value ?? "any"}`}
                    aria-pressed={isSelected}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                      isSelected
                        ? "border-purple-500 bg-purple-500/20 text-purple-300"
                        : isDark
                        ? "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Expected Time Commitment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Expected Time Commitment
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                {
                  id: "quick",
                  title: "Quick (< 2 hours)",
                  desc: "Small scope, typo, or beginner-friendly quick fix",
                },
                {
                  id: "weekend",
                  title: "A Weekend",
                  desc: "Moderate scope feature or focused bug resolution",
                },
                {
                  id: "ongoing",
                  title: "Ongoing",
                  desc: "Substantial feature or deep architectural effort",
                },
              ].map((t) => {
                const isSelected = preferences.expectedTime === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setExpectedTime(isSelected ? null : (t.id as ExpectedTimeCommitment))}
                    data-testid={`pref-time-${t.id}`}
                    aria-pressed={isSelected}
                    className={`rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-purple-500 bg-purple-500/20 text-purple-300 ring-1 ring-purple-500"
                        : isDark
                        ? "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs font-semibold">{t.title}</div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {t.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Reset */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
            <span className={isDark ? "text-gray-400" : "text-gray-500"}>
              Preferences stored in your browser and applied to matching.
            </span>
            <button
              type="button"
              onClick={onReset}
              data-testid="reset-preferences-full-btn"
              className="text-purple-400 hover:underline focus-visible:outline-none"
            >
              Reset all preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
