import React from "react";
import { render, screen } from "@testing-library/react";
import HealthBadge from "../components/HealthBadge";
import { setCachedHealth, determineHealthStatus } from "../utils/repoHealth";

describe("HealthBadge Component (Issue #416)", () => {
  it("renders Active badge with proper label and accessible tooltip", () => {
    render(
      <HealthBadge
        repository="sample-org/active-repo"
        status="Active"
        tooltipText="Active: Last commit 2d ago, 75% recent PRs merged, median response ~12h. Maintainers are actively shipping and reviewing."
      />
    );

    const badge = screen.getByTestId("health-badge");
    expect(badge).toHaveTextContent("Active");
    expect(badge).toHaveAttribute(
      "title",
      "Active: Last commit 2d ago, 75% recent PRs merged, median response ~12h. Maintainers are actively shipping and reviewing."
    );
    expect(badge).toHaveAttribute("aria-label", expect.stringContaining("Active"));

    const tooltip = screen.getByTestId("health-tooltip");
    expect(tooltip).toHaveTextContent("Maintainers are actively shipping and reviewing.");
  });

  it("renders Slow badge with proper label and tooltip", () => {
    render(
      <HealthBadge
        repository="sample-org/slow-repo"
        status="Slow"
        tooltipText="Slow: Last commit 45d ago, 35% recent PRs merged, median response ~96h. Maintainers respond, but reviews may take time."
      />
    );

    const badge = screen.getByTestId("health-badge");
    expect(badge).toHaveTextContent("Slow");
    expect(badge).toHaveAttribute(
      "title",
      "Slow: Last commit 45d ago, 35% recent PRs merged, median response ~96h. Maintainers respond, but reviews may take time."
    );
  });

  it("renders Inactive badge with proper label and tooltip", () => {
    render(
      <HealthBadge
        repository="sample-org/inactive-repo"
        status="Inactive"
        tooltipText="Inactive: Last commit 120d ago, 10% recent PRs merged, median response >7d. Minimal maintainer activity in recent months."
      />
    );

    const badge = screen.getByTestId("health-badge");
    expect(badge).toHaveTextContent("Inactive");
    expect(badge).toHaveAttribute(
      "title",
      "Inactive: Last commit 120d ago, 10% recent PRs merged, median response >7d. Minimal maintainer activity in recent months."
    );
  });

  it("renders 'Unknown' badge when data is insufficient (< 3 samples)", () => {
    render(
      <HealthBadge
        repository="sample-org/unknown-repo"
        status="Unknown"
        tooltipText="Unknown: Insufficient recent activity data (fewer than 3 items sampled) to determine repository health."
      />
    );

    const badge = screen.getByTestId("health-badge");
    expect(badge).toHaveTextContent("Unknown");
    expect(badge).toHaveAttribute(
      "title",
      "Unknown: Insufficient recent activity data (fewer than 3 items sampled) to determine repository health."
    );
  });

  it("loads and displays rating from cache automatically", async () => {
    const cachedResult = determineHealthStatus({
      repository: "cached/my-health-repo",
      daysSinceLastCommit: 2,
      mergedPrShare: 0.85,
      medianResponseHours: 14.0,
      sampleCount: 10,
    });
    setCachedHealth("cached/my-health-repo", cachedResult);

    render(<HealthBadge repository="cached/my-health-repo" />);

    const badge = await screen.findByTestId("health-badge");
    expect(badge).toHaveTextContent("Active");
  });
});
