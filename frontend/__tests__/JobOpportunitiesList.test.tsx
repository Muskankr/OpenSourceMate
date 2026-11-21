import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JobOpportunitiesList from "../components/JobOpportunitiesList";
import { InMemoryJobDataSource } from "../services/jobDataSource";
import type { JobListing } from "../types/jobs";

describe("JobOpportunitiesList Component", () => {
  const mockListings: JobListing[] = [
    {
      id: "job-fe",
      title: "Frontend Engineering Intern",
      company: "Acme Web",
      location: "Remote",
      roleType: "internship",
      experienceLevel: "entry",
      requiredSkills: ["TypeScript", "React"],
      preferredSkills: ["Next.js"],
      description: "Build user interfaces for student tools.",
      applyUrl: "https://example.com/apply-fe",
    },
    {
      id: "job-be",
      title: "Backend Engineer",
      company: "Data Corp",
      location: "Bengaluru, India",
      roleType: "full-time",
      experienceLevel: "mid",
      requiredSkills: ["Python", "SQL"],
      description: "Scale backend APIs and databases.",
      applyUrl: "https://example.com/apply-be",
    },
    {
      id: "job-cloud",
      title: "Cloud Infrastructure Specialist",
      company: "Cloud Network",
      location: "San Francisco, CA",
      roleType: "full-time",
      experienceLevel: "senior",
      requiredSkills: ["Go", "Kubernetes"],
      description: "Design edge routing and container networks.",
      applyUrl: "https://example.com/apply-cloud",
    },
  ];

  it("renders ranked listings with matched skills and match reasons", () => {
    const studentSkills = ["TypeScript", "React"];
    const testDataSource = new InMemoryJobDataSource(mockListings);

    render(<JobOpportunitiesList studentSkills={studentSkills} dataSource={testDataSource} />);

    // Section header
    expect(screen.getByText("Student Job & Internship Matches")).toBeInTheDocument();

    // Ranks Frontend Intern highest because of TypeScript and React match
    expect(screen.getByText("Frontend Engineering Intern ↗")).toBeInTheDocument();

    // Acceptance criterion: Each recommendation lists the matched skills
    const matchedBadges = screen.getAllByTestId("matched-skill-badge");
    expect(matchedBadges.length).toBeGreaterThan(0);
    expect(matchedBadges[0]).toHaveTextContent("TypeScript");

    // Shows match reason
    const matchReasons = screen.getAllByTestId("match-reason-box");
    expect(matchReasons.length).toBeGreaterThan(0);
    expect(matchReasons[0]).toHaveTextContent(/fit|alignment/i);
  });

  it("updates the list when changing location filter", () => {
    const testDataSource = new InMemoryJobDataSource(mockListings);
    render(<JobOpportunitiesList studentSkills={["TypeScript"]} dataSource={testDataSource} />);

    expect(screen.getByText(/Showing 3 of 3 opportunities/i)).toBeInTheDocument();

    // Change location filter to "Remote"
    const locationSelect = screen.getByLabelText(/Filter opportunities by location/i);
    fireEvent.change(locationSelect, { target: { value: "Remote" } });

    // Acceptance criterion: Changing a filter updates the list
    expect(screen.getByText(/Showing 1 of 3 opportunities/i)).toBeInTheDocument();
    expect(screen.getByText("Acme Web")).toBeInTheDocument();
    expect(screen.queryByText("Data Corp")).not.toBeInTheDocument();
  });

  it("updates the list when changing role type filter", () => {
    const testDataSource = new InMemoryJobDataSource(mockListings);
    render(<JobOpportunitiesList dataSource={testDataSource} />);

    // Filter by role type: internship
    const roleSelect = screen.getByLabelText(/Filter opportunities by role type/i);
    fireEvent.change(roleSelect, { target: { value: "internship" } });

    expect(screen.getByText(/Showing 1 of 3 opportunities/i)).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineering Intern ↗")).toBeInTheDocument();
    expect(screen.queryByText("Backend Engineer ↗")).not.toBeInTheDocument();
  });

  it("updates the list when changing experience level filter", () => {
    const testDataSource = new InMemoryJobDataSource(mockListings);
    render(<JobOpportunitiesList dataSource={testDataSource} />);

    // Filter by experience level: senior
    const expSelect = screen.getByLabelText(/Filter opportunities by experience level/i);
    fireEvent.change(expSelect, { target: { value: "senior" } });

    expect(screen.getByText(/Showing 1 of 3 opportunities/i)).toBeInTheDocument();
    expect(screen.getByText("Cloud Infrastructure Specialist ↗")).toBeInTheDocument();
    expect(screen.queryByText("Frontend Engineering Intern ↗")).not.toBeInTheDocument();
  });

  it("shows suggestions to broaden filters when nothing matches and allows one-click broadening", () => {
    const testDataSource = new InMemoryJobDataSource(mockListings);
    render(<JobOpportunitiesList dataSource={testDataSource} />);

    // Select Remote location AND senior experience (which doesn't exist in mockListings)
    const locationSelect = screen.getByLabelText(/Filter opportunities by location/i);
    fireEvent.change(locationSelect, { target: { value: "Remote" } });

    const expSelect = screen.getByLabelText(/Filter opportunities by experience level/i);
    fireEvent.change(expSelect, { target: { value: "senior" } });

    // Empty state should appear
    expect(screen.getByTestId("job-filter-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No opportunities match your filters")).toBeInTheDocument();

    // Broadening suggestions appear
    const suggestionButtons = screen.getAllByTestId("broaden-suggestion-btn");
    expect(suggestionButtons.length).toBeGreaterThan(0);

    // Click on suggestion to expand experience level
    const expandExpButton = suggestionButtons.find((btn) =>
      btn.textContent?.includes("experience")
    );
    expect(expandExpButton).toBeDefined();

    fireEvent.click(expandExpButton!);

    // Should now show results again because experience level was broadened to "all"
    expect(screen.queryByTestId("job-filter-empty-state")).not.toBeInTheDocument();
    expect(screen.getByText("Frontend Engineering Intern ↗")).toBeInTheDocument();
  });

  it("resets all filters when clicking reset button", () => {
    const testDataSource = new InMemoryJobDataSource(mockListings);
    render(<JobOpportunitiesList dataSource={testDataSource} />);

    const searchInput = screen.getByLabelText(/Filter opportunities by role title/i);
    fireEvent.change(searchInput, { target: { value: "non-existent-query" } });

    expect(screen.getByTestId("job-filter-empty-state")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: "Reset All Filters" });
    fireEvent.click(resetBtn);

    expect(screen.queryByTestId("job-filter-empty-state")).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 3 of 3 opportunities/i)).toBeInTheDocument();
  });

  it("renders empty state when data source returns zero listings", () => {
    const emptyDataSource = new InMemoryJobDataSource([]);
    render(<JobOpportunitiesList dataSource={emptyDataSource} />);

    expect(screen.getByTestId("no-jobs-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No job opportunities loaded")).toBeInTheDocument();
  });

  it("verifies the data source can be swapped without changing ranking code", () => {
    const sourceA = new InMemoryJobDataSource([
      {
        id: "source-a-job",
        title: "Source A Engineer",
        company: "Alpha",
        location: "Remote",
        roleType: "internship",
        experienceLevel: "entry",
        requiredSkills: ["TypeScript"],
        description: "From source A",
      },
    ]);

    const sourceB = new InMemoryJobDataSource([
      {
        id: "source-b-job",
        title: "Source B Developer",
        company: "Beta",
        location: "Remote",
        roleType: "full-time",
        experienceLevel: "mid",
        requiredSkills: ["Python"],
        description: "From source B",
      },
    ]);

    const { rerender } = render(
      <JobOpportunitiesList studentSkills={["TypeScript"]} dataSource={sourceA} />
    );
    expect(screen.getByText("Source A Engineer")).toBeInTheDocument();

    // Rerender with swapped data source
    rerender(<JobOpportunitiesList studentSkills={["Python"]} dataSource={sourceB} />);
    expect(screen.queryByText("Source A Engineer")).not.toBeInTheDocument();
    expect(screen.getByText("Source B Developer")).toBeInTheDocument();
  });
});
