import React from "react";
import { render, screen } from "@testing-library/react";
import ResponsivenessBadge from "../components/ResponsivenessBadge";
import { setCachedResponsiveness, determineResponsiveness } from "../utils/repoResponsiveness";

describe("ResponsivenessBadge Component", () => {
  it("renders Fast badge with proper label and accessible tooltip", () => {
    render(
      <ResponsivenessBadge
        repository="vercel/next.js"
        responsiveness="Fast"
        tooltipText="Fast: Maintainers typically respond within 24 hours."
      />
    );

    const badge = screen.getByTestId("responsiveness-badge");
    expect(badge).toHaveTextContent("Fast");
    expect(badge).toHaveAttribute("title", "Fast: Maintainers typically respond within 24 hours.");
    expect(badge).toHaveAttribute("aria-label", expect.stringContaining("Fast"));

    const tooltip = screen.getByTestId("responsiveness-tooltip");
    expect(tooltip).toHaveTextContent("Maintainers typically respond within 24 hours.");
  });

  it("renders Moderate badge with proper label and tooltip", () => {
    render(
      <ResponsivenessBadge
        repository="facebook/react"
        responsiveness="Moderate"
        tooltipText="Moderate: Maintainers typically respond within 1 to 3 days."
      />
    );

    const badge = screen.getByTestId("responsiveness-badge");
    expect(badge).toHaveTextContent("Moderate");
    expect(badge).toHaveAttribute(
      "title",
      "Moderate: Maintainers typically respond within 1 to 3 days."
    );
  });

  it("renders Slow badge with proper label and tooltip", () => {
    render(
      <ResponsivenessBadge
        repository="slow/repo"
        responsiveness="Slow"
        tooltipText="Slow: Maintainers take more than 3 days to respond."
      />
    );

    const badge = screen.getByTestId("responsiveness-badge");
    expect(badge).toHaveTextContent("Slow");
    expect(badge).toHaveAttribute("title", "Slow: Maintainers take more than 3 days to respond.");
  });

  it("renders 'Not enough data' label when data is insufficient", () => {
    render(
      <ResponsivenessBadge
        repository="unknown/sparse-repo"
        responsiveness="Not enough data"
        tooltipText="Not enough data: Fewer than 3 recent discussions analyzed."
      />
    );

    const badge = screen.getByTestId("responsiveness-badge");
    expect(badge).toHaveTextContent("Not enough data");
    expect(badge).toHaveAttribute(
      "title",
      "Not enough data: Fewer than 3 recent discussions analyzed."
    );
  });

  it("loads and displays rating from cache automatically", async () => {
    const cachedResult = determineResponsiveness({
      repository: "cached/my-repo",
      medianResponseHours: 14.0,
      sampleCount: 10,
    });
    setCachedResponsiveness("cached/my-repo", cachedResult);

    render(<ResponsivenessBadge repository="cached/my-repo" />);

    const badge = await screen.findByTestId("responsiveness-badge");
    expect(badge).toHaveTextContent("Fast");
  });
});
