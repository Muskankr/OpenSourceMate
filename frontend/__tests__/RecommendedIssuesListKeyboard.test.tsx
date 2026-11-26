import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RecommendedIssuesList from "../components/RecommendedIssuesList";
import type { IssueRecommendation } from "../types/api";

const mockIssues: IssueRecommendation[] = [
  {
    id: 1,
    title: "Support keyboard shortcuts",
    repository: "octocat/hello-world",
    url: "https://github.com/octocat/hello-world/issues/1",
    state: "open",
    labels: ["good first issue"],
    comments: 0,
    created_at: "2026-11-20T10:00:00Z",
    updated_at: "2026-11-20T10:00:00Z",
    language: "TypeScript",
    match_score: 95,
  },
  {
    id: 2,
    title: "Add responsiveness badge",
    repository: "pallets/flask",
    url: "https://github.com/pallets/flask/issues/2",
    state: "open",
    labels: ["good first issue"],
    comments: 2,
    created_at: "2026-11-20T10:00:00Z",
    updated_at: "2026-11-20T10:00:00Z",
    language: "Python",
    match_score: 85,
  },
];

describe("RecommendedIssuesList - Keyboard Navigation (Issue #449)", () => {
  let originalOpen: typeof window.open;

  beforeEach(() => {
    originalOpen = window.open;
    window.open = jest.fn();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.open = originalOpen;
    jest.clearAllMocks();
  });

  it("navigates issue cards with 'j' and 'k', updating aria-current and outline", () => {
    render(<RecommendedIssuesList issues={mockIssues} />);

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2);
    expect(articles[0]).not.toHaveAttribute("aria-current");
    expect(articles[1]).not.toHaveAttribute("aria-current");

    // Press 'j' -> moves to first card
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    expect(articles[0]).toHaveAttribute("aria-current", "true");
    expect(articles[0]).toHaveAttribute("data-focused", "true");
    expect(articles[1]).not.toHaveAttribute("aria-current");

    // Press 'j' again -> moves to second card
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    expect(articles[0]).not.toHaveAttribute("aria-current");
    expect(articles[1]).toHaveAttribute("aria-current", "true");
    expect(articles[1]).toHaveAttribute("data-focused", "true");

    // Press 'k' -> moves back to first card
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    });
    expect(articles[0]).toHaveAttribute("aria-current", "true");
    expect(articles[1]).not.toHaveAttribute("aria-current");
  });

  it("announces selected card to screen readers via live region", () => {
    render(<RecommendedIssuesList issues={mockIssues} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });

    const liveRegion = screen.getByText(/Selected issue 1 of 2: Support keyboard shortcuts/i);
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
  });

  it("opens focused issue in new tab with 'o' and 'Enter'", () => {
    render(<RecommendedIssuesList issues={mockIssues} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });

    // Press 'o'
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "o" }));
    });
    expect(window.open).toHaveBeenCalledWith(
      mockIssues[0].url,
      "_blank",
      "noopener,noreferrer"
    );

    // Press 'j' to move to second issue and press 'Enter'
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });
    expect(window.open).toHaveBeenCalledWith(
      mockIssues[1].url,
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("opens keyboard shortcuts dialog with '?' and closes with Escape", () => {
    render(<RecommendedIssuesList issues={mockIssues} />);

    expect(screen.queryByTestId("keyboard-shortcuts-dialog")).not.toBeInTheDocument();

    // Press '?'
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });

    expect(screen.getByTestId("keyboard-shortcuts-dialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Move to next recommended issue card")).toBeInTheDocument();

    // Press 'Escape' -> closes dialog
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(screen.queryByTestId("keyboard-shortcuts-dialog")).not.toBeInTheDocument();
  });

  it("does not navigate or open cards while typing in search filter input", () => {
    render(<RecommendedIssuesList issues={mockIssues} />);

    const searchInput = screen.getByPlaceholderText("Title or repo...");
    searchInput.focus();

    act(() => {
      fireEvent.keyDown(searchInput, { key: "j" });
      fireEvent.keyDown(searchInput, { key: "k" });
      fireEvent.keyDown(searchInput, { key: "o" });
      fireEvent.keyDown(searchInput, { key: "?" });
    });

    const articles = screen.getAllByRole("article");
    expect(articles[0]).not.toHaveAttribute("aria-current");
    expect(articles[1]).not.toHaveAttribute("aria-current");
    expect(window.open).not.toHaveBeenCalled();
    expect(screen.queryByTestId("keyboard-shortcuts-dialog")).not.toBeInTheDocument();
  });
});
