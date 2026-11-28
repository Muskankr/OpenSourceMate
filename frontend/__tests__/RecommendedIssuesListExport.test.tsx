import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RecommendedIssuesList from "../components/RecommendedIssuesList";
import type { IssueRecommendation } from "../types/api";

jest.mock("../utils/exportRecommendations", () => {
  const actual = jest.requireActual("../utils/exportRecommendations");
  return {
    ...actual,
    exportRecommendationsData: jest.fn(),
  };
});

import { exportRecommendationsData } from "../utils/exportRecommendations";

describe("RecommendedIssuesList ExportMenu Integration (Issue #450)", () => {
  const mockIssues: IssueRecommendation[] = [
    {
      id: 1,
      title: "First issue",
      repository: "owner/repo1",
      url: "https://github.com/owner/repo1/issues/1",
      state: "open",
      labels: ["good first issue"],
      comments: 2,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      language: "TypeScript",
      difficulty: "beginner",
      match_score: 90,
    },
    {
      id: 2,
      title: "Second issue",
      repository: "owner/repo2",
      url: "https://github.com/owner/repo2/issues/2",
      state: "open",
      labels: ["bug"],
      comments: 0,
      created_at: "2026-01-03T00:00:00Z",
      updated_at: "2026-01-04T00:00:00Z",
      language: "Python",
      difficulty: "intermediate",
      match_score: 80,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders enabled Export button when results are present", () => {
    render(<RecommendedIssuesList issues={mockIssues} username="testuser" />);

    const exportButton = screen.getByRole("button", {
      name: /export recommendations as csv, markdown or json/i,
    });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).not.toBeDisabled();
  });

  it("disables Export button when issues list is empty", () => {
    render(<RecommendedIssuesList issues={[]} username="testuser" />);

    const exportButton = screen.getByRole("button", {
      name: /export recommendations as csv, markdown or json/i,
    });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toBeDisabled();
  });

  it("calls exportRecommendationsData with visible issues and active filters on format select", () => {
    render(<RecommendedIssuesList issues={mockIssues} username="testuser" />);

    const exportButton = screen.getByRole("button", {
      name: /export recommendations as csv, markdown or json/i,
    });
    fireEvent.click(exportButton);

    const csvOption = screen.getByRole("menuitem", {
      name: /csv spreadsheet \.csv/i,
    });
    fireEvent.click(csvOption);

    expect(exportRecommendationsData).toHaveBeenCalledTimes(1);
    const [callOptions, callFormat] = (exportRecommendationsData as jest.Mock).mock.calls[0];
    expect(callFormat).toBe("csv");
    expect(callOptions.username).toBe("testuser");
    expect(callOptions.issues).toHaveLength(2);
  });
});
