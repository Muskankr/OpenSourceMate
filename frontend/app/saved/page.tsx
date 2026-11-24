"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useTheme } from "../../hooks/useTheme";
import { ThemeSegmentedToggle } from "../../components/ThemeToggle";
import BuildVersionBadge from "../../components/BuildVersionBadge";
import {
  useSavedIssues,
} from "../../hooks/useSavedIssues";
import {
  VALID_SAVED_STATUSES,
  type SavedIssueStatus,
} from "../../utils/savedIssuesStorage";

export default function SavedIssuesPage() {
  const { theme, themePreference, setThemePreference } = useTheme();
  const isDark = theme === "dark";

  const {
    savedIssues,
    count,
    remove,
    update,
    clearAll,
    exportJson,
    importJson,
  } = useSavedIssues();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return savedIssues.filter((issue) => {
      // Status filter
      if (statusFilter !== "all" && issue.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchRepo = issue.repository.toLowerCase().includes(q);
        const matchNote = issue.note?.toLowerCase().includes(q);
        const matchLang = issue.language?.toLowerCase().includes(q);
        if (!matchTitle && !matchRepo && !matchNote && !matchLang) {
          return false;
        }
      }
      return true;
    });
  }, [savedIssues, statusFilter, searchQuery]);

  const handleExport = () => {
    try {
      const jsonStr = exportJson();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `opensourcemate-saved-issues-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setNotification({
        type: "success",
        message: `Exported ${count} saved issue${count === 1 ? "" : "s"} successfully.`,
      });
    } catch {
      setNotification({
        type: "error",
        message: "Failed to export saved issues.",
      });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const res = importJson(content);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Successfully imported ${res.importedCount} issue${res.importedCount === 1 ? "" : "s"}.`,
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to parse imported file.",
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAll = () => {
    if (count === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${count} saved issues? This action cannot be undone.`
    );
    if (confirmed) {
      clearAll();
      setNotification({
        type: "success",
        message: "All saved issues have been deleted.",
      });
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDark ? "bg-[#05070d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Background decorative gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute right-[-200px] top-[400px] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Header and Navigation */}
      <header
        role="banner"
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark ? "border-white/5 bg-[#05070d]/80" : "border-gray-200 bg-white/90"
        }`}
      >
        <nav
          aria-label="Main Navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5"
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 transition hover:opacity-90">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg"
                aria-hidden="true"
              >
                ✦
              </div>
              <span className="text-lg font-semibold tracking-tight">OpenSourceMate</span>
            </Link>
            <BuildVersionBadge />
          </div>

          <div
            className={`flex items-center gap-4 text-sm sm:gap-6 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Link
              href="/"
              className="rounded-lg px-2 py-1 transition hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              ← Back to Analyzer
            </Link>

            <Link
              href="/compare"
              className="hidden sm:inline-block rounded-lg px-2 py-1 transition hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              Compare
            </Link>

            <ThemeSegmentedToggle
              preference={themePreference}
              resolvedTheme={theme}
              onChangePreference={setThemePreference}
            />
          </div>
        </nav>
      </header>

      {/* Main Page Body */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Page Title & Stats */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                🔖
              </span>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Saved Issues</h1>
              <span
                data-testid="saved-count-badge"
                className="rounded-full bg-purple-500/20 px-3 py-0.5 text-xs font-semibold text-purple-300"
              >
                {count} {count === 1 ? "issue" : "issues"}
              </span>
            </div>
            <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Private personal list of issues you want to contribute to, with statuses and notes stored locally in your browser.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="export-saved-issues-button"
              onClick={handleExport}
              disabled={count === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              title="Export all saved issues as a JSON file"
            >
              <span aria-hidden="true">⬇</span>
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              data-testid="import-saved-issues-button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10"
              title="Import saved issues from a JSON file"
            >
              <span aria-hidden="true">⬆</span>
              <span>Import JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
              data-testid="import-file-input"
            />

            <button
              type="button"
              data-testid="clear-all-saved-issues-button"
              onClick={handleDeleteAll}
              disabled={count === 0}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isDark
                  ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              }`}
              title="Clear all saved issues"
            >
              <span aria-hidden="true">🗑</span>
              <span>Delete All</span>
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            role="status"
            className={`mt-4 flex items-center justify-between rounded-2xl border p-3.5 text-xs transition ${
              notification.type === "success"
                ? isDark
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
                : isDark
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="ml-3 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div
          className={`mt-6 rounded-2xl border p-4 transition ${
            isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Status filter">
              {["all", ...VALID_SAVED_STATUSES].map((st) => {
                const isSelected = statusFilter === st;
                return (
                  <button
                    key={st}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    data-testid={`status-filter-${st.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      isSelected
                        ? "bg-purple-600 text-white"
                        : isDark
                          ? "border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                          : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {st === "all" ? "All" : st}
                  </button>
                );
              })}
            </div>

            {/* Search filter input */}
            <div className="w-full sm:w-64">
              <label htmlFor="saved-search-input" className="sr-only">
                Search saved issues
              </label>
              <input
                id="saved-search-input"
                data-testid="saved-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repo, title, notes..."
                className={`w-full rounded-xl border px-3 py-1.5 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-black/40 text-white placeholder:text-gray-500 focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-600"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Overall Empty State (no issues saved at all) */}
        {count === 0 && (
          <div
            data-testid="empty-saved-issues"
            className={`mt-10 rounded-3xl border border-dashed p-12 text-center ${
              isDark ? "border-white/10 bg-white/[0.01]" : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
              🔖
            </div>
            <h3 className="text-lg font-semibold">No saved issues yet</h3>
            <p
              className={`mx-auto mt-2 max-w-md text-xs leading-relaxed ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              When browsing recommendations, click the <strong>Save</strong> button on any issue to keep track of it here with your private notes and progress status.
            </p>
            <Link
              href="/#analyzer"
              className="mt-5 inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-500"
            >
              Find issues to contribute to →
            </Link>
          </div>
        )}

        {/* Filtered Empty State (issues exist, but none match filters) */}
        {count > 0 && filteredIssues.length === 0 && (
          <div
            data-testid="filtered-empty-state"
            className={`mt-8 rounded-2xl border border-dashed p-8 text-center ${
              isDark ? "border-white/10 bg-white/[0.01]" : "border-gray-200 bg-gray-50"
            }`}
          >
            <p className="text-sm font-semibold">No saved issues match your filter criteria</p>
            <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Try clearing your search query or selecting a different status filter tab.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="mt-4 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-400 transition hover:bg-purple-500/20"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Saved Issues List */}
        {filteredIssues.length > 0 && (
          <div className="mt-6 space-y-4" role="feed" aria-label="Saved issues list">
            {filteredIssues.map((issue) => (
              <article
                key={issue.id}
                data-testid={`saved-issue-card-${issue.id}`}
                className={`rounded-2xl border p-5 transition hover:border-purple-500/40 ${
                  isDark
                    ? "border-white/10 bg-white/[0.025] hover:bg-white/[0.04]"
                    : "border-gray-200 bg-white shadow-sm hover:shadow"
                }`}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Repository Name */}
                      <span className={`font-semibold ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                        {issue.repository}
                      </span>

                      {/* Language */}
                      {issue.language && (
                        <>
                          <span className="text-gray-500" aria-hidden="true">
                            •
                          </span>
                          <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                            {issue.language}
                          </span>
                        </>
                      )}

                      {/* Difficulty Badge */}
                      {issue.difficulty && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold">
                          {issue.difficulty}
                        </span>
                      )}

                      {/* Comments */}
                      {typeof issue.comments === "number" && issue.comments > 0 && (
                        <>
                          <span className="text-gray-500" aria-hidden="true">
                            •
                          </span>
                          <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                            {issue.comments} comments
                          </span>
                        </>
                      )}
                    </div>

                    {/* Issue Title Heading */}
                    <h3 className="mt-2 text-base font-semibold leading-snug">
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-purple-400"
                      >
                        {issue.title}
                      </a>
                    </h3>

                    {/* Labels */}
                    {issue.labels && issue.labels.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {issue.labels.slice(0, 5).map((label, idx) => (
                          <span
                            key={idx}
                            className={`rounded-full border px-2 py-0.5 text-[10px] ${
                              isDark
                                ? "border-white/5 bg-white/5 text-gray-400"
                                : "border-gray-200 bg-gray-100 text-gray-600"
                            }`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Private Note & Status Bar */}
                    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between">
                      {/* Status Selector */}
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`status-select-${issue.id}`}
                          className="text-xs font-semibold text-gray-400"
                        >
                          Status:
                        </label>
                        <select
                          id={`status-select-${issue.id}`}
                          data-testid="saved-issue-status-select"
                          value={issue.status}
                          onChange={(e) =>
                            update(issue.id, {
                              status: e.target.value as SavedIssueStatus,
                            })
                          }
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold outline-none transition ${
                            issue.status === "Done"
                              ? isDark
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                                : "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : issue.status === "Working on it"
                                ? isDark
                                  ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                                  : "border-blue-300 bg-blue-50 text-blue-800"
                                : isDark
                                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                                  : "border-amber-300 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {VALID_SAVED_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Private Note Input */}
                      <div className="flex-1 sm:max-w-md">
                        <label htmlFor={`note-input-${issue.id}`} className="sr-only">
                          Private note
                        </label>
                        <input
                          id={`note-input-${issue.id}`}
                          data-testid="saved-issue-note-input"
                          type="text"
                          defaultValue={issue.note || ""}
                          placeholder="Add private note (e.g. branch, assignees)..."
                          onBlur={(e) => {
                            if (e.target.value !== issue.note) {
                              update(issue.id, { note: e.target.value });
                            }
                          }}
                          className={`w-full rounded-lg border px-3 py-1 text-xs outline-none transition ${
                            isDark
                              ? "border-white/10 bg-black/30 text-white placeholder:text-gray-500 focus:border-purple-400"
                              : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-600"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Actions Column */}
                  <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open "${issue.title}" on GitHub in a new tab`}
                      className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                        isDark
                          ? "border-white/10 bg-white/5 text-gray-200 hover:bg-white hover:text-black"
                          : "border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-900 hover:text-white"
                      }`}
                    >
                      Open ↗
                    </a>

                    <button
                      type="button"
                      data-testid="remove-saved-issue-button"
                      onClick={() => remove(issue.id)}
                      className={`rounded text-xs underline underline-offset-2 transition ${
                        isDark ? "text-gray-400 hover:text-red-400" : "text-gray-500 hover:text-red-600"
                      }`}
                      title="Remove from saved list"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
