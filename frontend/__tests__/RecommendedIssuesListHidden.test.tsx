import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RecommendedIssuesList from "../components/RecommendedIssuesList";
import type { IssueRecommendation } from "../types/api";

const mockIssues: IssueRecommendation[] = [
  {
    id: 101,
    title: "Add timeout handler",
    repository: "octocat/hello-world",
    url: "https://github.com/octocat/hello-world/issues/101",
    state: "open",
    labels: ["good first issue"],
    comments: 2,
    created_at: "2026-11-20T10:00:00Z",
    updated_at: "2026-11-20T10:00:00Z",
    language: "Python",
    match_score: 95,
  },
  {
    id: 102,
    title: "Improve documentation",
    repository: "pallets/flask",
    url: "https://github.com/pallets/flask/issues/102",
    state: "open",
    labels: ["documentation"],
    comments: 5,
    created_at: "2026-11-20T10:00:00Z",
    updated_at: "2026-11-20T10:00:00Z",
    language: "Python",
    match_score: 80,
  },
];

beforeEach(() => {
  window.localStorage.clear();
});

describe("RecommendedIssuesList - Not Interested & Hidden Issues (Issue #448)", () => {
  it("hides issue on clicking 'Not interested' and shows 'Hidden (1)' control bar", () => {
    render(<RecommendedIssuesList issues={mockIssues} />);

    // Both issues are initially visible
    expect(screen.getByText("Add timeout handler")).toBeInTheDocument();
    expect(screen.getByText("Improve documentation")).toBeInTheDocument();
    expect(screen.queryByTestId("hidden-issues-control-bar")).not.toBeInTheDocument();

    // Click 'Not interested' on the first issue
    const notInterestedButtons = screen.getAllByRole("button", { name: /Not interested/i });
    fireEvent.click(notInterestedButtons[0]);

    // Issue #101 is now hidden
    expect(screen.queryByText("Add timeout handler")).not.toBeInTheDocument();
    expect(screen.getByText("Improve documentation")).toBeInTheDocument();

    // 'Hidden (1)' control bar is now displayed
    expect(screen.getByTestId("hidden-issues-control-bar")).toBeInTheDocument();
    expect(screen.getByText(/Hidden \(1\)/i)).toBeInTheDocument();
  });

  it("toggles reviewing hidden issues and allows restoring via 'Undo'", () => {
    render(<RecommendedIssuesList issues={mockIssues} />);

    // Hide issue #101
    const notInterestedButtons = screen.getAllByRole("button", { name: /Not interested/i });
    fireEvent.click(notInterestedButtons[0]);

    // Toggle 'Hidden (1)' to review
    const toggleHiddenBtn = screen.getByText(/Hidden \(1\)/i);
    fireEvent.click(toggleHiddenBtn);

    // Issue #101 is now visible in review mode with 'Undo' action
    expect(screen.getByText("Add timeout handler")).toBeInTheDocument();
    const undoButton = screen.getByRole("button", { name: "Undo" });
    expect(undoButton).toBeInTheDocument();

    // Click 'Undo' to restore
    fireEvent.click(undoButton);

    // Both are visible and control bar disappears
    expect(screen.getByText("Add timeout handler")).toBeInTheDocument();
    expect(screen.getByText("Improve documentation")).toBeInTheDocument();
    expect(screen.queryByTestId("hidden-issues-control-bar")).not.toBeInTheDocument();
  });

  it("restores all hidden issues when clicking 'Clear all'", () => {
    render(<RecommendedIssuesList issues={mockIssues} />);

    // Hide both issues
    const btn1 = screen.getAllByRole("button", { name: /Not interested/i })[0];
    fireEvent.click(btn1);

    const btn2 = screen.getAllByRole("button", { name: /Not interested/i })[0];
    fireEvent.click(btn2);

    expect(screen.getByText(/Hidden \(2\)/i)).toBeInTheDocument();

    // Click 'Clear all'
    const clearAllBtn = screen.getByRole("button", { name: /Clear all/i });
    fireEvent.click(clearAllBtn);

    // Both issues are restored and control bar disappears
    expect(screen.getByText("Add timeout handler")).toBeInTheDocument();
    expect(screen.getByText("Improve documentation")).toBeInTheDocument();
    expect(screen.queryByTestId("hidden-issues-control-bar")).not.toBeInTheDocument();
  });
});
