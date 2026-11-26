import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SubscribeFeedButton from "../components/SubscribeFeedButton";
import { getAtomFeedUrl } from "../utils/apiClient";
import Home from "../app/page";

jest.mock("../components/ContributorsWall", () => {
  return function MockContributorsWall() {
    return null;
  };
});

describe("Atom Feed URL Generation", () => {
  it("generates correct feed URL for a plain username", () => {
    const url = getAtomFeedUrl("torvalds");
    expect(url).toBe("http://localhost:8000/api/v1/matching/users/torvalds/feed.atom");
  });

  it("strips leading @ from username", () => {
    const url = getAtomFeedUrl("@octocat");
    expect(url).toBe("http://localhost:8000/api/v1/matching/users/octocat/feed.atom");
  });

  it("encodes special characters in username", () => {
    const url = getAtomFeedUrl("user name");
    expect(url).toBe("http://localhost:8000/api/v1/matching/users/user%20name/feed.atom");
  });

  it("appends program parameter when program option is provided", () => {
    const url = getAtomFeedUrl("octocat", { program: "hacktoberfest" });
    expect(url).toBe(
      "http://localhost:8000/api/v1/matching/users/octocat/feed.atom?program=hacktoberfest"
    );
  });
});

describe("SubscribeFeedButton Component", () => {
  it("renders null if username is empty or whitespace", () => {
    const { container } = render(<SubscribeFeedButton username="   " />);
    expect(container.firstChild).toBeNull();
  });

  it("renders as button variant with RSS icon and expected attributes", () => {
    render(<SubscribeFeedButton username="torvalds" theme="dark" variant="button" />);
    const link = screen.getByTestId("subscribe-feed-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "http://localhost:8000/api/v1/matching/users/torvalds/feed.atom"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute(
      "aria-label",
      "Subscribe to Atom feed of recommended issues for @torvalds"
    );
    expect(screen.getByText("Subscribe")).toBeInTheDocument();
  });

  it("renders as link variant", () => {
    render(<SubscribeFeedButton username="torvalds" theme="light" variant="link" />);
    const link = screen.getByTestId("subscribe-feed-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("text-orange-600");
  });

  it("copies feed URL to clipboard on Alt/Ctrl-click", async () => {
    const originalClipboard = navigator.clipboard;
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(<SubscribeFeedButton username="torvalds" />);
    const link = screen.getByTestId("subscribe-feed-link");

    fireEvent.click(link, { altKey: true });
    expect(writeTextMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/matching/users/torvalds/feed.atom"
    );
    expect(await screen.findByText("Feed URL copied!")).toBeInTheDocument();

    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });
  });
});

describe("Results Page - Subscribe Link Integration", () => {
  const mockProfile = {
    username: "octocat",
    name: "The Octocat",
    avatar_url: "https://avatars.githubusercontent.com/u/583231",
    bio: "GitHub mascot",
    public_repositories: 8,
    total_stars: 120,
    top_language: "TypeScript",
    followers: 100,
    following: 10,
    html_url: "https://github.com/octocat",
    created_at: "2011-01-25T18:44:36Z",
  };

  const mockSkills = {
    username: "octocat",
    skills: [{ name: "TypeScript", repository_count: 5, percentage: 80 }],
    top_languages: ["TypeScript"],
    analyzed_at: "2026-11-26T10:00:00Z",
  };

  const mockIssues = {
    username: "octocat",
    skills: ["TypeScript"],
    recommendations: [
      {
        id: 101,
        title: "Improve documentation",
        repository: "acme/repo",
        url: "https://github.com/acme/repo/issues/101",
        match_score: 92,
        match_reasons: ["TypeScript skill match"],
        labels: ["good first issue"],
        language: "TypeScript",
        state: "open",
        comments: 2,
        created_at: "2026-11-20T00:00:00Z",
        updated_at: "2026-11-25T00:00:00Z",
      },
    ],
  };

  beforeEach(() => {
    global.fetch = jest.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/github/users/octocat/repositories")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
          headers: new Headers(),
        } as Response);
      }
      if (urlStr.includes("/api/github/users/octocat/skills")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSkills),
          headers: new Headers(),
        } as Response);
      }
      if (urlStr.includes("/api/github/users/octocat")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockProfile),
          headers: new Headers(),
        } as Response);
      }
      if (urlStr.includes("/api/matching/users/octocat/issues")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockIssues),
          headers: new Headers(),
        } as Response);
      }
      if (urlStr.includes("/api/matching/programs") || urlStr.includes("/api/programs")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ programs: [] }),
          headers: new Headers(),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.querySelectorAll("link[type='application/atom+xml']").forEach((el) => el.remove());
  });

  it("displays Subscribe links on the results page after analyzing profile", async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });

    fireEvent.change(input, { target: { value: "octocat" } });
    fireEvent.click(analyzeBtn);

    // Wait for analysis to complete and recommendations to show
    await waitFor(() => {
      expect(screen.getByText("Your developer profile")).toBeInTheDocument();
    });

    // Should find Subscribe feed links on the page (action toolbar + recommendations header)
    const subscribeLinks = await screen.findAllByTestId("subscribe-feed-link");
    expect(subscribeLinks.length).toBeGreaterThanOrEqual(1);
    expect(subscribeLinks[0]).toHaveAttribute(
      "href",
      "http://localhost:8000/api/v1/matching/users/octocat/feed.atom"
    );

    // Document head should contain Atom auto-discovery link
    const headLink = document.querySelector<HTMLLinkElement>(
      "link[rel='alternate'][type='application/atom+xml']"
    );
    expect(headLink).toBeInTheDocument();
    expect(headLink?.href).toBe("http://localhost:8000/api/v1/matching/users/octocat/feed.atom");
    expect(headLink?.title).toBe("OpenSourceMate matches for @octocat");
  });
});
