import React, { act } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DiscoverPage from "../app/discover/page";
import * as apiClient from "../utils/apiClient";
import type { DiscoveredRepository } from "../types/api";

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "lang" ? "Python" : null),
  }),
}));

jest.mock("../utils/apiClient", () => {
  const actual = jest.requireActual("../utils/apiClient");
  return {
    ...actual,
    fetchDiscoveredRepositories: jest.fn(),
  };
});

const mockFetchDiscovered = apiClient.fetchDiscoveredRepositories as jest.Mock;

const MOCK_REPOSITORIES: DiscoveredRepository[] = [
  {
    name: "fastapi",
    full_name: "tiangolo/fastapi",
    html_url: "https://github.com/tiangolo/fastapi",
    description: "FastAPI framework, high performance, easy to learn",
    stars: 75000,
    forks: 6000,
    language: "Python",
    open_issues_count: 120,
    good_first_issues_count: 8,
    has_contributing: true,
    has_code_of_conduct: true,
    last_activity_at: "2026-11-20T10:00:00Z",
    newcomer_friendliness_score: 100,
    newcomer_friendliness_tier: "Very Welcoming",
    score_breakdown: {
      beginner_issues_points: 30,
      recent_activity_points: 25,
      contributing_points: 25,
      code_of_conduct_points: 20,
      total_score: 100,
    },
  },
  {
    name: "flask",
    full_name: "pallets/flask",
    html_url: "https://github.com/pallets/flask",
    description: "The Python micro framework",
    stars: 68000,
    forks: 16000,
    language: "Python",
    open_issues_count: 45,
    good_first_issues_count: 3,
    has_contributing: true,
    has_code_of_conduct: false,
    last_activity_at: "2026-11-15T08:00:00Z",
    newcomer_friendliness_score: 72,
    newcomer_friendliness_tier: "Welcoming",
    score_breakdown: {
      beginner_issues_points: 22,
      recent_activity_points: 25,
      contributing_points: 25,
      code_of_conduct_points: 0,
      total_score: 72,
    },
  },
];

describe("Discover Page (Issue #447)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders page header and welcoming repositories ranked by score", async () => {
    mockFetchDiscovered.mockResolvedValueOnce({
      repositories: MOCK_REPOSITORIES,
      total_count: 2,
      languages: ["Python"],
      selected_language: "Python",
    });

    render(<DiscoverPage />);

    expect(screen.getByText(/Discover Welcoming Repositories/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("tiangolo/fastapi")).toBeInTheDocument();
      expect(screen.getByText("pallets/flask")).toBeInTheDocument();
    });

    // Score checks
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Very Welcoming")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Welcoming")).toBeInTheDocument();

    // Signal breakdown presence
    expect(screen.getByText(/8 beginner issues/i)).toBeInTheDocument();
    expect(screen.getByText(/3 beginner issues/i)).toBeInTheDocument();
  });

  it("triggers re-fetch when user clicks another language filter", async () => {
    mockFetchDiscovered
      .mockResolvedValueOnce({
        repositories: MOCK_REPOSITORIES,
        total_count: 2,
        languages: ["Python"],
        selected_language: "Python",
      })
      .mockResolvedValueOnce({
        repositories: [],
        total_count: 0,
        languages: ["TypeScript"],
        selected_language: "TypeScript",
      });

    render(<DiscoverPage />);

    await waitFor(() => {
      expect(screen.getByText("tiangolo/fastapi")).toBeInTheDocument();
    });

    // Click 'TypeScript' language button
    const tsButton = screen.getByRole("button", { name: "TypeScript" });
    await act(async () => {
      fireEvent.click(tsButton);
    });

    await waitFor(() => {
      expect(mockFetchDiscovered).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "TypeScript",
        })
      );
    });
  });

  it("shows helpful empty state message with reset button when no results match", async () => {
    mockFetchDiscovered.mockResolvedValueOnce({
      repositories: [],
      total_count: 0,
      languages: ["Python"],
    });

    render(<DiscoverPage />);

    await waitFor(() => {
      expect(screen.getByTestId("discover-empty-state")).toBeInTheDocument();
      expect(
        screen.getByText(/No repositories found matching your filters/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reset Filters/i })).toBeInTheDocument();
    });

    // Clicking reset triggers reload with 'All'
    const resetBtn = screen.getByRole("button", { name: /Reset Filters/i });
    await act(async () => {
      fireEvent.click(resetBtn);
    });
  });

  it("displays RateLimitBanner with existing friendly message on 429 error", async () => {
    const rateLimitError = new apiClient.ApiClientError(
      "GitHub rate limit reached",
      429,
      "RATE_LIMIT_EXCEEDED"
    );
    mockFetchDiscovered.mockRejectedValueOnce(rateLimitError);

    render(<DiscoverPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/Rate Limit Exceeded/i)).toBeInTheDocument();
      expect(
        screen.getByText(/GitHub API rate limit reached/i)
      ).toBeInTheDocument();
    });
  });
});
