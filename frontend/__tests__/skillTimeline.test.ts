/**
 * Unit & Component tests verifying skill growth timeline generation and table alternatives (Issue #195).
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  buildSkillTimeline,
  filterMinorLanguages,
  type RepositoryTimelineInput,
} from "../utils/skillTimeline";
import SkillTimelineChart from "../components/SkillTimelineChart";

describe("Skill Growth Timeline Suite (Issue #195)", () => {
  const sampleRepos: RepositoryTimelineInput[] = [
    { name: "repo1", language: "Python", created_at: "2022-03-15T10:00:00Z" },
    { name: "repo2", language: "Python", created_at: "2022-08-20T10:00:00Z" },
    { name: "repo3", language: "JavaScript", created_at: "2023-01-10T10:00:00Z" },
    { name: "repo4", language: "TypeScript", created_at: "2024-05-01T10:00:00Z" },
    { name: "repo5", language: "TypeScript", created_at: "2024-09-15T10:00:00Z" },
    { name: "forked", language: "Rust", created_at: "2024-10-01T10:00:00Z", is_fork: true },
  ];

  describe("buildSkillTimeline", () => {
    it("groups repositories chronologically by creation year, ignoring forks", () => {
      const timeline = buildSkillTimeline(sampleRepos);
      expect(timeline.years).toEqual([2022, 2023, 2024]);
      expect(timeline.allLanguages).toContain("Python");
      expect(timeline.allLanguages).toContain("TypeScript");
      expect(timeline.allLanguages).not.toContain("Rust"); // Fork ignored

      const y2022 = timeline.growthByYear.find((y) => y.year === 2022);
      expect(y2022?.totalRepositories).toBe(2);
      expect(y2022?.languages["Python"]).toBe(2);
    });

    it("handles empty repository list without errors", () => {
      const empty = buildSkillTimeline([]);
      expect(empty.years).toEqual([]);
      expect(empty.growthByYear).toEqual([]);
    });
  });

  describe("filterMinorLanguages", () => {
    it("groups languages with fewer than threshold repositories into 'Other'", () => {
      const timeline = buildSkillTimeline(sampleRepos);
      const filtered = filterMinorLanguages(timeline, 2);

      expect(filtered.allLanguages).toContain("Python");
      expect(filtered.allLanguages).toContain("TypeScript");
      // JavaScript only appeared once, so it should be rolled into Other
      expect(filtered.allLanguages).toContain("Other");

      const y2023 = filtered.growthByYear.find((y) => y.year === 2023);
      expect(y2023?.languages["Other"]).toBe(1);
    });
  });

  describe("SkillTimelineChart Component", () => {
    it("renders stacked bar chart view by default", () => {
      const timeline = buildSkillTimeline(sampleRepos);
      render(<SkillTimelineChart timeline={timeline} />);

      expect(screen.getByText("Skill Growth Timeline")).toBeInTheDocument();
      expect(screen.getByText("2022")).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
    });

    it("toggles accessible table view", () => {
      const timeline = buildSkillTimeline(sampleRepos);
      render(<SkillTimelineChart timeline={timeline} />);

      const toggleBtn = screen.getByRole("button", { name: /Switch to table view/i });
      fireEvent.click(toggleBtn);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("Year")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
    });
  });
});
