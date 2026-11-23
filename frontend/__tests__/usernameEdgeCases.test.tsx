import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../app/page";

jest.mock("../components/ContributorsWall", () => {
  return function MockContributorsWall() {
    return null;
  };
});

describe("Username Edge Cases and Error Paths (Issue #396)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("Frontend Username Validation Before API Invocation", () => {
    it("validates empty username on frontend and blocks API calls", async () => {
      render(<Home />);

      const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });
      fireEvent.click(analyzeBtn);

      expect(await screen.findByText(/Please enter a GitHub username\./i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("rejects invalid username with leading hyphen without calling API", async () => {
      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });

      fireEvent.change(input, { target: { value: "-invalid-lead" } });
      fireEvent.click(analyzeBtn);

      expect(await screen.findByText(/cannot begin with a hyphen/i)).toBeInTheDocument();
      expect(screen.getByTestId("error-suggestion")).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("rejects repository URL input with informative error without calling API", async () => {
      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });

      fireEvent.change(input, { target: { value: "https://github.com/torvalds/linux" } });
      fireEvent.click(analyzeBtn);

      expect(await screen.findByText(/points to a repository or page/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("extracts and normalizes username from profile URL before API call", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { code: "USER_NOT_FOUND", message: "GitHub user not found" },
          detail: "GitHub user not found",
        }),
      });

      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "https://github.com/valid-dev/" } });
      fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/github/users/valid-dev"),
          expect.any(Object)
        );
      });
    });
  });

  describe("Error Path 1: User Not Found (404)", () => {
    it("displays user not found message with suggested next step and retry option", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: "USER_NOT_FOUND",
            message: "GitHub user 'ghost-dev-999' could not be found.",
          },
          detail: "GitHub user 'ghost-dev-999' could not be found.",
        }),
      });

      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "ghost-dev-999" } });
      fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

      expect(
        await screen.findByText(/GitHub user 'ghost-dev-999' could not be found/i)
      ).toBeInTheDocument();

      const suggestion = screen.getByTestId("error-suggestion");
      expect(suggestion).toHaveTextContent(/double-check the username for typos/i);

      // Verify no blank screen or broken results rendered
      expect(screen.queryByTestId("analysis-results")).not.toBeInTheDocument();
      expect(screen.queryByTestId("no-skills-empty-state")).not.toBeInTheDocument();
    });
  });

  describe("Error Path 2: No Public Repositories or Only Forks (422)", () => {
    it("displays friendly message and next step when user has 0 public repositories", async () => {
      // Mock profile returns 0 public repositories
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            username: "newbie-contributor",
            name: "Newbie Contributor",
            bio: "Just joined GitHub!",
            avatar_url: "https://avatars.githubusercontent.com/u/123",
            public_repositories: 0,
            followers: 0,
            following: 0,
            profile_url: "https://github.com/newbie-contributor",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            username: "newbie-contributor",
            skills: [],
            total_repositories_analyzed: 0,
          }),
        });

      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "newbie-contributor" } });
      fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

      expect(await screen.findByText(/has no public repositories to analyze/i)).toBeInTheDocument();

      const suggestion = screen.getByTestId("error-suggestion");
      expect(suggestion).toHaveTextContent(/Create or publish a public repository/i);

      // Verify no blank or broken results section
      expect(screen.queryByText(/All skills have been removed/i)).not.toBeInTheDocument();
    });

    it("displays friendly message and next step when user only has forked repositories", async () => {
      // Mock user with 3 public repos but 0 analyzed (all forks)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            username: "forks-only-dev",
            name: "Fork Contributor",
            bio: null,
            avatar_url: "https://avatars.githubusercontent.com/u/456",
            public_repositories: 3,
            followers: 1,
            following: 2,
            profile_url: "https://github.com/forks-only-dev",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            username: "forks-only-dev",
            skills: [],
            total_repositories_analyzed: 0,
          }),
        });

      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "forks-only-dev" } });
      fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

      expect(await screen.findByText(/only has forked repositories/i)).toBeInTheDocument();

      const suggestion = screen.getByTestId("error-suggestion");
      expect(suggestion).toHaveTextContent(/analyzes original code/i);

      // Verify no blank or broken results section
      expect(screen.queryByText(/All skills have been removed/i)).not.toBeInTheDocument();
    });

    it("handles backend 422 typed error response for NO_PUBLIC_REPOSITORIES", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          error: {
            code: "NO_PUBLIC_REPOSITORIES",
            message: "GitHub user 'empty-dev' has no public repositories to analyze.",
          },
          detail: "GitHub user 'empty-dev' has no public repositories to analyze.",
        }),
      });

      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "empty-dev" } });
      fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

      expect(await screen.findByText(/has no public repositories to analyze/i)).toBeInTheDocument();
      expect(screen.getByTestId("error-suggestion")).toBeInTheDocument();
    });
  });

  describe("Error Path 3: Upstream Failure (502 / 504 / Network Drops)", () => {
    it("displays upstream failure message and retry button when GitHub API fails with 502", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({
          error: {
            code: "UPSTREAM_FAILURE",
            message: "GitHub API is temporarily unavailable or returned an upstream error.",
          },
          detail: "GitHub API is temporarily unavailable.",
        }),
      });

      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "validuser" } });
      fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

      expect(
        await screen.findByRole("heading", { name: /temporarily unavailable/i })
      ).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /Retry/i });
      expect(retryBtn).toBeInTheDocument();
    });

    it("displays connection failure message and retry button on network TypeError", async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch"));

      render(<Home />);

      const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
      fireEvent.change(input, { target: { value: "validuser" } });
      fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

      expect(await screen.findByText(/Unable to connect to (?:the )?server/i)).toBeInTheDocument();

      const retryBtn = screen.getByRole("button", { name: /Retry/i });
      expect(retryBtn).toBeInTheDocument();
    });
  });
});
