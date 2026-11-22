import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IssueDetailDrawer from "../components/IssueDetailDrawer";
import type { IssueRecommendation } from "../types/api";
import { setCachedResponsiveness, determineResponsiveness } from "../utils/repoResponsiveness";
import { setCachedFriendlinessScore, calculateFriendlinessScore } from "../utils/repoFriendliness";

const mockIssue: IssueRecommendation = {
  id: 1001,
  number: 42,
  title: "Add dark mode toggle keyboard accessibility shortcut",
  repository: "vercel/next.js",
  url: "https://github.com/vercel/next.js/issues/42",
  state: "open",
  labels: ["good first issue", "accessibility", "frontend"],
  comments: 7,
  created_at: "2026-10-15T10:00:00Z",
  updated_at: "2026-10-28T14:30:00Z",
  language: "TypeScript",
  match_score: 95,
  difficulty: "Beginner",
  author: "timneutkens",
  explanation: "Matches your TypeScript and Next.js frontend skills.",
  body: `### Feature Proposal
Please add a global \`Ctrl+J\` shortcut to toggle themes.

\`\`\`typescript
const isShortcut = e.metaKey && e.key === 'j';
\`\`\`

- [x] Tested locally
- [ ] Added docs
`,
};

describe("IssueDetailDrawer Component (Issue #340)", () => {
  beforeAll(() => {
    setCachedResponsiveness(
      "vercel/next.js",
      determineResponsiveness({
        repository: "vercel/next.js",
        medianResponseHours: 8.0,
        sampleCount: 10,
      })
    );
    setCachedFriendlinessScore(
      "vercel/next.js",
      calculateFriendlinessScore("vercel/next.js", {
        hasContributing: true,
        hasCodeOfConduct: true,
        hasIssueTemplates: true,
        readmeLength: 4000,
        recentMergedPrs: 25,
      })
    );
  });

  it("does not render into the DOM when isOpen is false", () => {
    const handleClose = jest.fn();
    render(
      <IssueDetailDrawer
        issue={mockIssue}
        isOpen={false}
        onClose={handleClose}
      />
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Add dark mode toggle keyboard accessibility shortcut")).toBeNull();
  });

  it("renders all issue details, badges, and markdown when isOpen is true", () => {
    const handleClose = jest.fn();
    render(
      <IssueDetailDrawer
        issue={mockIssue}
        isOpen={true}
        onClose={handleClose}
        theme="dark"
      />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Title and repository
    expect(screen.getByText("Add dark mode toggle keyboard accessibility shortcut")).toBeInTheDocument();
    expect(screen.getByText("vercel/next.js")).toBeInTheDocument();
    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();

    // Metadata
    expect(screen.getByText(/95%/)).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByTestId("issue-comments-count")).toHaveTextContent("7 comments");
    expect(screen.getByText("Opened by @timneutkens")).toBeInTheDocument();

    // Labels
    expect(screen.getByText("good first issue")).toBeInTheDocument();
    expect(screen.getByText("accessibility")).toBeInTheDocument();

    // Markdown rendered
    expect(screen.getByText("Feature Proposal")).toBeInTheDocument();
    expect(screen.getByText("const isShortcut = e.metaKey && e.key === 'j';")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const handleClose = jest.fn();
    render(
      <IssueDetailDrawer
        issue={mockIssue}
        isOpen={true}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByTestId("close-drawer-button");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const handleClose = jest.fn();
    render(
      <IssueDetailDrawer
        issue={mockIssue}
        isOpen={true}
        onClose={handleClose}
      />
    );

    const backdrop = screen.getByTestId("issue-drawer-backdrop");
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the Escape key is pressed", () => {
    const handleClose = jest.fn();
    render(
      <IssueDetailDrawer
        issue={mockIssue}
        isOpen={true}
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders safe external link to GitHub with target='_blank' and rel='noopener noreferrer'", () => {
    render(
      <IssueDetailDrawer
        issue={mockIssue}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    const githubLink = screen.getByTestId("github-link-external");
    expect(githubLink).toHaveAttribute("href", "https://github.com/vercel/next.js/issues/42");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("truncates long issue bodies and toggles Show more / Show less", () => {
    const longBody = "This is a detailed paragraph about a complex bug. ".repeat(40);
    const issueWithLongBody: IssueRecommendation = {
      ...mockIssue,
      body: longBody,
    };

    render(
      <IssueDetailDrawer
        issue={issueWithLongBody}
        isOpen={true}
        onClose={jest.fn()}
        maxBodyLength={200}
      />
    );

    // Initial state: truncated
    const toggleBtn = screen.getByTestId("toggle-show-more");
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent("Show more");

    // Click to expand
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent("Show less");

    // Click to collapse
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent("Show more");
  });

  it("disarms malicious script injection in issue body", () => {
    const maliciousIssue: IssueRecommendation = {
      ...mockIssue,
      body: `<script>window.hacked = true;</script><img src="x" onerror="window.pwned=true;" />[Click here](javascript:alert(1))`,
    };

    const { container } = render(
      <IssueDetailDrawer
        issue={maliciousIssue}
        isOpen={true}
        onClose={jest.fn()}
      />
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector("a[href*='javascript']")).toBeNull();
  });
});
