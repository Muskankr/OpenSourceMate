/**
 * Unit & Component tests verifying GitHub profile health checklist logic (Issue #194).
 */

import { render, screen } from "@testing-library/react";
import {
  evaluateProfileHealth,
  type ProfileHealthInput,
} from "../utils/profileHealth";
import ProfileHealthChecklist from "../components/ProfileHealthChecklist";

describe("GitHub Profile Health Checklist Suite (Issue #194)", () => {
  describe("evaluateProfileHealth", () => {
    it("evaluates a complete, high-quality profile with all items passed", () => {
      const fullInput: ProfileHealthInput = {
        hasBio: true,
        bioLength: 45,
        hasLocationOrCompany: true,
        hasWebsite: true,
        publicRepoCount: 12,
        hasProfileReadme: true,
        topReposWithDescriptionCount: 5,
        topReposWithLicenseCount: 5,
        topReposWithReadmeCount: 5,
        topReposEvaluatedCount: 5,
      };

      const result = evaluateProfileHealth(fullInput);
      expect(result.passedCount).toBe(6);
      expect(result.totalCount).toBe(6);
      expect(result.items.every((i) => i.passed)).toBe(true);
    });

    it("evaluates a beginner profile with constructive one-line tips", () => {
      const minimalInput: ProfileHealthInput = {
        hasBio: false,
        bioLength: 0,
        hasLocationOrCompany: false,
        hasWebsite: false,
        publicRepoCount: 1,
        hasProfileReadme: false,
        topReposWithDescriptionCount: 0,
        topReposWithLicenseCount: 0,
        topReposWithReadmeCount: 1,
        topReposEvaluatedCount: 1,
      };

      const result = evaluateProfileHealth(minimalInput);
      expect(result.passedCount).toBe(0);
      expect(result.totalCount).toBe(6);

      const bioItem = result.items.find((i) => i.id === "bio");
      expect(bioItem?.passed).toBe(false);
      expect(bioItem?.tip).toContain("Add a 1-2 sentence bio");

      const licenseItem = result.items.find((i) => i.id === "licenses");
      expect(licenseItem?.passed).toBe(false);
      expect(licenseItem?.tip).toContain("Add an open-source license");
    });

    it("requires at least 50% repository descriptions to pass", () => {
      const resPass = evaluateProfileHealth({
        hasBio: true,
        bioLength: 20,
        hasLocationOrCompany: true,
        hasWebsite: true,
        publicRepoCount: 4,
        topReposWithDescriptionCount: 2,
        topReposWithLicenseCount: 2,
        topReposWithReadmeCount: 4,
        topReposEvaluatedCount: 4,
      });

      const descItem = resPass.items.find((i) => i.id === "repo_descriptions");
      expect(descItem?.passed).toBe(true);
    });
  });

  describe("ProfileHealthChecklist Component", () => {
    it("renders checklist items and passed counter", () => {
      const health = evaluateProfileHealth({
        hasBio: true,
        bioLength: 25,
        hasLocationOrCompany: false,
        hasWebsite: true,
        publicRepoCount: 5,
        hasProfileReadme: true,
        topReposWithDescriptionCount: 4,
        topReposWithLicenseCount: 3,
        topReposWithReadmeCount: 5,
        topReposEvaluatedCount: 5,
      });

      render(<ProfileHealthChecklist health={health} />);
      expect(screen.getByText("Open-Source Profile Readiness")).toBeInTheDocument();
      expect(screen.getByText("5 of 6")).toBeInTheDocument();
      expect(screen.getByText("Profile Bio & Interests")).toBeInTheDocument();
    });
  });
});
