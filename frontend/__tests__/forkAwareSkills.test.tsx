import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../app/page";
import * as apiClient from "../utils/apiClient";

jest.mock("../utils/apiClient");

describe("Fork-aware skills detection and toggle in Home page", () => {
  const mockFetchUserProfile = apiClient.fetchUserProfile as jest.MockedFunction<
    typeof apiClient.fetchUserProfile
  >;
  const mockFetchUserSkills = apiClient.fetchUserSkills as jest.MockedFunction<
    typeof apiClient.fetchUserSkills
  >;
  const mockFetchMatchedIssues = apiClient.fetchMatchedIssues as jest.MockedFunction<
    typeof apiClient.fetchMatchedIssues
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchUserProfile.mockResolvedValue({
      username: "forks-dev",
      name: "Forks Developer",
      bio: "Tests fork-aware detection",
      avatar_url: "https://example.com/avatar.png",
      public_repositories: 10,
      followers: 5,
      following: 2,
      profile_url: "https://github.com/forks-dev",
    });

    mockFetchUserSkills.mockImplementation(async (username, options) => {
      if (options?.includeForks) {
        return {
          username: "forks-dev",
          total_repositories_analyzed: 5,
          excluded_forks_count: 0,
          skills: [
            { name: "TypeScript", repository_count: 3, percentage: 60 },
            { name: "Go", repository_count: 2, percentage: 40 },
          ],
        };
      }
      return {
        username: "forks-dev",
        total_repositories_analyzed: 3,
        excluded_forks_count: 2,
        skills: [{ name: "TypeScript", repository_count: 3, percentage: 100 }],
      };
    });

    mockFetchMatchedIssues.mockResolvedValue({
      total: 0,
      issues: [],
    });
  });

  it("displays excluded forks count and allows toggling include all forks", async () => {
    render(<Home />);

    // Type username and click Analyze Profile
    const input = screen.getByPlaceholderText(/enter your github username/i);
    fireEvent.change(input, { target: { value: "forks-dev" } });
    const analyzeButton = screen.getByRole("button", { name: /analyze profile/i });
    fireEvent.click(analyzeButton);

    // Expect skills analysis to display excluded forks
    await waitFor(() => {
      expect(screen.getByTestId("excluded-forks-count")).toBeInTheDocument();
    });

    expect(screen.getByText("2 forks excluded")).toBeInTheDocument();
    const toggle = screen.getByTestId("include-all-forks-toggle") as HTMLInputElement;
    expect(toggle).toBeInTheDocument();
    expect(toggle.checked).toBe(false);

    // Toggle include all forks
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockFetchUserSkills).toHaveBeenCalledWith(
        "forks-dev",
        expect.objectContaining({ includeForks: true })
      );
    });

    // When included, excluded forks count should update to 0
    await waitFor(() => {
      expect(screen.getByText("0 forks excluded")).toBeInTheDocument();
    });
  });
});
