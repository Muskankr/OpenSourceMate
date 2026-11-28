import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import RecommendedIssuesList from "../components/RecommendedIssuesList";
import { MOCK_RECOMMENDED_ISSUES } from "../data/mockIssues";

describe("Recommended Issues Keyword Search & URL Sync (Issue #474)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    window.history.replaceState(null, "", "/");
  });

  it("filters issues immediately by title, repository, and labels (case-insensitive) and shows result count", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    const searchInput = screen.getByLabelText(/Filter issues by title, repository, or labels/i);

    // Match by label ("accessibility")
    fireEvent.change(searchInput, { target: { value: "ACCESSIBILITY" } });
    expect(
      screen.getByText(`Showing 1 of ${MOCK_RECOMMENDED_ISSUES.length} issues`)
    ).toBeInTheDocument();
    expect(screen.getByText(/vercel\/next\.js/i)).toBeInTheDocument();

    // Match by repository ("tiangolo/fastapi")
    fireEvent.change(searchInput, { target: { value: "tiangolo" } });
    expect(
      screen.getByText(`Showing 1 of ${MOCK_RECOMMENDED_ISSUES.length} issues`)
    ).toBeInTheDocument();
    expect(screen.getByText(/tiangolo\/fastapi/i)).toBeInTheDocument();

    // Clear button resets search and restores full count
    const clearBtn = screen.getByTestId("clear-issue-search-button");
    fireEvent.click(clearBtn);
    expect(
      screen.getByText(
        `Showing ${MOCK_RECOMMENDED_ISSUES.length} of ${MOCK_RECOMMENDED_ISSUES.length} issues`
      )
    ).toBeInTheDocument();
  });

  it("shows a helpful empty-state message when no issues match", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    const searchInput = screen.getByLabelText(/Filter issues by title, repository, or labels/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent-keyword-xyz" } });

    expect(screen.getByTestId("filter-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No issues match your filters")).toBeInTheDocument();
  });

  it("syncs keyword filter to URL query string (debounced) and restores it on reload", () => {
    const replaceStateSpy = jest.spyOn(window.history, "replaceState");

    const { unmount } = render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    const searchInput = screen.getByLabelText(/Filter issues by title, repository, or labels/i);
    fireEvent.change(searchInput, { target: { value: "docs" } });

    // Advance debounce timer (150ms)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/?q=docs");

    // Simulate reload by unmounting and remounting with ?q=docs in URL
    unmount();
    window.history.replaceState(null, "", "/?q=docs");

    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);
    const restoredInput = screen.getByLabelText(
      /Filter issues by title, repository, or labels/i
    ) as HTMLInputElement;
    expect(restoredInput.value).toBe("docs");
    expect(
      screen.getByText(`Showing 1 of ${MOCK_RECOMMENDED_ISSUES.length} issues`)
    ).toBeInTheDocument();

    replaceStateSpy.mockRestore();
  });
});
