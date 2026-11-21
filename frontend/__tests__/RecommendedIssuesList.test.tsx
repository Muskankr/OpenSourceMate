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
    const resetBtn = screen.getByRole("button", { name: "Reset Filters" });
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
});
