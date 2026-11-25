import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HowItWorksPage from "../app/how-it-works/page";
import { HOW_IT_WORKS_CONTENT } from "../data/howItWorksContent";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/how-it-works",
  useSearchParams: () => new URLSearchParams(),
}));

describe("HowItWorksPage Component (#445)", () => {
  it("renders hero section with title and quick navigation links", () => {
    render(<HowItWorksPage />);

    expect(screen.getByRole("heading", { level: 1, name: /How It Works & Privacy/i })).toBeInTheDocument();
    expect(screen.getByText(/Transparent open-source analysis with zero secrets/i)).toBeInTheDocument();

    // Verify quick jump navigation links
    HOW_IT_WORKS_CONTENT.navigationSections.forEach((sec) => {
      expect(screen.getByRole("link", { name: new RegExp(sec.title, "i") })).toBeInTheDocument();
    });
  });

  it("renders all five main content sections", () => {
    render(<HowItWorksPage />);

    expect(screen.getByRole("heading", { level: 2, name: /01\. Public GitHub Data Only/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /02\. How Skills Are Detected/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /03\. How Issues Are Matched/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /04\. What Is Stored vs\. What Is Not/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /05\. Frequently Asked Questions/i })).toBeInTheDocument();
  });

  it("renders data read vs never accessed breakdown", () => {
    render(<HowItWorksPage />);

    expect(screen.getByText("What OpenSourceMate Reads")).toBeInTheDocument();
    expect(screen.getByText("What We Never Access")).toBeInTheDocument();
    expect(screen.getByText("Public User Profile")).toBeInTheDocument();
    expect(screen.getByText("Private Repositories & Commits")).toBeInTheDocument();
  });

  it("renders the storage comparison table with checkmarks and locations", () => {
    render(<HowItWorksPage />);

    expect(screen.getByText("Data Element")).toBeInTheDocument();
    expect(screen.getByText("Storage Location")).toBeInTheDocument();
    expect(screen.getByText("Recent Searches")).toBeInTheDocument();
    expect(screen.getByText("Saved Bookmarks & Private Notes")).toBeInTheDocument();
    expect(screen.getByText("User Accounts, Passwords & Credentials")).toBeInTheDocument();
    expect(screen.getByText("Persistent Database Records")).toBeInTheDocument();
  });

  it("filters FAQ items when clicking category buttons", () => {
    render(<HowItWorksPage />);

    const skillFilterBtn = screen.getByTestId("faq-cat-filter-skill-detection");
    fireEvent.click(skillFilterBtn);

    // Skill detection FAQs should be visible
    expect(
      screen.getByText("Why are some forked repositories excluded from my skills?")
    ).toBeInTheDocument();
  });

  it("filters FAQ items in real-time when typing in search input", () => {
    render(<HowItWorksPage />);

    const searchInput = screen.getByTestId("faq-search-input");
    fireEvent.change(searchInput, { target: { value: "forked repositories" } });

    expect(
      screen.getByText("Why are some forked repositories excluded from my skills?")
    ).toBeInTheDocument();

    // Non-matching questions should not appear
    expect(
      screen.queryByText("Can OpenSourceMate access my private repositories or private commits?")
    ).not.toBeInTheDocument();
  });

  it("toggles FAQ accordion open and closed", () => {
    render(<HowItWorksPage />);

    const firstQuestionBtn = screen.getByTestId("faq-question-btn-0");
    expect(firstQuestionBtn).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    fireEvent.click(firstQuestionBtn);
    expect(firstQuestionBtn).toHaveAttribute("aria-expanded", "true");

    const answerPanel = screen.getByTestId("faq-answer-panel-0");
    expect(answerPanel).not.toHaveAttribute("hidden");

    // Click to collapse
    fireEvent.click(firstQuestionBtn);
    expect(firstQuestionBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("shows empty state when search query matches nothing", () => {
    render(<HowItWorksPage />);

    const searchInput = screen.getByTestId("faq-search-input");
    fireEvent.change(searchInput, { target: { value: "xyznonexistentquery123" } });

    expect(screen.getByText(/No matching questions found/i)).toBeInTheDocument();
  });
});
