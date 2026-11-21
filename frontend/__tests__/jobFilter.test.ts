import { filterJobs, getAvailableLocations, getBroadeningSuggestions } from "../utils/jobFilter";
import type { JobRecommendation } from "../types/jobs";

describe("jobFilter utilities", () => {
  const sampleJobs: JobRecommendation[] = [
    {
      id: "job-1",
      title: "Frontend Intern",
      company: "Acme Corp",
      location: "Remote",
      roleType: "internship",
      experienceLevel: "entry",
      requiredSkills: ["TypeScript", "React"],
      description: "Frontend role",
      score: 90,
      matchedSkills: ["TypeScript"],
      missingSkills: ["React"],
      matchReason: "Good alignment",
    },
    {
      id: "job-2",
      title: "Backend Engineer",
      company: "Beta Inc",
      location: "Bengaluru, India",
      roleType: "full-time",
      experienceLevel: "mid",
      requiredSkills: ["Python", "SQL"],
      description: "Backend role",
      score: 80,
      matchedSkills: ["Python"],
      missingSkills: ["SQL"],
      matchReason: "Good alignment",
    },
    {
      id: "job-3",
      title: "Senior Cloud Architect",
      company: "Cloud Co",
      location: "San Francisco, CA",
      roleType: "full-time",
      experienceLevel: "senior",
      requiredSkills: ["Go", "Kubernetes"],
      description: "Cloud role",
      score: 50,
      matchedSkills: [],
      missingSkills: ["Go", "Kubernetes"],
      matchReason: "Learning opportunity",
    },
  ];

  describe("getAvailableLocations", () => {
    it("extracts unique sorted locations", () => {
      const locations = getAvailableLocations(sampleJobs);
      expect(locations).toEqual(["Bengaluru, India", "Remote", "San Francisco, CA"]);
    });
  });

  describe("filterJobs", () => {
    it("filters by location", () => {
      const remoteOnly = filterJobs(sampleJobs, {
        location: "Remote",
        roleType: "all",
        experienceLevel: "all",
      });
      expect(remoteOnly).toHaveLength(1);
      expect(remoteOnly[0].id).toBe("job-1");
    });

    it("filters by role type (internship vs full-time)", () => {
      const internships = filterJobs(sampleJobs, {
        location: "all",
        roleType: "internship",
        experienceLevel: "all",
      });
      expect(internships).toHaveLength(1);
      expect(internships[0].roleType).toBe("internship");

      const fullTime = filterJobs(sampleJobs, {
        location: "all",
        roleType: "full-time",
        experienceLevel: "all",
      });
      expect(fullTime).toHaveLength(2);
      fullTime.forEach((j) => expect(j.roleType).toBe("full-time"));
    });

    it("filters by experience level", () => {
      const senior = filterJobs(sampleJobs, {
        location: "all",
        roleType: "all",
        experienceLevel: "senior",
      });
      expect(senior).toHaveLength(1);
      expect(senior[0].id).toBe("job-3");
    });

    it("filters by search query matching title or company", () => {
      const search = filterJobs(sampleJobs, {
        location: "all",
        roleType: "all",
        experienceLevel: "all",
        searchQuery: "Beta",
      });
      expect(search).toHaveLength(1);
      expect(search[0].company).toBe("Beta Inc");
    });

    it("combines multiple filters", () => {
      const combined = filterJobs(sampleJobs, {
        location: "Bengaluru, India",
        roleType: "full-time",
        experienceLevel: "mid",
      });
      expect(combined).toHaveLength(1);
      expect(combined[0].id).toBe("job-2");
    });
  });

  describe("getBroadeningSuggestions", () => {
    it("returns suggestions to broaden when zero listings match filters", () => {
      // Filter for Senior roles in Remote (which doesn't exist in sampleJobs)
      const activeFilters = {
        location: "Remote",
        roleType: "all",
        experienceLevel: "senior",
      };

      const filtered = filterJobs(sampleJobs, activeFilters);
      expect(filtered).toHaveLength(0);

      const suggestions = getBroadeningSuggestions(sampleJobs, activeFilters);
      expect(suggestions.length).toBeGreaterThan(0);

      // Suggestion to broaden location (there is a senior role in SF)
      const locSuggestion = suggestions.find((s) => s.field === "location");
      expect(locSuggestion).toBeDefined();
      expect(locSuggestion?.matchingCount).toBe(1);

      // Suggestion to broaden experience level (there is an entry internship in Remote)
      const expSuggestion = suggestions.find((s) => s.field === "experienceLevel");
      expect(expSuggestion).toBeDefined();
      expect(expSuggestion?.matchingCount).toBe(1);
    });

    it("returns empty suggestions when listings match the filters", () => {
      const activeFilters = {
        location: "Remote",
        roleType: "all",
        experienceLevel: "all",
      };
      const suggestions = getBroadeningSuggestions(sampleJobs, activeFilters);
      // Because filterJobs yields 1 result, no broadening needed
      expect(suggestions).toHaveLength(0);
    });
  });
});
