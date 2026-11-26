import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RepositoryDetailsDrawer from "../components/RepositoryDetailsDrawer";
import RecommendedIssuesList from "../components/RecommendedIssuesList";
import { MOCK_RECOMMENDED_ISSUES } from "../data/mockIssues";
import * as apiClient from "../utils/apiClient";
import type { RepositoryDetails } from "../types/api";

jest.mock("../utils/apiClient", () => {
  const actual = jest.requireActual("../utils/apiClient");
  return {
    ...actual,
    fetchRepositoryDetails: jest.fn(),
  };
});

const mockedFetchRepoDetails = apiClient.fetchRepositoryDetails as jest.MockedFunction<
  typeof apiClient.fetchRepositoryDetails
>;

const sampleRepoDetails: RepositoryDetails = {
  repository: "vercel/next.js",
  owner: "vercel",
  name: "next.js",
  description: "The React Framework for Production.",
  url: "https://github.com/vercel/next.js",
  stars: 125430,
  forks: 26500,
  open_issues_count: 2890,
  languages: ["TypeScript", "JavaScript", "Rust"],
  language_breakdown: [
    { name: "TypeScript", percentage: 78.5 },
    { name: "JavaScript", percentage: 15.2 },
    { name: "Rust", percentage: 6.3 },
  ],
  last_commit_date: "2026-11-24T10:00:00Z",
  contributing_url: "https://github.com/vercel/next.js/blob/canary/contributing.md",
  default_branch: "canary",
  license: "MIT",
  topics: ["react", "nextjs"],
  cached: true,
};

describe("RepositoryDetailsDrawer Component (Issue #444)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("does not fetch details when the drawer is closed (lazy loading)", () => {
    render(
      <RepositoryDetailsDrawer
        repository="vercel/next.js"
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockedFetchRepoDetails).not.toHaveBeenCalled();
  });

  it("loads and renders repository description, stars, languages, last commit, open issues, and CONTRIBUTING link when opened", async () => {
    mockedFetchRepoDetails.mockResolvedValueOnce(sampleRepoDetails);

    render(
      <RepositoryDetailsDrawer
        repository="vercel/next.js"
        isOpen={true}
        onClose={jest.fn()}
        theme="dark"
      />
    );

    expect(mockedFetchRepoDetails).toHaveBeenCalledTimes(1);
    expect(mockedFetchRepoDetails).toHaveBeenCalledWith(
      "vercel/next.js",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    // Loading state appears first
    expect(screen.getByTestId("repo-drawer-loading")).toBeInTheDocument();

    // Details render after fetch resolves
    await waitFor(() => {
      expect(screen.getByTestId("repo-description")).toHaveTextContent(
        "The React Framework for Production."
      );
    });

    expect(screen.getByTestId("repo-stars")).toHaveTextContent("125,430");
    expect(screen.getByTestId("repo-open-issues")).toHaveTextContent("2,890");
    expect(screen.getByTestId("repo-last-commit")).toHaveTextContent("Nov 24, 2026");

    const languagesEl = screen.getByTestId("repo-languages");
    expect(languagesEl).toHaveTextContent("TypeScript");
    expect(languagesEl).toHaveTextContent("78.5%");
    expect(languagesEl).toHaveTextContent("JavaScript");
    expect(languagesEl).toHaveTextContent("Rust");

    const contributingLink = screen.getByTestId("repo-contributing-link");
    expect(contributingLink).toHaveAttribute(
      "href",
      "https://github.com/vercel/next.js/blob/canary/contributing.md"
    );
    expect(contributingLink).toHaveAttribute("target", "_blank");
    expect(contributingLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits the CONTRIBUTING link when contributing_url is null", async () => {
    mockedFetchRepoDetails.mockResolvedValueOnce({
      ...sampleRepoDetails,
      contributing_url: null,
    });

    render(
      <RepositoryDetailsDrawer
        repository="vercel/next.js"
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("repo-description")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("repo-contributing-link")).toBeNull();
  });

  it("shows an error with a retry button on failed load and recovers on retry", async () => {
    mockedFetchRepoDetails
      .mockRejectedValueOnce(new apiClient.ApiClientError("GitHub rate limit reached", 429, "RATE_LIMIT"))
      .mockResolvedValueOnce(sampleRepoDetails);

    render(
      <RepositoryDetailsDrawer
        repository="vercel/next.js"
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("repo-drawer-error")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("GitHub rate limit reached");

    const retryBtn = screen.getByTestId("retry-repo-details-button");
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("repo-description")).toHaveTextContent(
        "The React Framework for Production."
      );
    });
    expect(mockedFetchRepoDetails).toHaveBeenCalledTimes(2);
  });

  it("closes on Escape key and traps Tab focus inside the drawer", async () => {
    mockedFetchRepoDetails.mockResolvedValueOnce(sampleRepoDetails);
    const handleClose = jest.fn();

    render(
      <RepositoryDetailsDrawer
        repository="vercel/next.js"
        isOpen={true}
        onClose={handleClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("repo-description")).toBeInTheDocument();
    });

    const closeBtn = screen.getByTestId("close-repo-drawer-button");
    expect(closeBtn).toHaveFocus();

    // Shift+Tab from first focusable element wraps to last focusable element (Open Repository link)
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(screen.getByTestId("repo-github-link")).toHaveFocus();

    // Tab from last focusable element wraps back to first focusable element
    fireEvent.keyDown(window, { key: "Tab" });
    expect(closeBtn).toHaveFocus();

    // Escape closes the drawer
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("opens from a recommended issue card and returns focus to the issue card button when closed", async () => {
    mockedFetchRepoDetails.mockResolvedValueOnce(sampleRepoDetails);

    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES.slice(0, 1)} />);

    // Details should not be fetched before opening
    expect(mockedFetchRepoDetails).not.toHaveBeenCalled();

    const triggerBtn = screen.getByTestId("repo-details-button");
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    // Drawer opens and loads details lazily
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("repo-description")).toHaveTextContent(
        "The React Framework for Production."
      );
    });

    // Close with Escape
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(triggerBtn).toHaveFocus();
  });
});
