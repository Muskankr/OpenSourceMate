"use client";

import React, { useMemo, useState } from "react";
import type {
  BroadeningSuggestion,
  JobDataSource,
  JobFilters,
  RoleType,
  ExperienceLevel,
} from "../types/jobs";
import { getDefaultJobDataSource } from "../services/jobDataSource";
import { rankJobListings } from "../utils/jobRanking";
import { filterJobs, getAvailableLocations, getBroadeningSuggestions } from "../utils/jobFilter";
import JobCard from "./JobCard";

export interface JobOpportunitiesListProps {
  studentSkills?: (string | { name: string })[];
  dataSource?: JobDataSource;
  theme?: "dark" | "light";
  className?: string;
}

export default function JobOpportunitiesList({
  studentSkills = [],
  dataSource,
  theme = "dark",
  className = "",
}: JobOpportunitiesListProps) {
  const isDark = theme === "dark";

  // Pluggable data source resolution
  const activeSource = dataSource || getDefaultJobDataSource();

  // Load and rank listings using the pluggable data source
  const rawListings = useMemo(() => {
    return activeSource.getJobListings();
  }, [activeSource]);

  const rankedJobs = useMemo(() => {
    return rankJobListings(rawListings, studentSkills);
  }, [rawListings, studentSkills]);

  // Extract available locations dynamically
  const availableLocations = useMemo(() => {
    return getAvailableLocations(rawListings);
  }, [rawListings]);

  // Filter states
  const [location, setLocation] = useState<string>("all");
  const [roleType, setRoleType] = useState<string>("all");
  const [experienceLevel, setExperienceLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const currentFilters: JobFilters = useMemo(
    () => ({
      location,
      roleType,
      experienceLevel,
      searchQuery,
    }),
    [location, roleType, experienceLevel, searchQuery]
  );

  // Active filtered jobs
  const filteredJobs = useMemo(() => {
    return filterJobs(rankedJobs, currentFilters);
  }, [rankedJobs, currentFilters]);

  // Suggestions to broaden filters when zero results match
  const broadeningSuggestions = useMemo(() => {
    if (filteredJobs.length > 0 || rankedJobs.length === 0) {
      return [];
    }
    return getBroadeningSuggestions(rankedJobs, currentFilters);
  }, [filteredJobs.length, rankedJobs, currentFilters]);

  const hasActiveFilters =
    location !== "all" ||
    roleType !== "all" ||
    experienceLevel !== "all" ||
    searchQuery.trim().length > 0;

  const resetAllFilters = () => {
    setLocation("all");
    setRoleType("all");
    setExperienceLevel("all");
    setSearchQuery("");
  };

  const applyBroadeningSuggestion = (suggestion: BroadeningSuggestion) => {
    if (suggestion.field === "location") {
      setLocation(suggestion.newValue);
    } else if (suggestion.field === "roleType") {
      setRoleType(suggestion.newValue);
    } else if (suggestion.field === "experienceLevel") {
      setExperienceLevel(suggestion.newValue);
    } else if (suggestion.field === "all") {
      resetAllFilters();
    }
  };

  return (
    <section
      id="jobs"
      aria-label="Student job and internship opportunities"
      className={`mt-8 rounded-3xl border p-5 sm:p-8 transition-all duration-300 ${
        isDark ? "border-white/10 bg-white/[0.035]" : "border-gray-200 bg-white shadow-sm"
      } ${className}`}
    >
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                isDark
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800"
              }`}
            >
              OPPORTUNITIES
            </span>
          </div>

          <h3 className="mt-2 text-2xl font-bold tracking-tight">
            Student Job & Internship Matches
          </h3>

          <p className={`mt-1.5 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            Opportunities ranked by overlap with your technical skills, with clear reasons
            explaining why each position fits.
          </p>
        </div>

        {rankedJobs.length > 0 && (
          <div
            className={`text-xs sm:text-sm font-medium ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Showing {filteredJobs.length} of {rankedJobs.length} opportunities
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      {rankedJobs.length > 0 && (
        <div
          className={`mt-6 rounded-2xl border p-4 ${
            isDark ? "border-white/5 bg-white/[0.02]" : "border-gray-200 bg-gray-50/60"
          }`}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Filter */}
            <div>
              <label
                htmlFor="job-search-filter"
                className="block text-xs font-semibold text-gray-400"
              >
                Search Role or Company
              </label>
              <input
                id="job-search-filter"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, company, skill..."
                aria-label="Filter opportunities by role title, company, or keyword"
                className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-600"
                }`}
              />
            </div>

            {/* Location Filter */}
            <div>
              <label
                htmlFor="job-location-filter"
                className="block text-xs font-semibold text-gray-400"
              >
                Location
              </label>
              <select
                id="job-location-filter"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Filter opportunities by location"
                className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-[#0c101d] text-white focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 focus:border-purple-600"
                }`}
              >
                <option value="all">All Locations</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Type Filter (Internship or Full-time) */}
            <div>
              <label
                htmlFor="job-role-type-filter"
                className="block text-xs font-semibold text-gray-400"
              >
                Role Type
              </label>
              <select
                id="job-role-type-filter"
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                aria-label="Filter opportunities by role type"
                className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-[#0c101d] text-white focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 focus:border-purple-600"
                }`}
              >
                <option value="all">All Role Types</option>
                <option value="internship">Internship</option>
                <option value="full-time">Full-Time</option>
              </select>
            </div>

            {/* Experience Level Filter */}
            <div>
              <label htmlFor="job-exp-filter" className="block text-xs font-semibold text-gray-400">
                Experience Level
              </label>
              <select
                id="job-exp-filter"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                aria-label="Filter opportunities by experience level"
                className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
                  isDark
                    ? "border-white/10 bg-[#0c101d] text-white focus:border-purple-400"
                    : "border-gray-300 bg-white text-gray-900 focus:border-purple-600"
                }`}
              >
                <option value="all">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
              <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                Active opportunity filters applied
              </span>
              <button
                type="button"
                onClick={resetAllFilters}
                className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filtered Empty State with Broadening Suggestions */}
      {rankedJobs.length > 0 && filteredJobs.length === 0 && (
        <div
          data-testid="job-filter-empty-state"
          className={`mt-8 rounded-2xl border border-dashed p-8 text-center ${
            isDark ? "border-white/10 bg-white/[0.01]" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="mx-auto mb-2 text-2xl" aria-hidden="true">
            🔍
          </div>
          <p className="text-base font-semibold">No opportunities match your filters</p>
          <p
            className={`mt-1 text-xs max-w-md mx-auto ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            We couldn&apos;t find matching listings with this exact filter combination. Try one of
            the suggestions below to broaden your search:
          </p>

          {/* Broadening suggestions list */}
          {broadeningSuggestions.length > 0 && (
            <div
              data-testid="broadening-suggestions-container"
              className="mt-5 flex flex-wrap justify-center gap-2 max-w-lg mx-auto"
            >
              {broadeningSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  data-testid="broaden-suggestion-btn"
                  onClick={() => applyBroadeningSuggestion(suggestion)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    isDark
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  <span aria-hidden="true">+</span>
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={resetAllFilters}
              className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-400 transition hover:bg-purple-500/20"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Overall Empty State when data source has 0 listings */}
      {rankedJobs.length === 0 && (
        <div
          data-testid="no-jobs-empty-state"
          className={`mt-8 rounded-2xl border border-dashed p-10 text-center ${
            isDark ? "border-white/10 bg-white/[0.01]" : "border-gray-200 bg-gray-50"
          }`}
        >
          <p className="text-base font-semibold">No job opportunities loaded</p>
          <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            No listings are currently available from the active data source.
          </p>
        </div>
      )}

      {/* Render ranked listings */}
      {filteredJobs.length > 0 && (
        <div className="mt-6 space-y-4" role="feed" aria-label="Opportunities list">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} theme={theme} />
          ))}
        </div>
      )}
    </section>
  );
}
