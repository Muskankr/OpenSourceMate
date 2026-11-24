import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SavedIssuesPage from "../app/saved/page";
import {
  saveIssue,
  clearAllSavedIssues,
} from "../utils/savedIssuesStorage";

describe("Saved Issues Page (Issue #419)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  const sampleIssue1 = {
    id: 101,
    title: "Implement dark mode for search input",
    repository: "facebook/react",
    url: "https://github.com/facebook/react/issues/101",
    language: "JavaScript",
    labels: ["good first issue"],
    comments: 2,
    status: "Interested" as const,
    note: "Check out component styles first",
  };

  const sampleIssue2 = {
    id: 102,
    title: "Add concurrency unit tests in Go",
    repository: "golang/go",
    url: "https://github.com/golang/go/issues/102",
    language: "Go",
    labels: ["help wanted"],
    comments: 5,
    status: "Working on it" as const,
    note: "Branch created locally",
  };

  it("displays empty state when no issues are saved", () => {
    render(<SavedIssuesPage />);

    expect(screen.getByTestId("empty-saved-issues")).toBeInTheDocument();
    expect(screen.getByText("No saved issues yet")).toBeInTheDocument();
    expect(screen.getByTestId("saved-count-badge")).toHaveTextContent("0 issues");
  });

  it("renders saved issues with repository, title, status, and private note", () => {
    saveIssue(sampleIssue1);
    saveIssue(sampleIssue2);

    render(<SavedIssuesPage />);

    expect(screen.getByText("facebook/react")).toBeInTheDocument();
    expect(screen.getByText("Implement dark mode for search input")).toBeInTheDocument();
    expect(screen.getByText("golang/go")).toBeInTheDocument();
    expect(screen.getByText("Add concurrency unit tests in Go")).toBeInTheDocument();

    const noteInputs = screen.getAllByTestId("saved-issue-note-input");
    expect(noteInputs.length).toBe(2);

    const statusSelects = screen.getAllByTestId("saved-issue-status-select");
    expect(statusSelects.length).toBe(2);
  });

  it("updates issue status and private note", () => {
    saveIssue(sampleIssue1);

    render(<SavedIssuesPage />);

    const statusSelect = screen.getByTestId("saved-issue-status-select");
    expect(statusSelect).toHaveValue("Interested");

    // Change status to Done
    fireEvent.change(statusSelect, { target: { value: "Done" } });
    expect(statusSelect).toHaveValue("Done");

    // Edit private note
    const noteInput = screen.getByTestId("saved-issue-note-input");
    fireEvent.change(noteInput, { target: { value: "Updated: ready for PR" } });
    fireEvent.blur(noteInput);

    expect(noteInput).toHaveValue("Updated: ready for PR");
  });

  it("filters saved issues by status tabs", () => {
    saveIssue(sampleIssue1); // Interested
    saveIssue(sampleIssue2); // Working on it

    render(<SavedIssuesPage />);

    // Click "Working on it" status filter
    const workingTab = screen.getByTestId("status-filter-working-on-it");
    fireEvent.click(workingTab);

    expect(screen.getByText("golang/go")).toBeInTheDocument();
    expect(screen.queryByText("facebook/react")).not.toBeInTheDocument();

    // Click "All" tab
    const allTab = screen.getByTestId("status-filter-all");
    fireEvent.click(allTab);

    expect(screen.getByText("facebook/react")).toBeInTheDocument();
    expect(screen.getByText("golang/go")).toBeInTheDocument();
  });

  it("filters saved issues by search query", () => {
    saveIssue(sampleIssue1);
    saveIssue(sampleIssue2);

    render(<SavedIssuesPage />);

    const searchInput = screen.getByTestId("saved-search-input");
    fireEvent.change(searchInput, { target: { value: "concurrency" } });

    expect(screen.getByText("Add concurrency unit tests in Go")).toBeInTheDocument();
    expect(screen.queryByText("Implement dark mode for search input")).not.toBeInTheDocument();
  });

  it("removes a single saved issue on clicking Remove", () => {
    saveIssue(sampleIssue1);

    render(<SavedIssuesPage />);
    expect(screen.getByText("facebook/react")).toBeInTheDocument();

    const removeBtn = screen.getByTestId("remove-saved-issue-button");
    fireEvent.click(removeBtn);

    expect(screen.queryByText("facebook/react")).not.toBeInTheDocument();
    expect(screen.getByTestId("empty-saved-issues")).toBeInTheDocument();
  });

  it("clears all saved issues with confirm dialog", () => {
    saveIssue(sampleIssue1);
    saveIssue(sampleIssue2);

    // Mock confirm dialog
    jest.spyOn(window, "confirm").mockReturnValue(true);

    render(<SavedIssuesPage />);
    expect(screen.getByTestId("saved-count-badge")).toHaveTextContent("2 issues");

    const clearAllBtn = screen.getByTestId("clear-all-saved-issues-button");
    fireEvent.click(clearAllBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByTestId("empty-saved-issues")).toBeInTheDocument();
  });

  it("exports saved issues as JSON", () => {
    saveIssue(sampleIssue1);

    // Mock URL.createObjectURL and revokeObjectURL
    const mockCreateObjectURL = jest.fn().mockReturnValue("blob:mock-url");
    const mockRevokeObjectURL = jest.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    render(<SavedIssuesPage />);

    const exportBtn = screen.getByTestId("export-saved-issues-button");
    fireEvent.click(exportBtn);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(screen.getByText(/Exported 1 saved issue successfully/i)).toBeInTheDocument();
  });
});
