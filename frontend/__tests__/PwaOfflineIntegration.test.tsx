import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Home from "../app/page";
import { saveLastAnalysisResult } from "../utils/offlineStorage";

jest.mock("../components/ContributorsWall", () => {
  return function MockContributorsWall() {
    return null;
  };
});

describe("PWA Offline Integration (app/page.tsx)", () => {
  const originalOnLine = navigator.onLine;

  const mockCachedData = {
    username: "octocat",
    profile: {
      username: "octocat",
      name: "The Octocat",
      bio: "GitHub mascot and developer advocate.",
      avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
      public_repositories: 8,
      followers: 9500,
      following: 9,
      profile_url: "https://github.com/octocat",
      created_at: "2011-01-25T18:44:36Z",
      updated_at: "2026-11-20T10:00:00Z",
    },
    skills: {
      username: "octocat",
      skills: [
        { name: "TypeScript", count: 5, percentage: 50 },
        { name: "Python", count: 3, percentage: 30 },
      ],
      total_repositories_analyzed: 8,
      analyzed_at: "2026-11-26T12:00:00Z",
    },
    recommendations: [
      {
        id: 101,
        title: "Add offline caching for service workers",
        repository: "octocat/hello-world",
        url: "https://github.com/octocat/hello-world/issues/101",
        state: "open",
        labels: ["good first issue"],
        language: "TypeScript",
        match_score: 95,
        score: 95,
        match_reasons: ["Matches top language: TypeScript"],
      },
    ],
    fetchedAt: "2026-11-26T12:00:00.000Z",
  };

  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      configurable: true,
    });
  });

  it("opens the last analysis result automatically when the user is offline", async () => {
    // 1. Pre-populate localStorage with previous analysis
    saveLastAnalysisResult(mockCachedData);

    // 2. Set offline state
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    render(<Home />);

    // 3. Verify Offline banner is displayed
    await waitFor(() => {
      expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
    });
    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
    expect(screen.getByText(/Viewing cached results for @octocat/i)).toBeInTheDocument();

    // 4. Verify profile and cached result badge are displayed
    expect(screen.getByText("The Octocat")).toBeInTheDocument();
    expect(screen.getByTestId("cached-result-badge")).toBeInTheDocument();
    expect(screen.getByText(/Cached Result • Fetched/i)).toBeInTheDocument();

    // 5. Verify recommendations from cache are displayed
    expect(screen.getByText("Add offline caching for service workers")).toBeInTheDocument();
    expect(screen.getByTestId("recommendations-cached-badge")).toBeInTheDocument();
  });

  it("notifies when offline and searching for a user without cache", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });

    act(() => {
      // Enter unknown user
      input.focus();
      // change value
      const event = { target: { value: "nonexistentuser" } };
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    act(() => {
      analyzeBtn.click();
    });

    // Should see offline alert
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });
});
