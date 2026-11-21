import React from "react";
import { render, screen } from "@testing-library/react";
import IssueCard from "../components/IssueCard";
import type { IssueRecommendation } from "../types/api";

describe("IssueCard Component", () => {
  const sampleIssue: IssueRecommendation = {
    id: 42,
    title: "Implement automatic retry for network errors in API client",
    repository: "octocat/hello-world",
    url: "https://github.com/octocat/hello-world/issues/42",
    state: "open",
    labels: ["good first issue", "enhancement", "typescript"],
    comments: 5,
    created_at: "2026-10-01T12:00:00Z",
    updated_at: "2026-10-05T15:00:00Z",
    language: "TypeScript",
    match_score: 88,
    match_reasons: ["Matched skill: TypeScript", "Repository matches recent contributions"],
    explanation: "This issue fits your experience with client-side error handling.",
    difficulty: "Beginner",
  };

  it("renders issue title, repository name, language, and comments count", () => {
    render(<IssueCard issue={sampleIssue} theme="dark" />);

    expect(screen.getByText("octocat/hello-world")).toBeInTheDocument();
    expect(
      screen.getByText("Implement automatic retry for network errors in API client")
    ).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("5 comments")).toBeInTheDocument();
  });

  it("displays the difficulty badge correctly", () => {
    render(<IssueCard issue={sampleIssue} theme="dark" />);

    const diffBadge = screen.getByTestId("difficulty-badge");
    expect(diffBadge).toBeInTheDocument();
    expect(diffBadge).toHaveTextContent("Beginner");
  });

  it("infers difficulty when not explicitly provided", () => {
    const issueWithoutDiff: IssueRecommendation = {
      ...sampleIssue,
      difficulty: undefined,
      labels: ["performance", "core"],
    };

    render(<IssueCard issue={issueWithoutDiff} theme="dark" />);

    const diffBadge = screen.getByTestId("difficulty-badge");
    expect(diffBadge).toHaveTextContent("Advanced");
  });

  it("displays match score and match reasons", () => {
    render(<IssueCard issue={sampleIssue} theme="dark" />);

    const scoreBadge = screen.getByTestId("match-score-badge");
    expect(scoreBadge).toHaveTextContent("88%");

    expect(screen.getByText("Matched skill: TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Repository matches recent contributions")).toBeInTheDocument();
  });

  it("displays the demo data badge when isMock is true", () => {
    render(<IssueCard issue={sampleIssue} isMock={true} />);

    const demoBadge = screen.getByTestId("demo-data-badge");
    expect(demoBadge).toBeInTheDocument();
    expect(demoBadge).toHaveTextContent("Demo Data");
  });

  it("hides the demo data badge when isMock is false", () => {
    render(<IssueCard issue={{ ...sampleIssue, is_mock: false }} isMock={false} />);

    expect(screen.queryByTestId("demo-data-badge")).not.toBeInTheDocument();
  });

  it("renders accessible GitHub link with proper aria-label and target blank", () => {
    render(<IssueCard issue={sampleIssue} />);

    const link = screen.getByRole("link", {
      name: /Open issue "Implement automatic retry for network errors in API client" on GitHub in a new tab/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://github.com/octocat/hello-world/issues/42");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("pre-fills wrong-match feedback with only public recommendation details", () => {
    const issue = {
      ...sampleIssue,
      url: "https://github.com/octocat/hello-world/issues/42?tab=comments&sort=asc",
      match_score: 87.6,
    };
    render(<IssueCard issue={issue} username="octo cat" />);

    const link = screen.getByRole("link", {
      name: /Report wrong match for .* on GitHub in a new tab/i,
    });
    const url = new URL(link.getAttribute("href")!);
    expect(url.origin + url.pathname).toBe("https://github.com/Muskankr/OpenSourceMate/issues/new");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      template: "wrong_match.yml",
      username: "octo cat",
      issue_url: issue.url,
      match_score: "88",
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders Learning Mode badge and tailored explanation for learning issues", () => {
    const learningIssue: IssueRecommendation = {
      ...sampleIssue,
      is_learning_mode: true,
      learning_skill: "Rust",
      explanation:
        "Picked for Learning Mode: beginner-friendly starter issue to help you learn and grow into Rust.",
    };

    render(<IssueCard issue={learningIssue} theme="dark" />);

    const learningBadge = screen.getByTestId("learning-mode-badge");
    expect(learningBadge).toBeInTheDocument();
    expect(learningBadge).toHaveTextContent("Learning: Rust");

    expect(screen.getByText("Why this is recommended for you (Learning Mode)")).toBeInTheDocument();
    expect(
      screen.getByText(/beginner-friendly starter issue to help you learn and grow into Rust/i)
    ).toBeInTheDocument();
  });
});
