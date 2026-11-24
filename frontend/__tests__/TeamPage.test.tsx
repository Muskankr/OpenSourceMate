import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TeamPage from "../app/team/page";
import * as apiClient from "../utils/apiClient";

jest.mock("../utils/apiClient", () => {
  const actual = jest.requireActual("../utils/apiClient");
  return {
    ...actual,
    fetchUserSkills: jest.fn(),
  };
});

describe("TeamPage integration", () => {
  const mockFetchUserSkills = apiClient.fetchUserSkills as jest.MockedFunction<
    typeof apiClient.fetchUserSkills
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects more than five usernames with a clear message (Acceptance criterion)", async () => {
    render(<TeamPage />);

    const input = screen.getByRole("textbox", {
      name: /enter github usernames/i,
    });
    const analyzeBtn = screen.getByRole("button", { name: /analyze team/i });

    // Enter 6 usernames
    fireEvent.change(input, {
      target: { value: "user1, user2, user3, user4, user5, user6" },
    });
    fireEvent.click(analyzeBtn);

    const errorAlert = await screen.findByTestId("team-validation-error");
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert.textContent).toContain("Too many usernames");
    expect(errorAlert.textContent).toContain("Maximum allowed is 5 team members");
    expect(mockFetchUserSkills).not.toHaveBeenCalled();
  });

  it("handles partial failure without blocking the matrix (Acceptance criterion)", async () => {
    mockFetchUserSkills.mockImplementation(async (username: string) => {
      if (username === "alice") {
        return {
          username: "alice",
          total_repositories_analyzed: 4,
          skills: [{ name: "Python", repository_count: 4, percentage: 100 }],
        };
      }
      if (username === "notfound") {
        const error = new apiClient.ApiClientError("GitHub user not found", 404);
        throw error;
      }
      throw new Error("Network error");
    });

    render(<TeamPage />);

    const input = screen.getByRole("textbox", {
      name: /enter github usernames/i,
    });
    const analyzeBtn = screen.getByRole("button", { name: /analyze team/i });

    fireEvent.change(input, { target: { value: "alice, notfound" } });
    fireEvent.click(analyzeBtn);

    // Matrix shows alice's Python skill
    await waitFor(() => {
      expect(screen.getByTestId("team-visual-matrix")).toBeInTheDocument();
      expect(screen.getByTestId("team-partial-failures")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Python").length).toBeGreaterThanOrEqual(1);

    // Partial failure is cleanly displayed
    expect(screen.getByText(/@notfound:/i)).toBeInTheDocument();
    expect(screen.getByTestId("team-partial-failures")).toHaveTextContent("GitHub user not found");
  });
});
