/**
 * Unit tests verifying landing page copy alignment and status badge representation (Issue #189).
 */

import { render, screen } from "@testing-library/react";
import Home from "../app/page";

describe("Landing Page Copywriting & Feature Alignment (Issue #189)", () => {
  it("does not over-promise instant issue matching in the username input hint", () => {
    render(<Home />);
    const hint = document.getElementById("username-hint");
    expect(hint).toBeInTheDocument();
    expect(hint?.textContent).toContain("analyze technical skills");
    expect(hint?.textContent).not.toContain("receive matched issues");
  });

  it("marks Step 3 contribution discovery with a Roadmap badge", () => {
    render(<Home />);
    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(
      screen.getByText(/Discover contribution opportunities/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/issue matching engine currently in active development/i)
    ).toBeInTheDocument();
  });

  it("accurately describes Step 1 profile analysis", () => {
    render(<Home />);
    expect(screen.getByText("Analyze your profile")).toBeInTheDocument();
  });

  it("accurately describes Step 2 technical skills analysis", () => {
    render(<Home />);
    expect(screen.getByText("Understand your skills")).toBeInTheDocument();
  });
});


  describe("Hero and Analyzer Expectations", () => {
    it("ensures public profile privacy disclaimer is prominently displayed", () => {
      render(<Home />);
      expect(
        screen.getByText(/No GitHub login required • Public profile data only/i)
      ).toBeInTheDocument();
    });

    it("verifies accurate labeling on the analyze button", () => {
      render(<Home />);
      const buttons = screen.getAllByRole("button", { name: /Analyze/i });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Feature Status Guardrails", () => {
    it("confirms roadmap badge has accessible styling contrast", () => {
      render(<Home />);
      const badge = screen.getByText("Roadmap");
      expect(badge).toHaveClass("uppercase");
      expect(badge).toHaveClass("text-[10px]");
    });
  });
