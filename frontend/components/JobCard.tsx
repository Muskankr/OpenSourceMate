"use client";

import React from "react";
import type { JobRecommendation } from "../types/jobs";

export interface JobCardProps {
  job: JobRecommendation;
  theme?: "dark" | "light";
}

export default function JobCard({ job, theme = "dark" }: JobCardProps) {
  const isDark = theme === "dark";

  const getScoreBadgeStyle = (score: number) => {
    if (score >= 80) {
      return isDark
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        : "border-emerald-300 bg-emerald-50 text-emerald-800";
    }
    if (score >= 50) {
      return isDark
        ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
        : "border-blue-300 bg-blue-50 text-blue-800";
    }
    return isDark
      ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
      : "border-purple-200 bg-purple-50 text-purple-800";
  };

  const getRoleTypeBadge = (roleType: string) => {
    const isInternship = roleType === "internship";
    return (
      <span
        data-testid="role-type-badge"
        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
          isInternship
            ? isDark
              ? "border border-amber-400/30 bg-amber-400/10 text-amber-300"
              : "border border-amber-300 bg-amber-50 text-amber-800"
            : isDark
              ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
              : "border border-cyan-300 bg-cyan-50 text-cyan-800"
        }`}
      >
        {isInternship ? "Internship" : "Full-Time"}
      </span>
    );
  };

  const getExpLevelBadge = (level: string) => {
    const label = level === "entry" ? "Entry Level" : level === "mid" ? "Mid Level" : "Senior";
    return (
      <span
        data-testid="exp-level-badge"
        className={`rounded-md px-2 py-0.5 text-[11px] font-medium border ${
          isDark
            ? "border-white/10 bg-white/5 text-gray-300"
            : "border-gray-300 bg-white text-gray-700"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <article
      aria-label={`Job listing for ${job.title} at ${job.company}`}
      className={`group relative rounded-2xl border p-5 transition-all duration-200 ${
        isDark
          ? "border-white/10 bg-white/[0.02] hover:border-purple-500/30 hover:bg-white/[0.04]"
          : "border-gray-200 bg-white shadow-xs hover:border-purple-400/50 hover:shadow-md"
      }`}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          {/* Header row: Company, Location, Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-semibold ${isDark ? "text-purple-400" : "text-purple-600"}`}
            >
              {job.company}
            </span>
            <span className={isDark ? "text-gray-500" : "text-gray-400"}>•</span>
            <span
              className={`text-xs flex items-center gap-1 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              📍 {job.location}
            </span>
            <span className={isDark ? "text-gray-500" : "text-gray-400"}>•</span>
            {getRoleTypeBadge(job.roleType)}
            {getExpLevelBadge(job.experienceLevel)}
          </div>

          {/* Job Title */}
          <h4 className="mt-2 text-lg font-bold leading-snug">
            {job.applyUrl ? (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
              >
                {job.title} ↗
              </a>
            ) : (
              <span>{job.title}</span>
            )}
          </h4>

          {/* Job Description */}
          <p
            className={`mt-1.5 text-xs line-clamp-2 leading-relaxed ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {job.description}
          </p>

          {/* Matched Skills List (Requirement: Each recommendation lists the matched skills) */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5" aria-label="Skills">
            <span
              className={`text-[11px] font-semibold mr-1 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Matched Skills:
            </span>
            {job.matchedSkills && job.matchedSkills.length > 0 ? (
              job.matchedSkills.map((skill) => (
                <span
                  key={skill}
                  data-testid="matched-skill-badge"
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                    isDark
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <span aria-hidden="true">✓</span>
                  {skill}
                </span>
              ))
            ) : (
              <span className={`text-[11px] italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                None currently matched
              </span>
            )}

            {job.missingSkills && job.missingSkills.length > 0 && (
              <>
                <span
                  className={`text-[11px] font-semibold ml-2 mr-1 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  To Learn:
                </span>
                {job.missingSkills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    data-testid="missing-skill-badge"
                    className={`rounded-md px-2 py-0.5 text-[11px] font-normal border ${
                      isDark
                        ? "border-white/10 bg-white/5 text-gray-400"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </>
            )}
          </div>

          {/* Match Reason explanation box (Requirement: show reason for each recommendation) */}
          {job.matchReason && (
            <div
              data-testid="match-reason-box"
              className={`mt-3.5 rounded-xl border p-3 text-xs ${
                isDark
                  ? "border-purple-500/20 bg-purple-500/5 text-purple-200"
                  : "border-purple-200 bg-purple-50 text-purple-900"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-purple-400">
                <span aria-hidden="true">✦</span>
                <span>Why this fits you</span>
              </div>
              <p className={`mt-1 leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {job.matchReason}
              </p>
            </div>
          )}
        </div>

        {/* Score & Apply CTA column */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div
            data-testid="match-score-badge"
            className={`rounded-xl border px-3 py-1.5 text-center text-xs font-semibold ${getScoreBadgeStyle(
              job.score
            )}`}
          >
            <span className="text-sm font-bold sm:text-base">{job.score}%</span>
            <span className="block text-[10px] uppercase tracking-wider opacity-80">Match</span>
          </div>

          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              Apply Now ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
