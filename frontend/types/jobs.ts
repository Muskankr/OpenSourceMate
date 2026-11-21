export type RoleType = "internship" | "full-time";
export type ExperienceLevel = "entry" | "mid" | "senior";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  roleType: RoleType;
  experienceLevel: ExperienceLevel;
  requiredSkills: string[];
  preferredSkills?: string[];
  description: string;
  applyUrl?: string;
  postedAt?: string;
}

export interface JobRecommendation extends JobListing {
  score: number; // 0 to 100 percentage
  matchedSkills: string[];
  missingSkills: string[];
  matchReason: string;
}

export interface JobFilters {
  location: string; // "all" or specific location e.g. "Remote", "Bengaluru, India"
  roleType: string; // "all" | "internship" | "full-time"
  experienceLevel: string; // "all" | "entry" | "mid" | "senior"
  searchQuery?: string;
}

export interface BroadeningSuggestion {
  id: string;
  label: string;
  field: "location" | "roleType" | "experienceLevel" | "all";
  newValue: string;
  matchingCount: number;
}

export interface JobDataSource {
  getJobListings(): Promise<JobListing[]> | JobListing[];
}
