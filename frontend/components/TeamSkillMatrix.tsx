"use client";

import React, { useState } from "react";
import type { TeamSkillMatrixSummary } from "../types/team";

interface TeamSkillMatrixProps {
  summary: TeamSkillMatrixSummary;
  theme?: "dark" | "light";
  onRemoveUser?: (username: string) => void;
}

export default function TeamSkillMatrix({
  summary,
  theme = "dark",
  onRemoveUser,
}: TeamSkillMatrixProps) {
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual");
  const [filterQuery, setFilterQuery] = useState("");
  const [coverageFilter, setCoverageFilter] = useState<"all" | "shared" | "single">("all");

  const isDark = theme === "dark";

  const {
    analyzedUsers,
    failedUsers,
    skillsMatrix,
    singleExpertSkills,
    sharedSkills,
    totalDistinctSkills,
  } = summary;

  // Filter skills according to search and coverage toggle
  const filteredSkills = skillsMatrix.filter((row) => {
    if (filterQuery && !row.skillName.toLowerCase().includes(filterQuery.toLowerCase())) {
      return false;
    }
    if (coverageFilter === "shared" && row.coveredByCount < 2) return false;
    if (coverageFilter === "single" && !row.isSingleExpert) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Failures and Warnings banner for partial failures */}
      {failedUsers.length > 0 && (
        <div
          data-testid="team-partial-failures"
          role="alert"
          className={`rounded-2xl border p-4 sm:p-5 ${
            isDark
              ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden="true">⚠️</span>
            <div>
              <h4 className="font-semibold text-sm sm:text-base">
                Some team members could not be analyzed ({failedUsers.length})
              </h4>
              <p className="mt-1 text-xs sm:text-sm opacity-90">
                The skill matrix includes all available data from successfully analyzed profiles.
              </p>
              <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                {failedUsers.map((failed) => (
                  <li key={failed.username} className="flex items-center gap-2">
                    <span className="font-mono font-medium">@{failed.username}:</span>
                    <span>{failed.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          className={`rounded-2xl border p-4 transition ${
            isDark
              ? "border-white/10 bg-white/[0.03]"
              : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          <p className="text-xs font-medium text-gray-400">Team Members</p>
          <p className="mt-1 text-2xl font-bold">{analyzedUsers.length}</p>
          <p className="mt-1 text-xs text-gray-400">Active in matrix</p>
        </div>

        <div
          className={`rounded-2xl border p-4 transition ${
            isDark
              ? "border-white/10 bg-white/[0.03]"
              : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          <p className="text-xs font-medium text-gray-400">Total Skills</p>
          <p className="mt-1 text-2xl font-bold text-purple-400">{totalDistinctSkills}</p>
          <p className="mt-1 text-xs text-gray-400">Covered together</p>
        </div>

        <div
          className={`rounded-2xl border p-4 transition ${
            isDark
              ? "border-white/10 bg-white/[0.03]"
              : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          <p className="text-xs font-medium text-gray-400">Shared Skills</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{sharedSkills.length}</p>
          <p className="mt-1 text-xs text-gray-400">Covered by 2+ members</p>
        </div>

        <div
          className={`rounded-2xl border p-4 transition ${
            isDark
              ? "border-white/10 bg-white/[0.03]"
              : "border-gray-200 bg-white shadow-sm"
          }`}
        >
          <p className="text-xs font-medium text-gray-400">Single-Expert</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{singleExpertSkills.length}</p>
          <p className="mt-1 text-xs text-gray-400">Known by only 1 person</p>
        </div>
      </div>

      {/* Technologies that only one person knows */}
      {singleExpertSkills.length > 0 && (
        <div
          data-testid="single-expert-section"
          className={`rounded-2xl border p-4 sm:p-5 ${
            isDark
              ? "border-amber-500/20 bg-amber-500/[0.04]"
              : "border-amber-200 bg-amber-50/50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">💡</span>
            <h4 className="font-semibold text-sm sm:text-base">
              Technologies only one person knows ({singleExpertSkills.length})
            </h4>
          </div>
          <p
            className={`mt-1 text-xs sm:text-sm ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            These skills represent unique strengths where only a single team member has experience.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {singleExpertSkills.map((item) => (
              <span
                key={item.skillName}
                data-testid={`single-expert-${item.skillName.toLowerCase()}`}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                  isDark
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    : "border-amber-300 bg-amber-100 text-amber-900"
                }`}
              >
                <span>{item.skillName}</span>
                <span className="opacity-60 font-mono text-[10px]">
                  (@{item.singleExpertUsername})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Matrix Controls & Accessible View Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle: Visual Matrix vs Accessible Table */}
          <div
            role="group"
            aria-label="Matrix view mode"
            className={`inline-flex rounded-xl p-1 border text-xs font-medium ${
              isDark ? "border-white/10 bg-white/5" : "border-gray-300 bg-gray-100"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode("visual")}
              className={`rounded-lg px-3 py-1.5 transition ${
                viewMode === "visual"
                  ? isDark
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white text-purple-700 shadow-sm ring-1 ring-gray-200"
                  : isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Visual Matrix
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              data-testid="toggle-accessible-table"
              className={`rounded-lg px-3 py-1.5 transition ${
                viewMode === "table"
                  ? isDark
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white text-purple-700 shadow-sm ring-1 ring-gray-200"
                  : isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Accessible Table
            </button>
          </div>

          {/* Filter options */}
          <div
            role="group"
            aria-label="Filter skills by coverage"
            className={`inline-flex rounded-xl p-1 border text-xs font-medium ${
              isDark ? "border-white/10 bg-white/5" : "border-gray-300 bg-gray-100"
            }`}
          >
            <button
              type="button"
              onClick={() => setCoverageFilter("all")}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                coverageFilter === "all"
                  ? isDark
                    ? "bg-white/10 text-white"
                    : "bg-white text-gray-900 shadow-sm"
                  : isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({skillsMatrix.length})
            </button>
            <button
              type="button"
              onClick={() => setCoverageFilter("shared")}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                coverageFilter === "shared"
                  ? isDark
                    ? "bg-white/10 text-white"
                    : "bg-white text-gray-900 shadow-sm"
                  : isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Shared ({sharedSkills.length})
            </button>
            <button
              type="button"
              onClick={() => setCoverageFilter("single")}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                coverageFilter === "single"
                  ? isDark
                    ? "bg-white/10 text-white"
                    : "bg-white text-gray-900 shadow-sm"
                  : isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Single ({singleExpertSkills.length})
            </button>
          </div>
        </div>

        {/* Search input for skills */}
        <div className="w-full sm:w-64">
          <input
            type="search"
            aria-label="Filter technologies in matrix"
            placeholder="Search technology..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className={`w-full rounded-xl border px-3 py-1.5 text-xs outline-none transition ${
              isDark
                ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-purple-400"
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-600"
            }`}
          />
        </div>
      </div>

      {/* Main Matrix Container */}
      <div
        className={`overflow-hidden rounded-2xl border ${
          isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white shadow-sm"
        }`}
      >
        {filteredSkills.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No technologies match your current filter.
          </div>
        ) : viewMode === "visual" ? (
          /* Visual Interactive Grid View */
          <div className="overflow-x-auto">
            <table
              data-testid="team-visual-matrix"
              className="w-full border-collapse text-left text-sm"
            >
              <thead>
                <tr className={isDark ? "border-b border-white/10 bg-white/5" : "border-b border-gray-200 bg-gray-50"}>
                  <th scope="col" className="p-3.5 font-semibold text-xs uppercase tracking-wider">
                    Technology
                  </th>
                  {analyzedUsers.map((user) => (
                    <th
                      key={user}
                      scope="col"
                      className="p-3.5 text-center font-semibold text-xs uppercase tracking-wider"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono">@{user}</span>
                        {onRemoveUser && (
                          <button
                            type="button"
                            onClick={() => onRemoveUser(user)}
                            aria-label={`Remove @${user} from team`}
                            className="rounded text-[10px] text-gray-400 hover:text-red-400 transition"
                          >
                            × remove
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th scope="col" className="p-3.5 text-center font-semibold text-xs uppercase tracking-wider">
                    Covered By
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
                {filteredSkills.map((row) => (
                  <tr
                    key={row.skillName}
                    className={`transition hover:${isDark ? "bg-white/[0.02]" : "bg-gray-50"}`}
                  >
                    <td className="p-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{row.skillName}</span>
                        {row.isSingleExpert && (
                          <span
                            title={`Only @${row.singleExpertUsername} has experience`}
                            className="rounded-full bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400"
                          >
                            Solo
                          </span>
                        )}
                      </div>
                    </td>

                    {analyzedUsers.map((user) => {
                      const count = row.userCoverage[user];
                      const hasSkill = typeof count === "number" && count > 0;

                      return (
                        <td key={user} className="p-3.5 text-center">
                          {hasSkill ? (
                            <span
                              title={`@${user} uses ${row.skillName} in ${count} repo${count === 1 ? "" : "s"}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 font-semibold text-xs border border-purple-500/30"
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              aria-label={`@${user} has no public experience in ${row.skillName}`}
                              className="inline-flex h-7 w-7 items-center justify-center text-gray-600 text-xs"
                            >
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.coveredByCount >= 2
                            ? isDark
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isDark
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {row.coveredByCount} of {analyzedUsers.length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Accessible Standard HTML Table Alternative */
          <div className="overflow-x-auto">
            <table
              data-testid="team-accessible-table"
              aria-label="Accessible Team Skill Matrix Table"
              className="w-full border-collapse text-left text-sm"
            >
              <caption className="sr-only">
                Team Skill Matrix: lists each technology and which team members have public repository experience.
              </caption>
              <thead>
                <tr className={isDark ? "border-b border-white/10 bg-white/5" : "border-b border-gray-200 bg-gray-50"}>
                  <th scope="col" className="p-3 font-semibold text-xs uppercase">
                    Technology
                  </th>
                  <th scope="col" className="p-3 font-semibold text-xs uppercase">
                    Coverage Summary
                  </th>
                  <th scope="col" className="p-3 font-semibold text-xs uppercase">
                    Covered By (Members)
                  </th>
                  <th scope="col" className="p-3 font-semibold text-xs uppercase">
                    Expertise Classification
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
                {filteredSkills.map((row) => (
                  <tr key={row.skillName}>
                    <th scope="row" className="p-3 font-medium">
                      {row.skillName}
                    </th>
                    <td className="p-3 text-xs">
                      {row.coveredByCount} of {analyzedUsers.length} member{analyzedUsers.length === 1 ? "" : "s"} ({Math.round((row.coveredByCount / analyzedUsers.length) * 100)}%)
                    </td>
                    <td className="p-3 text-xs font-mono">
                      {row.coveredByUsers.map((u) => `@${u}`).join(", ")}
                    </td>
                    <td className="p-3 text-xs">
                      {row.isSingleExpert ? (
                        <span className="font-semibold text-amber-400">
                          Single person only (@{row.singleExpertUsername})
                        </span>
                      ) : (
                        <span className="text-emerald-400">Shared expertise</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
