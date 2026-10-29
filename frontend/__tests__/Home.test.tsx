import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";

// Sample mock data matching backend responses
const mockProfile = {
  username: "octocat",
  name: "The Octocat",
  bio: "GitHub mascot and developer advocate.",
  avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
  public_repositories: 8,
  followers: 9500,
  following: 9,
  profile_url: "https://github.com/octocat",
};

const mockSkills = {
  skills: [
    { name: "TypeScript", repository_count: 5, percentage: 50 },
    { name: "Python", repository_count: 3, percentage: 30 },
    { name: "Go", repository_count: 2, percentage: 20 },
  ],
  total_repositories_analyzed: 8,
};

const mockRecommendations = {
  username: "octocat",
  skills: ["TypeScript", "Python", "Go"],
  recommendations: [
    {
      id: 101,
      title: "Add TypeScript type definitions for options parser",
      repository: "octocat/hello-world",
      url: "https://github.com/octocat/hello-world/issues/101",
      state: "open",
      labels: ["good first issue", "help wanted"],
      comments: 3,
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-25T14:30:00Z",
      language: "TypeScript",
      match_score: 88,
      match_reasons: ["Matches top language: TypeScript", "Good first issue for beginners"],
    },
  ],
};

describe("Analyze Flow - Home Component", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("renders the landing page with header, hero text, and input form", () => {
    render(<Home />);

    expect(screen.getByText("OpenSourceMate")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Find the open-source issues/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your GitHub username/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Analyze Profile/i })
    ).toBeInTheDocument();
  });

  it("shows an error when attempting to analyze an empty username", async () => {
    render(<Home />);

    const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });
    fireEvent.click(analyzeBtn);

    expect(
      await screen.findByText(/Please enter a GitHub username\./i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid username characters", async () => {
    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });

    fireEvent.change(input, { target: { value: "-invalid_name-" } });
    fireEvent.click(analyzeBtn);

    expect(
      await screen.findByText(/Invalid GitHub username/i)
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("trims whitespace and removes leading @ from username before calling API", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSkills,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecommendations,
      });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });

    fireEvent.change(input, { target: { value: "   @octocat   " } });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/github/users/octocat")
      );
    });
  });

  it("displays loading state and disables analyze button during request", async () => {
    let resolveProfile: (val: any) => void;
    const profilePromise = new Promise((resolve) => {
      resolveProfile = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValue(profilePromise);

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });

    fireEvent.change(input, { target: { value: "octocat" } });
    fireEvent.click(analyzeBtn);

    expect(screen.getByRole("button", { name: /Analyzing\.\.\./i })).toBeDisabled();

    // Clean up promise
    act(() => {
      resolveProfile!({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      });
    });
  });

  it("handles successful analysis flow displaying profile, skills, and matched recommendations", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSkills,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecommendations,
      });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    fireEvent.change(input, { target: { value: "octocat" } });
    fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

    // Profile assertion
    expect(await screen.findByText("The Octocat")).toBeInTheDocument();
    expect(screen.getByText("@octocat")).toBeInTheDocument();
    expect(screen.getByText("GitHub mascot and developer advocate.")).toBeInTheDocument();

    // Skills assertion
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThan(0);
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();

    // Recommendations assertion
    await waitFor(() => {
      expect(
        screen.getByText("Add TypeScript type definitions for options parser")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("octocat/hello-world")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
  });

  it("displays 404 error when GitHub user does not exist", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Not found" }),
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    fireEvent.change(input, { target: { value: "nonexistentuser999" } });
    fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

    expect(
      await screen.findByText(/GitHub user not found\. Check the username and try again\./i)
    ).toBeInTheDocument();
  });

  it("displays rate limit error message with reset time on 429 response", async () => {
    const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        detail: "Rate limit exceeded",
        reset_at: futureDate,
      }),
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    fireEvent.change(input, { target: { value: "busyuser" } });
    fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

    expect(
      await screen.findByText(/GitHub rate limit reached, try again at/i)
    ).toBeInTheDocument();
  });

  it("displays server unavailable message on 502/503 response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Service unavailable" }),
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    fireEvent.change(input, { target: { value: "validuser" } });
    fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

    expect(
      await screen.findByText(/GitHub API is temporarily unavailable\. Please try again in a few moments\./i)
    ).toBeInTheDocument();
  });

  it("displays network connectivity error and retry button on TypeError", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    fireEvent.change(input, { target: { value: "offlineuser" } });
    fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

    expect(
      await screen.findByText(/Unable to connect to server\. Please check your internet connection/i)
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Now mock success for retry
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSkills,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecommendations,
      });

    fireEvent.click(retryBtn);

    expect(await screen.findByText("The Octocat")).toBeInTheDocument();
  });

  it("submits the form when Enter key is pressed in the username input", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSkills,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecommendations,
      });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    fireEvent.change(input, { target: { value: "octocat" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/github/users/octocat")
      );
    });
  });

  it("toggles theme between dark and light mode", async () => {
    render(<Home />);

    const themeBtn = screen.getByRole("button", { name: /Switch to light mode/i });
    fireEvent.click(themeBtn);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
