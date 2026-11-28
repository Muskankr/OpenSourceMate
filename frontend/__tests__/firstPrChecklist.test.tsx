import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  extractIssueNumber,
  buildChecklistLinks,
  buildGitCommands,
  buildFirstPrSteps,
  getChecklistStorageKey,
} from "../utils/firstPrChecklist";
import FirstPrChecklistPanel from "../components/FirstPrChecklistPanel";
import type { IssueRecommendation } from "../types/api";

const sampleIssue: IssueRecommendation = {
  id: 42,
  title: "Fix keyboard focus ring on button",
  repository: "vercel/next.js",
  url: "https://github.com/vercel/next.js/issues/42",
  state: "open",
  labels: ["good first issue"],
  comments: 3,
  created_at: "2026-10-15T10:00:00Z",
  updated_at: "2026-10-28T14:30:00Z",
  language: "TypeScript",
  match_score: 94,
};

describe("First PR Checklist Utilities & Panel (Issue #475)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("command and link generation", () => {
    it("extracts issue number from GitHub URL and falls back to id", () => {
      expect(extractIssueNumber("https://github.com/vercel/next.js/issues/1234", 1)).toBe(1234);
      expect(extractIssueNumber("https://example.com/custom", 99)).toBe(99);
    });

    it("builds repository links including CONTRIBUTING.md when present and #new_comment_field", () => {
      const links = buildChecklistLinks(
        "vercel/next.js",
        "https://github.com/vercel/next.js/issues/42",
        true
      );
      expect(links.contributingUrl).toBe(
        "https://github.com/vercel/next.js/blob/HEAD/CONTRIBUTING.md"
      );
      expect(links.forkUrl).toBe("https://github.com/vercel/next.js/fork");
      expect(links.issueUrl).toBe("https://github.com/vercel/next.js/issues/42");
      expect(links.issueCommentUrl).toBe(
        "https://github.com/vercel/next.js/issues/42#new_comment_field"
      );
    });

    it("omits contributingUrl when hasContributing is false", () => {
      const links = buildChecklistLinks(
        "octocat/no-contrib",
        "https://github.com/octocat/no-contrib/issues/7",
        false
      );
      expect(links.contributingUrl).toBeNull();
    });

    it("generates copyable git commands pre-filled with repo name and issue number", () => {
      const cmds = buildGitCommands("vercel/next.js", 42);
      expect(cmds.cloneAndBranch).toContain("next.js.git");
      expect(cmds.cloneAndBranch).toContain("cd next.js");
      expect(cmds.cloneAndBranch).toContain("git checkout -b fix/issue-42");

      expect(cmds.commitAndPush).toContain('git commit -m "fix: resolve #42"');
      expect(cmds.commitAndPush).toContain("git push -u origin fix/issue-42");
    });

    it("hides the CONTRIBUTING step when hasContributing is false", () => {
      const stepsWith = buildFirstPrSteps({
        repository: "vercel/next.js",
        issueUrl: "https://github.com/vercel/next.js/issues/42",
        hasContributing: true,
      });
      const stepsWithout = buildFirstPrSteps({
        repository: "vercel/next.js",
        issueUrl: "https://github.com/vercel/next.js/issues/42",
        hasContributing: false,
      });

      expect(stepsWith.some((s) => s.id === "read-contributing")).toBe(true);
      expect(stepsWithout.some((s) => s.id === "read-contributing")).toBe(false);
      expect(stepsWithout.some((s) => s.id === "ask-assigned")).toBe(true);
    });
  });

  describe("FirstPrChecklistPanel component", () => {
    it("expands on click, persists checked steps in localStorage per issue, and copies commands", async () => {
      const writeTextMock = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

      const { unmount } = render(
        <FirstPrChecklistPanel issue={sampleIssue} hasContributing={true} />
      );

      expect(screen.queryByTestId("first-pr-checklist-panel")).toBeNull();

      // Open panel
      fireEvent.click(screen.getByTestId("start-contributing-toggle"));
      expect(screen.getByTestId("first-pr-checklist-panel")).toBeInTheDocument();
      expect(screen.getByTestId("checklist-progress")).toHaveTextContent("0 of 5 completed");

      // Tick off "Ask to be assigned"
      const askCheckbox = screen.getByLabelText("Ask to be assigned");
      fireEvent.click(askCheckbox);
      expect(screen.getByTestId("checklist-progress")).toHaveTextContent("1 of 5 completed");

      // Verify localStorage persistence
      const saved = JSON.parse(
        window.localStorage.getItem(getChecklistStorageKey("vercel/next.js", 42)) || "{}"
      );
      expect(saved["ask-assigned"]).toBe(true);

      // Copy git command
      fireEvent.click(screen.getByTestId("copy-cmd-fork-and-branch"));
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining("git checkout -b fix/issue-42")
      );

      // Remount and verify persisted state
      unmount();
      render(<FirstPrChecklistPanel issue={sampleIssue} hasContributing={true} />);
      fireEvent.click(screen.getByTestId("start-contributing-toggle"));
      expect(screen.getByTestId("checklist-progress")).toHaveTextContent("1 of 5 completed");
      expect(screen.getByLabelText("Ask to be assigned")).toBeChecked();
    });
  });
});
