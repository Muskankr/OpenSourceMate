import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContributorFriendlinessChecklist, {
  type FriendlinessResult,
} from "../components/ContributorFriendlinessChecklist";

describe("ContributorFriendlinessChecklist Component (#270)", () => {
  const mockFriendlinessData: FriendlinessResult = {
    repository: "octocat/Spoon-Knife",
    exists: true,
    is_accessible: true,
    is_archived: false,
    stars: 12500,
    primary_language: "HTML",
    good_first_issues_count: 5,
    passed_checks_count: 5,
    total_checks_count: 6,
    checks: [
      {
        id: "contributing_guide",
        label: "Contributing Guide",
        passed: true,
        explanation: "Clear guidelines are provided.",
      },
      {
        id: "code_of_conduct",
        label: "Code of Conduct",
        passed: true,
        explanation: "Community code of conduct detected.",
      },
      {
        id: "open_source_license",
        label: "Open Source License",
        passed: true,
        explanation: "Licensed under MIT.",
      },
      {
        id: "active_development",
        label: "Recent Commits (Past 90 Days)",
        passed: true,
        explanation: "Active commits merged recently.",
      },
      {
        id: "beginner_issues",
        label: "Good First Issues",
        passed: true,
        explanation: "Found 5 open good first issues.",
      },
      {
        id: "maintainer_response_time",
        label: "Response Time to Inquiries",
        passed: false,
        explanation: "Median response time is ~96 hours.",
      },
    ],
  };

  it("renders input field and inspect button initially", () => {
    render(<ContributorFriendlinessChecklist theme="dark" />);

    expect(screen.getByPlaceholderText(/e.g. facebook\/react/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inspect Repository/i })).toBeInTheDocument();
  });

  it("submits repository and renders checklist items with explanations", async () => {
    const onAnalyze = jest.fn().mockResolvedValue(mockFriendlinessData);

    render(
      <ContributorFriendlinessChecklist
        theme="dark"
        initialRepo="octocat/Spoon-Knife"
        onAnalyze={onAnalyze}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Inspect Repository/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAnalyze).toHaveBeenCalledWith("octocat/Spoon-Knife");
      expect(screen.getByText("octocat/Spoon-Knife")).toBeInTheDocument();
      expect(screen.getByText("5 of 6")).toBeInTheDocument();
      expect(screen.getByText("Contributing Guide")).toBeInTheDocument();
      expect(screen.getByText("Clear guidelines are provided.")).toBeInTheDocument();
      expect(screen.getByText("Code of Conduct")).toBeInTheDocument();
      expect(screen.getByText("Good First Issues")).toBeInTheDocument();
    });
  });

  it("handles inaccessible or private repository gracefully", async () => {
    const inaccessibleData: FriendlinessResult = {
      repository: "private/secret-repo",
      exists: false,
      is_accessible: false,
      message: "Repository not found or is private.",
    };

    const onAnalyze = jest.fn().mockResolvedValue(inaccessibleData);

    render(
      <ContributorFriendlinessChecklist
        theme="dark"
        initialRepo="private/secret-repo"
        onAnalyze={onAnalyze}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Inspect Repository/i }));

    await waitFor(() => {
      expect(screen.getByText("Repository not found or is private.")).toBeInTheDocument();
    });
  });
});
