import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../app/page";

jest.mock("../components/ContributorsWall", () => {
  return function MockContributorsWall() {
    return null;
  };
});

const mockProfile = {
  username: "octocat",
  name: "The Octocat",
  bio: "GitHub mascot",
  avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
  public_repositories: 8,
  followers: 9500,
  following: 9,
  profile_url: "https://github.com/octocat",
};

const mockSkills = {
  skills: [{ name: "TypeScript", repository_count: 5, percentage: 100 }],
  total_repositories_analyzed: 8,
};

const mockRecommendations = {
  username: "octocat",
  skills: ["TypeScript"],
  recommendations: [
    {
      id: 101,
      title: "First recommended issue",
      repository: "octocat/repo-one",
      url: "https://github.com/octocat/repo-one/issues/101",
      state: "open",
      labels: ["good first issue"],
      comments: 2,
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-25T14:30:00Z",
      language: "TypeScript",
      match_score: 92,
      match_reasons: ["Matches TypeScript"],
    },
    {
      id: 102,
      title: "Second recommended issue",
      repository: "octocat/repo-two",
      url: "https://github.com/octocat/repo-two/issues/102",
      state: "open",
      labels: ["help wanted"],
      comments: 4,
      created_at: "2026-10-21T10:00:00Z",
      updated_at: "2026-10-26T14:30:00Z",
      language: "TypeScript",
      match_score: 85,
      match_reasons: ["Matches TypeScript"],
    },
  ],
};

describe("Global Keyboard Shortcuts Integration (Issue #438)", () => {
  const originalFetch = global.fetch;
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = jest.fn();
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/skills")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockSkills,
        } as Response);
      }
      if (url.includes("/matching/")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockRecommendations,
        } as Response);
      }
      if (url.includes("/users/octocat")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockProfile,
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    }) as jest.Mock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.open = originalOpen;
    jest.restoreAllMocks();
  });

  it("focuses the username input on '/' and ignores shortcuts while typing in the input", () => {
    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    expect(document.activeElement).not.toBe(input);

    // Pressing "/" focuses the username input
    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(input);

    // Typing "?" or "j" while focused inside the input must NOT open help dialog
    fireEvent.keyDown(input, { key: "?" });
    expect(screen.queryByTestId("keyboard-shortcuts-dialog")).toBeNull();

    fireEvent.keyDown(input, { key: "j" });
    expect(screen.queryByTestId("keyboard-shortcuts-dialog")).toBeNull();
  });

  it("opens the help dialog on '?' and closes it on Escape", () => {
    render(<Home />);

    fireEvent.keyDown(window, { key: "?" });
    const dialog = screen.getByTestId("keyboard-shortcuts-dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Select next recommended issue")).toBeInTheDocument();
    expect(screen.getByText("Select previous recommended issue")).toBeInTheDocument();
    expect(screen.getByText("Open the selected issue in a new tab")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("keyboard-shortcuts-dialog")).toBeNull();
  });

  it("navigates recommended issues with j/k, visibly highlights selection, and opens with o", async () => {
    render(<Home />);

    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    fireEvent.change(input, { target: { value: "octocat" } });
    fireEvent.click(screen.getByRole("button", { name: /Analyze Profile/i }));

    await waitFor(() => {
      expect(screen.getByText("First recommended issue")).toBeInTheDocument();
      expect(screen.getByText("Second recommended issue")).toBeInTheDocument();
    });

    // Blur input so global shortcuts are active
    (document.activeElement as HTMLElement)?.blur();

    const firstCard = screen.getByRole("article", { name: /First recommended issue/i });
    const secondCard = screen.getByRole("article", { name: /Second recommended issue/i });

    expect(firstCard).toHaveAttribute("data-selected", "false");
    expect(secondCard).toHaveAttribute("data-selected", "false");

    // Press "j" -> selects first issue and visibly highlights it
    fireEvent.keyDown(window, { key: "j" });
    expect(firstCard).toHaveAttribute("data-selected", "true");
    expect(firstCard).toHaveAttribute("aria-selected", "true");
    expect(firstCard.className).toContain("ring-2");
    expect(secondCard).toHaveAttribute("data-selected", "false");

    // Press "j" again -> selects second issue
    fireEvent.keyDown(window, { key: "j" });
    expect(firstCard).toHaveAttribute("data-selected", "false");
    expect(secondCard).toHaveAttribute("data-selected", "true");
    expect(secondCard.className).toContain("ring-2");

    // Press "k" -> moves back to first issue
    fireEvent.keyDown(window, { key: "k" });
    expect(firstCard).toHaveAttribute("data-selected", "true");
    expect(secondCard).toHaveAttribute("data-selected", "false");

    // Press "o" -> opens selected issue in a new tab
    fireEvent.keyDown(window, { key: "o" });
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      "https://github.com/octocat/repo-one/issues/101",
      "_blank",
      "noopener,noreferrer"
    );
  });
});
