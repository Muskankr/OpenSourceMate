import React from "react";
import { render, screen } from "@testing-library/react";
import AccessibilityPage from "../app/accessibility/page";

describe("Accessibility Statement Page (Issue #334)", () => {
  it("renders the main heading and introductory statement", () => {
    render(<AccessibilityPage />);

    const heading = screen.getByRole("heading", { level: 1, name: "Accessibility Statement" });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/OpenSourceMate is dedicated to ensuring digital accessibility/i)).toBeInTheDocument();
  });

  it("describes the target compliance standard as WCAG 2.2 Level AA", () => {
    render(<AccessibilityPage />);

    expect(screen.getByText(/Target: WCAG 2.2 Level AA/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Web Content Accessibility Guidelines \(WCAG\) 2.2 at Level AA/i)
    ).toBeInTheDocument();
  });

  it("documents known limitations matching the latest audit results", () => {
    render(<AccessibilityPage />);

    expect(screen.getByText(/03\./)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Known Limitations & Alternative Approaches/i })
    ).toBeInTheDocument();

    // Verify key audit limitations
    expect(screen.getByText(/User-Generated GitHub Content:/i)).toBeInTheDocument();
    expect(screen.getByText(/External Profile Avatars:/i)).toBeInTheDocument();
    expect(screen.getByText(/Dense Visualizations on Narrow Devices/i)).toBeInTheDocument();
    expect(screen.getByText(/GitHub API Rate Limit Live Announcements:/i)).toBeInTheDocument();
  });

  it("explains how to report an accessibility problem with direct feedback links", () => {
    render(<AccessibilityPage />);

    expect(screen.getByText(/05\./)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Feedback & How to Report a Problem/i })
    ).toBeInTheDocument();

    const reportLink = screen.getByRole("link", { name: /GitHub Issue Tracker ↗/i });
    expect(reportLink).toBeInTheDocument();
    expect(reportLink).toHaveAttribute("target", "_blank");
    expect(reportLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(reportLink.getAttribute("href")).toContain("title=%5BAccessibility%5D");

    expect(screen.getByText(/within 3 to 5 business days/i)).toBeInTheDocument();
  });

  it("displays the review date and assessment methodology", () => {
    render(<AccessibilityPage />);

    expect(screen.getByText(/Last Reviewed:/i)).toBeInTheDocument();
    expect(screen.getByText(/November 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit Reference:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/axe-core/i).length).toBeGreaterThanOrEqual(1);
  });

  it("contains an accessible main landmark with skip target id='main-content'", () => {
    const { container } = render(<AccessibilityPage />);

    const mainLandmark = container.querySelector("main#main-content");
    expect(mainLandmark).toBeInTheDocument();
  });
});
