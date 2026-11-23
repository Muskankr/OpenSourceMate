import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RecommendedIssuesList from "../components/RecommendedIssuesList";
import { MOCK_RECOMMENDED_ISSUES } from "../data/mockIssues";

describe("RecommendedIssuesList Component", () => {
  beforeEach(() => window.localStorage.clear());

  it("renders a list of recommended issues with header and issue count", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    expect(screen.getByText("Recommended open-source issues")).toBeInTheDocument();
    expect(
      screen.getByText(
        `Showing ${MOCK_RECOMMENDED_ISSUES.length} of ${MOCK_RECOMMENDED_ISSUES.length} issues`
      )
    ).toBeInTheDocument();

    // Verify first issue title
    expect(screen.getByText(MOCK_RECOMMENDED_ISSUES[0].title)).toBeInTheDocument();
  });

  it("provides a distinct pre-filled feedback link for every recommendation", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} username="octocat" />);

    const links = screen.getAllByRole("link", { name: /Report wrong match for/i });
    expect(links).toHaveLength(MOCK_RECOMMENDED_ISSUES.length);
    links.forEach((link, index) => {
      const params = new URL(link.getAttribute("href")!).searchParams;
      expect(params.get("username")).toBe("octocat");
      expect(params.get("issue_url")).toBe(MOCK_RECOMMENDED_ISSUES[index].url);
      expect(params.get("match_score")).toBe(
        String(
          Math.round(
            MOCK_RECOMMENDED_ISSUES[index].match_score ?? MOCK_RECOMMENDED_ISSUES[index].score ?? 0
          )
        )
      );
    });
  });

  it("hides a recommendation, keeps it hidden after remount, and restores it", () => {
    const issues = MOCK_RECOMMENDED_ISSUES.slice(0, 2);
    const { unmount } = render(<RecommendedIssuesList issues={issues} username="octocat" />);
    fireEvent.click(screen.getAllByRole("button", { name: "Not interested" })[0]);
    expect(screen.queryByText(issues[0].title)).not.toBeInTheDocument();
    expect(screen.getByText(issues[1].title)).toBeInTheDocument();

    unmount();
    render(<RecommendedIssuesList issues={issues} username="octocat" />);
    expect(screen.queryByText(issues[0].title)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show hidden (1)" }));
    expect(screen.getByText(issues[0].title)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByRole("button", { name: "Show hidden (1)" })).not.toBeInTheDocument();
    expect(screen.getByText(issues[0].title)).toBeInTheDocument();
    const feedbackLinks = screen.getAllByRole("link", { name: /Report wrong match for/i });
    expect(feedbackLinks).toHaveLength(issues.length);
    expect(new URL(feedbackLinks[0].getAttribute("href")!).searchParams.get("username")).toBe(
      "octocat"
    );
  });

  it("shows demo data / coming soon banner when isMock is true", () => {
    render(
      <RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} isMock={true} username="octocat" />
    );

    expect(screen.getByTestId("coming-soon-banner-badge")).toHaveTextContent(
      "Demo Data • Coming Soon"
    );
    expect(screen.getByText("Live matching service is currently in preview")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Displaying realistic open-source issues matched to @octocat's technical skill set/i
      )
    ).toBeInTheDocument();
  });

  it("filters issues by difficulty dropdown", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    const diffSelect = screen.getByLabelText(/Filter issues by difficulty/i);
    fireEvent.change(diffSelect, { target: { value: "beginner" } });

    // Should only show beginner issues
    const beginnerBadges = screen.getAllByTestId("difficulty-badge");
    expect(beginnerBadges.length).toBeGreaterThan(0);
    beginnerBadges.forEach((badge) => {
      expect(badge).toHaveTextContent("Beginner");
    });
  });

  it("filters issues by language dropdown", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    const langSelect = screen.getByLabelText(/Filter issues by programming language/i);
    fireEvent.change(langSelect, { target: { value: "Python" } });

    expect(screen.getByText("tiangolo/fastapi")).toBeInTheDocument();
    expect(screen.queryByText("vercel/next.js")).not.toBeInTheDocument();
  });

  it("filters issues by search query in title or repository", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    const searchInput = screen.getByLabelText(/Filter issues by title or repository/i);
    fireEvent.change(searchInput, { target: { value: "ripgrep" } });

    expect(screen.getByText("BurntSushi/ripgrep")).toBeInTheDocument();
    expect(screen.queryByText("vercel/next.js")).not.toBeInTheDocument();
  });

  it("renders filter empty state when no issues match filter and allows reset", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    const searchInput = screen.getByLabelText(/Filter issues by title or repository/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent-query-string-xyz" } });

    expect(screen.getByTestId("filter-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No issues match your filters")).toBeInTheDocument();

    // Click reset button
    const resetBtn = screen.getByRole("button", { name: /clear filters|reset filters/i });
    fireEvent.click(resetBtn);

    // List is restored
    expect(screen.queryByTestId("filter-empty-state")).not.toBeInTheDocument();
    expect(screen.getByText(MOCK_RECOMMENDED_ISSUES[0].title)).toBeInTheDocument();
  });

  it("renders overall empty state when issues array is empty", () => {
    render(<RecommendedIssuesList issues={[]} />);

    expect(screen.getByTestId("no-issues-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No issues found")).toBeInTheDocument();
  });

  it("renders Learning Mode toggle and reveals target skills picker when toggled", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    const toggle = screen.getByTestId("learning-mode-toggle");
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();

    // Target skills picker is not rendered yet
    expect(screen.queryByTestId("target-skills-picker")).not.toBeInTheDocument();

    // Toggle Learning Mode ON
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(screen.getByTestId("learning-mode-active-indicator")).toBeInTheDocument();

    const picker = screen.getByTestId("target-skills-picker");
    expect(picker).toBeInTheDocument();
    expect(screen.getByTestId("target-skill-chip-Rust")).toBeInTheDocument();
    expect(screen.getByTestId("target-skill-chip-Python")).toBeInTheDocument();
  });

  it("re-ranks issues to favour chosen target skills when learning mode is active and restores when toggled off", () => {
    render(<RecommendedIssuesList issues={MOCK_RECOMMENDED_ISSUES} />);

    // Default ranking top issue is TypeScript (vercel/next.js)
    const initialCards = screen.getAllByRole("article");
    expect(initialCards[0]).toHaveTextContent("vercel/next.js");

    // Toggle Learning Mode ON
    const toggle = screen.getByTestId("learning-mode-toggle");
    fireEvent.click(toggle);

    // Pick target skill "Rust"
    const rustChip = screen.getByTestId("target-skill-chip-Rust");
    fireEvent.click(rustChip);

    // After picking Rust, top card should become BurntSushi/ripgrep (Rust, Beginner)
    const learningCards = screen.getAllByRole("article");
    expect(learningCards[0]).toHaveTextContent("BurntSushi/ripgrep");
    expect(screen.getByTestId("learning-mode-badge")).toHaveTextContent("Learning: Rust");
    expect(
      screen.getByText(
        /Picked for Learning Mode: beginner-friendly starter issue to help you learn and grow into Rust/i
      )
    ).toBeInTheDocument();

    // Toggle Learning Mode OFF
    fireEvent.click(toggle);

    // Ranking is restored to initial order
    const restoredCards = screen.getAllByRole("article");
    expect(restoredCards[0]).toHaveTextContent("vercel/next.js");
  });

  describe("Filters, Sorting, and Result Count", () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const testIssues = [
      {
        id: 1,
        title: "Add TypeScript strict null checks",
        repository: "facebook/react",
        url: "https://github.com/facebook/react/issues/1",
        state: "open",
        labels: ["good first issue", "typescript"],
        comments: 5,
        created_at: new Date(now - 2 * dayMs).toISOString(), // 2 days ago
        updated_at: new Date(now - 1 * dayMs).toISOString(), // 1 day ago
        language: "TypeScript",
        match_score: 95,
        stars: 230000, // 50k-plus
      },
      {
        id: 2,
        title: "Fix async session timeout in FastAPI backend",
        repository: "tiangolo/fastapi",
        url: "https://github.com/tiangolo/fastapi/issues/2",
        state: "open",
        labels: ["help wanted", "python"],
        comments: 10,
        created_at: new Date(now - 15 * dayMs).toISOString(), // 15 days ago
        updated_at: new Date(now - 10 * dayMs).toISOString(), // 10 days ago
        language: "Python",
        match_score: 85,
        stars: 75000, // 50k-plus
      },
      {
        id: 3,
        title: "Improve documentation for regex engine",
        repository: "BurntSushi/ripgrep",
        url: "https://github.com/BurntSushi/ripgrep/issues/3",
        state: "open",
        labels: ["good first issue", "docs"],
        comments: 2,
        created_at: new Date(now - 50 * dayMs).toISOString(), // 50 days ago
        updated_at: new Date(now - 25 * dayMs).toISOString(), // 25 days ago
        language: "Rust",
        match_score: 70,
        stars: 48000, // 10k-50k
      },
      {
        id: 4,
        title: "Add starter plugin template for small community CLI",
        repository: "acme/cli-starter",
        url: "https://github.com/acme/cli-starter/issues/4",
        state: "open",
        labels: ["help wanted"],
        comments: 1,
        created_at: new Date(now - 120 * dayMs).toISOString(), // 120 days ago
        updated_at: new Date(now - 100 * dayMs).toISOString(), // 100 days ago
        language: "Go",
        match_score: 60,
        stars: 3500, // 1k-10k
      },
      {
        id: 5,
        title: "Fix typo in readme tutorial",
        repository: "micro/tiny-lib",
        url: "https://github.com/micro/tiny-lib/issues/5",
        state: "open",
        labels: ["good first issue"],
        comments: 0,
        created_at: new Date(now - 200 * dayMs).toISOString(), // 200 days ago
        updated_at: new Date(now - 180 * dayMs).toISOString(), // 180 days ago
        language: "JavaScript",
        match_score: 50,
        stars: 450, // under-1k
      },
    ];

    it("filters issues by repository star range dropdown", () => {
      render(<RecommendedIssuesList issues={testIssues} />);

      const starsSelect = screen.getByLabelText(/Filter issues by repository star range/i);

      // Filter: under-1k (< 1,000)
      fireEvent.change(starsSelect, { target: { value: "under-1k" } });
      expect(screen.getByText("micro/tiny-lib")).toBeInTheDocument();
      expect(screen.queryByText("facebook/react")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 1 of 5 issues");

      // Filter: 1k-10k
      fireEvent.change(starsSelect, { target: { value: "1k-10k" } });
      expect(screen.getByText("acme/cli-starter")).toBeInTheDocument();
      expect(screen.queryByText("micro/tiny-lib")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 1 of 5 issues");

      // Filter: 10k-50k
      fireEvent.change(starsSelect, { target: { value: "10k-50k" } });
      expect(screen.getByText("BurntSushi/ripgrep")).toBeInTheDocument();
      expect(screen.queryByText("acme/cli-starter")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 1 of 5 issues");

      // Filter: 50k-plus
      fireEvent.change(starsSelect, { target: { value: "50k-plus" } });
      expect(screen.getByText("facebook/react")).toBeInTheDocument();
      expect(screen.getByText("tiangolo/fastapi")).toBeInTheDocument();
      expect(screen.queryByText("BurntSushi/ripgrep")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 2 of 5 issues");
    });

    it("filters issues by last activity dropdown", () => {
      render(<RecommendedIssuesList issues={testIssues} />);

      const activitySelect = screen.getByLabelText(/Filter issues by last activity/i);

      // Past 7 days
      fireEvent.change(activitySelect, { target: { value: "7d" } });
      expect(screen.getByText("facebook/react")).toBeInTheDocument();
      expect(screen.queryByText("tiangolo/fastapi")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 1 of 5 issues");

      // Past 30 days
      fireEvent.change(activitySelect, { target: { value: "30d" } });
      expect(screen.getByText("facebook/react")).toBeInTheDocument();
      expect(screen.getByText("tiangolo/fastapi")).toBeInTheDocument();
      expect(screen.getByText("BurntSushi/ripgrep")).toBeInTheDocument();
      expect(screen.queryByText("acme/cli-starter")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 3 of 5 issues");

      // Past 90 days
      fireEvent.change(activitySelect, { target: { value: "90d" } });
      expect(screen.getByText("facebook/react")).toBeInTheDocument();
      expect(screen.getByText("tiangolo/fastapi")).toBeInTheDocument();
      expect(screen.getByText("BurntSushi/ripgrep")).toBeInTheDocument();
      expect(screen.queryByText("acme/cli-starter")).not.toBeInTheDocument();
      expect(screen.queryByText("micro/tiny-lib")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 3 of 5 issues");

      // Reset to all
      fireEvent.change(activitySelect, { target: { value: "all" } });
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 5 of 5 issues");
    });

    it("sorts issues by match score, newest, and recently updated", () => {
      render(<RecommendedIssuesList issues={testIssues} />);

      const sortSelect = screen.getByLabelText(/Sort recommendations/i);

      // Default: match_score (highest score first)
      let articles = screen.getAllByRole("article");
      expect(articles[0]).toHaveTextContent("facebook/react"); // score 95
      expect(articles[1]).toHaveTextContent("tiangolo/fastapi"); // score 85

      // Sort: newest created first
      fireEvent.change(sortSelect, { target: { value: "newest" } });
      articles = screen.getAllByRole("article");
      expect(articles[0]).toHaveTextContent("facebook/react"); // 2 days ago
      expect(articles[1]).toHaveTextContent("tiangolo/fastapi"); // 15 days ago
      expect(articles[4]).toHaveTextContent("micro/tiny-lib"); // 200 days ago

      // Sort: recently updated first
      fireEvent.change(sortSelect, { target: { value: "recently_updated" } });
      articles = screen.getAllByRole("article");
      expect(articles[0]).toHaveTextContent("facebook/react"); // updated 1 day ago
      expect(articles[1]).toHaveTextContent("tiangolo/fastapi"); // updated 10 days ago
      expect(articles[2]).toHaveTextContent("BurntSushi/ripgrep"); // updated 25 days ago
    });

    it("combines several filters correctly (language, label, stars, and activity)", () => {
      render(<RecommendedIssuesList issues={testIssues} />);

      const langSelect = screen.getByLabelText(/Filter issues by programming language/i);
      const labelSelect = screen.getByLabelText(/Filter issues by label type/i);
      const starsSelect = screen.getByLabelText(/Filter issues by repository star range/i);
      const activitySelect = screen.getByLabelText(/Filter issues by last activity/i);

      // Combine: language TypeScript + label Good First Issue + stars 50k-plus + activity 7d
      fireEvent.change(langSelect, { target: { value: "TypeScript" } });
      fireEvent.change(labelSelect, { target: { value: "good-first-issue" } });
      fireEvent.change(starsSelect, { target: { value: "50k-plus" } });
      fireEvent.change(activitySelect, { target: { value: "7d" } });

      expect(screen.getByText("facebook/react")).toBeInTheDocument();
      expect(screen.queryByText("tiangolo/fastapi")).not.toBeInTheDocument();
      expect(screen.queryByText("BurntSushi/ripgrep")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 1 of 5 issues");

      // Change label to help-wanted -> no matches for TypeScript + help-wanted in testIssues
      fireEvent.change(labelSelect, { target: { value: "help-wanted" } });
      expect(screen.getByTestId("filter-empty-state")).toBeInTheDocument();
      expect(screen.getByText("No issues match your filters")).toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 0 of 5 issues");

      // Click "Clear filters" in the empty state
      const clearBtn = screen.getByTestId("clear-filters-button");
      expect(clearBtn).toHaveTextContent("Clear filters");
      fireEvent.click(clearBtn);

      // List is restored
      expect(screen.queryByTestId("filter-empty-state")).not.toBeInTheDocument();
      expect(screen.getByTestId("result-count")).toHaveTextContent("Showing 5 of 5 issues");
    });
  });
});
