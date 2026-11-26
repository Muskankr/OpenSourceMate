import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReadmeBadgeSnippet from "../components/ReadmeBadgeSnippet";
import {
  getSkillBadgeUrl,
  getSkillBadgeMarkdownSnippet,
  getSkillBadgeHtmlSnippet,
} from "../utils/apiClient";
import Home from "../app/page";

jest.mock("../components/ContributorsWall", () => {
  return function MockContributorsWall() {
    return null;
  };
});

describe("Skill Badge URL & Snippet Helpers", () => {
  it("generates correct badge URL for a username", () => {
    const url = getSkillBadgeUrl("torvalds");
    expect(url).toBe("http://localhost:8000/api/v1/github/users/torvalds/badge.svg");
  });

  it("handles custom label and color parameters", () => {
    const url = getSkillBadgeUrl("octocat", { label: "Skills", color: "#10b981" });
    expect(url).toContain("label=Skills");
    expect(url).toContain("color=%2310b981");
  });

  it("generates valid markdown snippet linking to user profile", () => {
    const snippet = getSkillBadgeMarkdownSnippet("octocat", {
      siteUrl: "https://opensourcemate.org",
    });
    expect(snippet).toBe(
      "[![OpenSourceMate Skills](http://localhost:8000/api/v1/github/users/octocat/badge.svg)](https://opensourcemate.org/?username=octocat)"
    );
  });

  it("generates valid HTML snippet linking to user profile", () => {
    const snippet = getSkillBadgeHtmlSnippet("octocat", {
      siteUrl: "https://opensourcemate.org",
    });
    expect(snippet).toBe(
      '<a href="https://opensourcemate.org/?username=octocat"><img src="http://localhost:8000/api/v1/github/users/octocat/badge.svg" alt="OpenSourceMate Skills" /></a>'
    );
  });
});

describe("ReadmeBadgeSnippet Component", () => {
  it("renders null when username is empty", () => {
    const { container } = render(<ReadmeBadgeSnippet username="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders badge snippet container with preview and code snippet", () => {
    render(<ReadmeBadgeSnippet username="octocat" theme="dark" />);
    expect(screen.getByTestId("readme-badge-snippet-container")).toBeInTheDocument();
    expect(screen.getByText("GitHub Profile README Badge")).toBeInTheDocument();

    const previewImg = screen.getByTestId("badge-preview-image");
    expect(previewImg).toBeInTheDocument();
    expect(previewImg).toHaveAttribute(
      "src",
      "http://localhost:8000/api/v1/github/users/octocat/badge.svg"
    );

    const codeBox = screen.getByTestId("badge-snippet-code");
    expect(codeBox).toHaveTextContent("[![OpenSourceMate Skills]");
    expect(codeBox).toHaveTextContent("badge.svg");
  });

  it("toggles snippet between Markdown and HTML formats", () => {
    render(<ReadmeBadgeSnippet username="octocat" theme="light" />);
    const codeBox = screen.getByTestId("badge-snippet-code");
    expect(codeBox).toHaveTextContent("[![OpenSourceMate Skills]");

    const htmlBtn = screen.getByRole("button", { name: "HTML" });
    fireEvent.click(htmlBtn);

    expect(codeBox).toHaveTextContent('<a href="');
    expect(codeBox).toHaveTextContent('<img src="');

    const mdBtn = screen.getByRole("button", { name: "Markdown" });
    fireEvent.click(mdBtn);
    expect(codeBox).toHaveTextContent("[![OpenSourceMate Skills]");
  });

  it("toggles label between OpenSourceMate brand and Skills", () => {
    render(<ReadmeBadgeSnippet username="octocat" />);
    const skillsLabelBtn = screen.getByRole("button", { name: "Skills" });
    fireEvent.click(skillsLabelBtn);

    const codeBox = screen.getByTestId("badge-snippet-code");
    expect(codeBox).toHaveTextContent("label=Skills");

    const brandBtn = screen.getByRole("button", { name: "OpenSourceMate" });
    fireEvent.click(brandBtn);
    expect(codeBox).not.toHaveTextContent("label=Skills");
  });

  it("copies snippet to clipboard when clicking copy button", async () => {
    const originalClipboard = navigator.clipboard;
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(<ReadmeBadgeSnippet username="octocat" />);
    const copyBtn = screen.getByTestId("copy-badge-snippet-btn");
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:8000/api/v1/github/users/octocat/badge.svg")
    );
    expect(await screen.findByText(/Copied!/i)).toBeInTheDocument();

    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });
  });
});

describe("Results Page - README Badge Snippet Integration", () => {
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
    skills: [
      { name: "TypeScript", repository_count: 5, percentage: 80 },
      { name: "Python", repository_count: 3, percentage: 60 },
      { name: "Rust", repository_count: 2, percentage: 40 },
    ],
    total_repositories_analyzed: 8,
    top_languages: ["TypeScript", "Python", "Rust"],
    analyzed_at: "2026-11-26T10:00:00Z",
  };

  const mockIssues = {
    username: "octocat",
    skills: ["TypeScript", "Python", "Rust"],
    recommendations: [],
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
  });

  it("renders README Badge section and toolbar jump link on analysis", async () => {
    render(<Home />);
    const input = screen.getByPlaceholderText(/Enter your GitHub username/i);
    const analyzeBtn = screen.getByRole("button", { name: /Analyze Profile/i });

    fireEvent.change(input, { target: { value: "octocat" } });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText("Your technical skills")).toBeInTheDocument();
    });

    // Check README Badge link in toolbar
    const toolbarBadgeLink = screen.getByRole("link", { name: "README Badge" });
    expect(toolbarBadgeLink).toHaveAttribute("href", "#readme-badge");

    // Check ReadmeBadgeSnippet rendered inside the results page
    const snippetContainer = await screen.findByTestId("readme-badge-snippet-container");
    expect(snippetContainer).toBeInTheDocument();
    expect(screen.getByTestId("badge-snippet-code")).toBeInTheDocument();
  });
});
