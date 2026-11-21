import React from "react";
import { render, screen } from "@testing-library/react";
import FriendlinessBadge from "../components/FriendlinessBadge";
import {
  calculateFriendlinessScore,
  setCachedFriendlinessScore,
  clearFriendlinessCache,
} from "../utils/repoFriendliness";

describe("FriendlinessBadge Component", () => {
  beforeEach(() => {
    clearFriendlinessCache();
  });

  it("renders Very Welcoming badge with score and accessible label", () => {
    const customResult = calculateFriendlinessScore("vercel/next.js", {
      hasContributing: true,
      hasCodeOfConduct: true,
      hasIssueTemplates: true,
      readmeLength: 3500,
      recentMergedPrs: 15,
    });

    render(
      <FriendlinessBadge
        repository="vercel/next.js"
        friendlinessResult={customResult}
        theme="dark"
      />
    );

    const badge = screen.getByTestId("friendliness-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("100 Very Welcoming");
    expect(badge).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Repository Friendliness: 100 out of 100 (Very Welcoming)")
    );
  });

  it("renders breakdown popover with all 5 signals and points", () => {
    const customResult = calculateFriendlinessScore("facebook/react", {
      hasContributing: true,
      hasCodeOfConduct: true,
      hasIssueTemplates: false,
      readmeLength: 1200,
      recentMergedPrs: 2,
    });

    render(
      <FriendlinessBadge
        repository="facebook/react"
        friendlinessResult={customResult}
        theme="light"
      />
    );

    const breakdown = screen.getByTestId("friendliness-breakdown");
    expect(breakdown).toBeInTheDocument();
    expect(breakdown).toHaveAttribute("role", "tooltip");

    // Check each of the 5 signals in breakdown
    expect(screen.getByTestId("signal-contributing")).toHaveTextContent("CONTRIBUTING Guide");
    expect(screen.getByTestId("signal-contributing")).toHaveTextContent("+25/25");

    expect(screen.getByTestId("signal-code_of_conduct")).toHaveTextContent("Code of Conduct");
    expect(screen.getByTestId("signal-code_of_conduct")).toHaveTextContent("+20/20");

    expect(screen.getByTestId("signal-issue_templates")).toHaveTextContent("Issue & PR Templates");
    expect(screen.getByTestId("signal-issue_templates")).toHaveTextContent("+0/15");

    expect(screen.getByTestId("signal-readme_length")).toHaveTextContent("README Documentation");
    expect(screen.getByTestId("signal-readme_length")).toHaveTextContent("+12/20");

    expect(screen.getByTestId("signal-recent_merged_prs")).toHaveTextContent(
      "Recent Merged Pull Requests"
    );
    expect(screen.getByTestId("signal-recent_merged_prs")).toHaveTextContent("+12/20");
  });

  it("renders Challenging tier badge when repository has no signals", () => {
    const emptyResult = calculateFriendlinessScore("unknown/bare-repo", {});

    render(
      <FriendlinessBadge
        repository="unknown/bare-repo"
        friendlinessResult={emptyResult}
        theme="dark"
      />
    );

    const badge = screen.getByTestId("friendliness-badge");
    expect(badge).toHaveTextContent("0 Challenging");
  });

  it("synchronously displays cached friendliness score without layout shift", () => {
    const cachedResult = calculateFriendlinessScore("cached/fast-repo", {
      hasContributing: true,
      hasCodeOfConduct: true,
      hasIssueTemplates: true,
      readmeLength: 3000,
      recentMergedPrs: 8,
    });
    setCachedFriendlinessScore("cached/fast-repo", cachedResult);

    render(<FriendlinessBadge repository="cached/fast-repo" theme="dark" />);

    const badge = screen.getByTestId("friendliness-badge");
    expect(badge).toHaveTextContent("100 Very Welcoming");
  });
});
