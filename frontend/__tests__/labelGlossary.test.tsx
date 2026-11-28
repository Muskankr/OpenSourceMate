import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LABEL_GLOSSARY, getLabelExplanation } from "../data/labelGlossary";
import IssueCard from "../components/IssueCard";
import type { IssueRecommendation } from "../types/api";
import { setCachedResponsiveness, determineResponsiveness } from "../utils/repoResponsiveness";
import { setCachedFriendlinessScore, calculateFriendlinessScore } from "../utils/repoFriendliness";

describe("Label Glossary & Newcomer Tooltips (Issue #476)", () => {
  beforeAll(() => {
    setCachedResponsiveness(
      "octocat/hello-world",
      determineResponsiveness({
        repository: "octocat/hello-world",
        medianResponseHours: 12.0,
        sampleCount: 5,
      })
    );
    setCachedFriendlinessScore(
      "octocat/hello-world",
      calculateFriendlinessScore("octocat/hello-world", {
        hasContributing: true,
        hasCodeOfConduct: true,
        hasIssueTemplates: true,
        readmeLength: 3000,
        recentMergedPrs: 10,
      })
    );
  });

  describe("LABEL_GLOSSARY data validation", () => {
    it("contains valid, unique label entries with non-empty explanations", () => {
      expect(LABEL_GLOSSARY.length).toBeGreaterThanOrEqual(8);
      const seen = new Set<string>();
      for (const entry of LABEL_GLOSSARY) {
        const key = entry.label.trim().toLowerCase();
        expect(key.length).toBeGreaterThan(0);
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        expect(entry.explanation.trim().length).toBeGreaterThan(10);
      }
    });

    it("returns explanations for known labels and aliases, and null for unknown labels", () => {
      expect(getLabelExplanation("good first issue")).toContain("beginner-friendly");
      expect(getLabelExplanation("HELP WANTED")).toContain("community contributors");
      expect(getLabelExplanation("hacktoberfest")).toContain("Hacktoberfest");
      expect(getLabelExplanation("a11y")).toContain("screen readers");
      expect(getLabelExplanation("docs")).toContain("READMEs");
      expect(getLabelExplanation("unknown-custom-label-xyz")).toBeNull();
      expect(getLabelExplanation("")).toBeNull();
    });
  });

  describe("IssueCard label tooltips and help section", () => {
    const sampleIssue: IssueRecommendation = {
      id: 99,
      title: "Improve keyboard navigation",
      repository: "octocat/hello-world",
      url: "https://github.com/octocat/hello-world/issues/99",
      state: "open",
      labels: ["good first issue", "help wanted", "custom-internal-tag"],
      comments: 2,
      created_at: "2026-10-01T12:00:00Z",
      updated_at: "2026-10-05T15:00:00Z",
      language: "TypeScript",
      match_score: 90,
    };

    it("renders accessible tooltips for known labels and none for unknown labels", () => {
      render(<IssueCard issue={sampleIssue} theme="dark" />);

      // Known labels are focusable buttons with aria-describedby pointing to role="tooltip"
      const gfiButton = screen.getByRole("button", { name: "good first issue" });
      const gfiTooltipId = gfiButton.getAttribute("aria-describedby");
      expect(gfiTooltipId).toBeTruthy();
      const gfiTooltip = document.getElementById(gfiTooltipId!);
      expect(gfiTooltip).toHaveAttribute("role", "tooltip");
      expect(gfiTooltip).toHaveTextContent(/beginner-friendly/i);

      const hwButton = screen.getByRole("button", { name: "help wanted" });
      expect(hwButton.getAttribute("aria-describedby")).toBeTruthy();

      // Unknown label is a plain span with no tooltip button
      expect(screen.queryByRole("button", { name: "custom-internal-tag" })).toBeNull();
      expect(screen.getByText("custom-internal-tag")).toBeInTheDocument();
    });

    it("toggles the 'What do these labels mean?' help section", () => {
      render(<IssueCard issue={sampleIssue} theme="dark" />);

      expect(screen.queryByTestId("label-glossary-help-section")).toBeNull();

      const helpLink = screen.getByTestId("label-glossary-help-link");
      fireEvent.click(helpLink);

      expect(screen.getByTestId("label-glossary-help-section")).toBeInTheDocument();
      expect(screen.getByText("Common GitHub Labels")).toBeInTheDocument();

      fireEvent.click(helpLink);
      expect(screen.queryByTestId("label-glossary-help-section")).toBeNull();
    });
  });
});
