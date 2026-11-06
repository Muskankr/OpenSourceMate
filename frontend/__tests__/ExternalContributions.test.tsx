/**
 * Unit & Component tests verifying ExternalContributions component (Issue #192).
 */

import { render, screen } from "@testing-library/react";
import ExternalContributions, {
  type ExternalPrHistory,
} from "../components/ExternalContributions";

describe("ExternalContributions Component (Issue #192)", () => {
  it("renders encouraging zero-state when total_merged_prs is 0", () => {
    const zeroData: ExternalPrHistory = {
      username: "beginner",
      total_merged_prs: 0,
      repositories_count: 0,
      top_repositories: [],
      recent_prs: [],
    };

    render(<ExternalContributions data={zeroData} />);
    expect(screen.getByText("Open-Source Contributions")).toBeInTheDocument();
    expect(screen.getByText("0 Merged PRs")).toBeInTheDocument();
    expect(screen.getByText(/first open-source contribution/i)).toBeInTheDocument();
  });

  it("renders total merged PR count and repository links when data is present", () => {
    const activeData: ExternalPrHistory = {
      username: "octocat",
      total_merged_prs: 15,
      repositories_count: 2,
      top_repositories: [
        { repository: "facebook/react", count: 10 },
        { repository: "vercel/next.js", count: 5 },
      ],
      recent_prs: [],
    };

    render(<ExternalContributions data={activeData} />);
    expect(screen.getByText("External Open-Source Impact")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText(/facebook\/react/i)).toBeInTheDocument();
    expect(screen.getByText(/vercel\/next.js/i)).toBeInTheDocument();
  });

  it("renders animated skeleton during loading state", () => {
    const { container } = render(<ExternalContributions data={null} loading={true} />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });
});
