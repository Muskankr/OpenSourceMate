import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import RecommendedIssuesList from "../components/RecommendedIssuesList";
import type { IssueRecommendation } from "../types/api";

function makeIssue(
  id: number,
  repository: string,
  title: string,
  score: number = 80
): IssueRecommendation {
  return {
    id,
    title,
    repository,
    url: `https://github.com/${repository}/issues/${id}`,
    state: "open",
    labels: ["good first issue"],
    comments: 1,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-20T00:00:00Z",
    language: "TypeScript",
    match_score: score,
    score,
  };
}

describe("RecommendedIssuesList Repository Diversity Cap UI (#446)", () => {
  const sampleIssues: IssueRecommendation[] = [
    makeIssue(1, "facebook/react", "React Issue 1 (Highest)", 95),
    makeIssue(2, "facebook/react", "React Issue 2 (High)", 90),
    makeIssue(3, "vercel/next.js", "Next.js Issue 1", 88),
    makeIssue(4, "facebook/react", "React Issue 3 (Medium)", 85),
    makeIssue(5, "facebook/react", "React Issue 4 (Capped 1)", 80),
    makeIssue(6, "facebook/react", "React Issue 5 (Capped 2)", 75),
    makeIssue(7, "vercel/next.js", "Next.js Issue 2", 70),
  ];

  it("applies default cap of 3 per repository and hides excess issues", () => {
    render(<RecommendedIssuesList issues={sampleIssues} theme="dark" />);

    // React has 5 issues total; default cap is 3
    // Visible: React Issue 1, 2, 3, and Next.js 1, 2 (Total 5 visible)
    expect(screen.getByText("React Issue 1 (Highest)")).toBeInTheDocument();
    expect(screen.getByText("React Issue 2 (High)")).toBeInTheDocument();
    expect(screen.getByText("React Issue 3 (Medium)")).toBeInTheDocument();
    expect(screen.getByText("Next.js Issue 1")).toBeInTheDocument();
    expect(screen.getByText("Next.js Issue 2")).toBeInTheDocument();

    // Issues 4 and 5 from React should NOT be visible by default
    expect(screen.queryByText("React Issue 4 (Capped 1)")).not.toBeInTheDocument();
    expect(screen.queryByText("React Issue 5 (Capped 2)")).not.toBeInTheDocument();

    // Showing count should reflect capped count
    expect(screen.getByText("Showing 5 of 7 issues")).toBeInTheDocument();
  });

  it("shows 'more from this repository' expand button for capped repositories", () => {
    render(<RecommendedIssuesList issues={sampleIssues} theme="dark" />);

    // More from this repository link should be visible for facebook/react
    const expandBtn = screen.getByRole("button", {
      name: /more from this repository \(2 more\)/i,
    });
    expect(expandBtn).toBeInTheDocument();
    expect(expandBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("expands hidden issues when clicking 'more from this repository'", () => {
    render(<RecommendedIssuesList issues={sampleIssues} theme="dark" />);

    const expandBtn = screen.getByRole("button", {
      name: /more from this repository \(2 more\)/i,
    });

    // Click to expand
    fireEvent.click(expandBtn);

    // Now all 5 issues from facebook/react should be in the document
    expect(screen.getByText("React Issue 4 (Capped 1)")).toBeInTheDocument();
    expect(screen.getByText("React Issue 5 (Capped 2)")).toBeInTheDocument();

    // Button should now show collapse action
    expect(
      screen.getByRole("button", { name: /Show fewer from facebook\/react/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Show fewer from facebook\/react/i })
    ).toHaveAttribute("aria-expanded", "true");

    // Click to collapse again
    fireEvent.click(screen.getByRole("button", { name: /Show fewer from facebook\/react/i }));
    expect(screen.queryByText("React Issue 4 (Capped 1)")).not.toBeInTheDocument();
    expect(screen.queryByText("React Issue 5 (Capped 2)")).not.toBeInTheDocument();
  });

  it("updates diversity cap when changing the 'Max Per Repo' selector", () => {
    render(<RecommendedIssuesList issues={sampleIssues} theme="dark" />);

    const capSelect = screen.getByTestId("repo-diversity-cap-filter");
    expect(capSelect).toHaveValue("3");

    // Change cap to 1
    fireEvent.change(capSelect, { target: { value: "1" } });

    // Only 1 from React and 1 from Next.js should be shown
    expect(screen.getByText("React Issue 1 (Highest)")).toBeInTheDocument();
    expect(screen.queryByText("React Issue 2 (High)")).not.toBeInTheDocument();
    expect(screen.getByText("Next.js Issue 1")).toBeInTheDocument();
    expect(screen.queryByText("Next.js Issue 2")).not.toBeInTheDocument();

    expect(screen.getByText("Showing 2 of 7 issues")).toBeInTheDocument();

    // Change cap to 0 (no limit)
    fireEvent.change(capSelect, { target: { value: "0" } });
    expect(screen.getByText("Showing 7 of 7 issues")).toBeInTheDocument();
    expect(screen.getByText("React Issue 5 (Capped 2)")).toBeInTheDocument();
  });
});
