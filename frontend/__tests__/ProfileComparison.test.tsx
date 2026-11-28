import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileComparison from "../components/ProfileComparison";
import * as apiClient from "../utils/apiClient";
import type { GitHubUserProfile, UserSkillsResponse } from "../types/api";

jest.mock("../utils/apiClient", () => {
  const actual = jest.requireActual("../utils/apiClient");
  return {
    ...actual,
    fetchUserProfile: jest.fn(),
    fetchUserSkills: jest.fn(),
  };
});

const mockFetchUserProfile = apiClient.fetchUserProfile as jest.MockedFunction<
  typeof apiClient.fetchUserProfile
>;
const mockFetchUserSkills = apiClient.fetchUserSkills as jest.MockedFunction<
  typeof apiClient.fetchUserSkills
>;

describe("ProfileComparison Component", () => {
  const user1Profile: GitHubUserProfile = {
    username: "alice",
    name: "Alice Developer",
    bio: "Full stack engineer",
    avatar_url: "https://example.com/alice.png",
    public_repositories: 25,
    followers: 120,
    following: 30,
    profile_url: "https://github.com/alice",
  };

  const user1Skills: UserSkillsResponse = {
    username: "alice",
    total_repositories_analyzed: 25,
    skills: [
      { name: "TypeScript", repository_count: 20, percentage: 80 },
      { name: "React", repository_count: 15, percentage: 60 },
      { name: "Go", repository_count: 5, percentage: 20 },
    ],
  };

  const user2Profile: GitHubUserProfile = {
    username: "bob",
    name: "Bob Contributor",
    bio: "Backend and DevOps",
    avatar_url: "https://example.com/bob.png",
    public_repositories: 40,
    followers: 350,
    following: 50,
    profile_url: "https://github.com/bob",
  };

  const user2Skills: UserSkillsResponse = {
    username: "bob",
    total_repositories_analyzed: 40,
    skills: [
      { name: "TypeScript", repository_count: 30, percentage: 75 },
      { name: "Python", repository_count: 25, percentage: 62 },
      { name: "Docker", repository_count: 18, percentage: 45 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders comparison form with two developer input fields and empty placeholders", () => {
    render(<ProfileComparison />);

    expect(screen.getByLabelText(/First developer username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Second developer username/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Compare/i })).toBeInTheDocument();

    expect(screen.getByText(/Developer #1/i)).toBeInTheDocument();
    expect(screen.getByText(/Developer #2/i)).toBeInTheDocument();
  });

  it("successfully compares two valid profiles side by side", async () => {
    mockFetchUserProfile.mockImplementation(async (username) => {
      if (username.toLowerCase() === "alice") return user1Profile;
      if (username.toLowerCase() === "bob") return user2Profile;
      throw new Error("User not found");
    });

    mockFetchUserSkills.mockImplementation(async (username) => {
      if (username.toLowerCase() === "alice") return user1Skills;
      if (username.toLowerCase() === "bob") return user2Skills;
      throw new Error("Skills not found");
    });

    render(<ProfileComparison initialUser1="alice" initialUser2="bob" />);

    // Wait for both profiles to resolve
    await waitFor(() => {
      expect(screen.getByText("Alice Developer")).toBeInTheDocument();
      expect(screen.getByText("Bob Contributor")).toBeInTheDocument();
    });

    // Check repository counts
    expect(screen.getByText("120")).toBeInTheDocument(); // Alice followers
    expect(screen.getByText("350")).toBeInTheDocument(); // Bob followers

    // Check shared skills breakdown
    expect(screen.getByText(/Skill Comparison Breakdown/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Shared Skills/i })).toBeInTheDocument();

    // TypeScript is shared: 20 repos for Alice, 30 repos for Bob
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getAllByText("30").length).toBeGreaterThanOrEqual(1);
  });

  it("isolates errors: handles invalid user 1 without losing user 2 results", async () => {
    mockFetchUserProfile.mockImplementation(async (username) => {
      if (username.toLowerCase() === "invalid-nonexistent-user") {
        throw new apiClient.ApiClientError("GitHub user not found.", 404, "NOT_FOUND");
      }
      if (username.toLowerCase() === "bob") return user2Profile;
      throw new Error("Unexpected username");
    });

    mockFetchUserSkills.mockImplementation(async (username) => {
      if (username.toLowerCase() === "bob") return user2Skills;
      throw new apiClient.ApiClientError("GitHub user not found.", 404, "NOT_FOUND");
    });

    render(<ProfileComparison initialUser1="invalid-nonexistent-user" initialUser2="bob" />);

    // User 1 error should be displayed in User 1's column
    await waitFor(() => {
      expect(screen.getByText(/Developer #1 Error/i)).toBeInTheDocument();
      expect(screen.getByText(/GitHub user not found/i)).toBeInTheDocument();
    });

    // User 2 should succeed and remain visible without being lost
    expect(screen.getByText("Bob Contributor")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getAllByText("40").length).toBeGreaterThanOrEqual(1); // 40 public repos / analyzed
  });

  it("isolates errors: handles invalid user 2 without losing user 1 results", async () => {
    mockFetchUserProfile.mockImplementation(async (username) => {
      if (username.toLowerCase() === "alice") return user1Profile;
      throw new apiClient.ApiClientError("GitHub user not found.", 404, "NOT_FOUND");
    });

    mockFetchUserSkills.mockImplementation(async (username) => {
      if (username.toLowerCase() === "alice") return user1Skills;
      throw new apiClient.ApiClientError("GitHub user not found.", 404, "NOT_FOUND");
    });

    render(<ProfileComparison initialUser1="alice" initialUser2="invalid-second-user" />);

    await waitFor(() => {
      expect(screen.getByText("Alice Developer")).toBeInTheDocument();
      expect(screen.getByText(/Developer #2 Error/i)).toBeInTheDocument();
    });

    // User 1 profile is intact
    expect(screen.getByText("Full stack engineer")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("swaps developers and their inputs when the swap button is clicked", async () => {
    mockFetchUserProfile.mockResolvedValue(user1Profile);
    mockFetchUserSkills.mockResolvedValue(user1Skills);

    const onUsernamesChange = jest.fn();

    render(
      <ProfileComparison
        initialUser1="alice"
        initialUser2="bob"
        onUsernamesChange={onUsernamesChange}
      />
    );

    const swapButton = await screen.findByRole("button", {
      name: /Swap developer positions/i,
    });
    fireEvent.click(swapButton);

    const input1 = screen.getByLabelText(/First developer username/i) as HTMLInputElement;
    const input2 = screen.getByLabelText(/Second developer username/i) as HTMLInputElement;

    expect(input1.value).toBe("bob");
    expect(input2.value).toBe("alice");
    expect(onUsernamesChange).toHaveBeenCalledWith("bob", "alice");
  });

  it("switches to unique skills tab and shows distinct skills for each developer", async () => {
    mockFetchUserProfile.mockImplementation(async (username) => {
      if (username === "alice") return user1Profile;
      return user2Profile;
    });

    mockFetchUserSkills.mockImplementation(async (username) => {
      if (username === "alice") return user1Skills;
      return user2Skills;
    });

    render(<ProfileComparison initialUser1="alice" initialUser2="bob" />);

    await waitFor(() => {
      expect(screen.getByText("Alice Developer")).toBeInTheDocument();
    });

    // Switch tab to Unique Skills
    const uniqueTab = screen.getByRole("tab", { name: /Unique Skills/i });
    fireEvent.click(uniqueTab);

    // Alice unique: React and Go
    expect(screen.getByText(/Exclusive to @alice/i)).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();

    // Bob unique: Python and Docker
    expect(screen.getByText(/Exclusive to @bob/i)).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
  });
});
