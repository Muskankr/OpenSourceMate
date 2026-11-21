import type {
  BroadeningSuggestion,
  JobFilters,
  JobListing,
  JobRecommendation,
} from "../types/jobs";

/**
 * Extracts a deduplicated, sorted list of available locations from listings.
 */
export function getAvailableLocations(jobs: JobListing[]): string[] {
  const locations = new Set<string>();
  for (const job of jobs) {
    if (job.location) {
      locations.add(job.location);
    }
  }
  return Array.from(locations).sort();
}

/**
 * Filters ranked job recommendations according to active filter criteria.
 */
export function filterJobs(jobs: JobRecommendation[], filters: JobFilters): JobRecommendation[] {
  return jobs.filter((job) => {
    // Location filter
    if (
      filters.location &&
      filters.location !== "all" &&
      job.location.toLowerCase() !== filters.location.toLowerCase()
    ) {
      return false;
    }

    // Role type filter (internship vs full-time)
    if (
      filters.roleType &&
      filters.roleType !== "all" &&
      job.roleType.toLowerCase() !== filters.roleType.toLowerCase()
    ) {
      return false;
    }

    // Experience level filter (entry, mid, senior)
    if (
      filters.experienceLevel &&
      filters.experienceLevel !== "all" &&
      job.experienceLevel.toLowerCase() !== filters.experienceLevel.toLowerCase()
    ) {
      return false;
    }

    // Keyword search filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchesTitle = job.title.toLowerCase().includes(q);
      const matchesCompany = job.company.toLowerCase().includes(q);
      const matchesDesc = job.description.toLowerCase().includes(q);
      const matchesSkills = (job.requiredSkills || []).some((s) => s.toLowerCase().includes(q));

      if (!matchesTitle && !matchesCompany && !matchesDesc && !matchesSkills) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Generates helpful, one-click suggestions to broaden filters when zero results match.
 */
export function getBroadeningSuggestions(
  unfilteredJobs: JobRecommendation[],
  activeFilters: JobFilters
): BroadeningSuggestion[] {
  // If listings already match the active filters, no broadening is needed
  const currentFiltered = filterJobs(unfilteredJobs, activeFilters);
  if (currentFiltered.length > 0) {
    return [];
  }

  const suggestions: BroadeningSuggestion[] = [];

  // If location is filtered, check if clearing location yields results
  if (activeFilters.location && activeFilters.location !== "all") {
    const withoutLocation = filterJobs(unfilteredJobs, {
      ...activeFilters,
      location: "all",
    });
    if (withoutLocation.length > 0) {
      suggestions.push({
        id: "broaden-location",
        label: `View opportunities across all locations (${withoutLocation.length} available)`,
        field: "location",
        newValue: "all",
        matchingCount: withoutLocation.length,
      });
    }
  }

  // If roleType is filtered, check if clearing roleType yields results
  if (activeFilters.roleType && activeFilters.roleType !== "all") {
    const withoutRoleType = filterJobs(unfilteredJobs, {
      ...activeFilters,
      roleType: "all",
    });
    if (withoutRoleType.length > 0) {
      suggestions.push({
        id: "broaden-role-type",
        label: `Include both internships and full-time roles (${withoutRoleType.length} available)`,
        field: "roleType",
        newValue: "all",
        matchingCount: withoutRoleType.length,
      });
    }
  }

  // If experienceLevel is filtered, check if clearing experienceLevel yields results
  if (activeFilters.experienceLevel && activeFilters.experienceLevel !== "all") {
    const withoutExp = filterJobs(unfilteredJobs, {
      ...activeFilters,
      experienceLevel: "all",
    });
    if (withoutExp.length > 0) {
      suggestions.push({
        id: "broaden-experience",
        label: `Expand to all experience levels (${withoutExp.length} available)`,
        field: "experienceLevel",
        newValue: "all",
        matchingCount: withoutExp.length,
      });
    }
  }

  return suggestions;
}
