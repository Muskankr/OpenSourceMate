import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SkillEvidenceToggle from "../components/SkillEvidenceToggle";
import { SkillEvidenceRepository } from "../types/api";

describe("SkillEvidenceToggle Component (Issue #480)", () => {
  const mockEvidence: SkillEvidenceRepository[] = [
    {
      name: "developer/react-dashboard",
      url: "https://github.com/developer/react-dashboard",
      bytes: 125000,
      share: 65.5,
      last_updated: "2026-03-10T12:00:00Z",
    },
    {
      name: "developer/mobile-app",
      url: "https://github.com/developer/mobile-app",
      bytes: 45000,
      share: 25.0,
      last_updated: "2026-02-01T09:30:00Z",
    },
  ];

  it("renders 'Why?' toggle button in collapsed state initially", () => {
    render(<SkillEvidenceToggle skillName="React" evidence={mockEvidence} />);

    const button = screen.getByRole("button", { name: /Why was React detected/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("expands evidence list when toggle button is clicked", () => {
    render(<SkillEvidenceToggle skillName="React" evidence={mockEvidence} />);

    const button = screen.getByRole("button", { name: /Why was React detected/i });
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    const region = screen.getByRole("region");
    expect(region).toBeInTheDocument();

    expect(screen.getByText("Contributing Repositories")).toBeInTheDocument();
    expect(screen.getByText("developer/react-dashboard")).toBeInTheDocument();
    expect(screen.getByText("developer/mobile-app")).toBeInTheDocument();

    // Check share display
    expect(screen.getByText("65.5%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();

    // Check bytes formatting
    expect(screen.getByText(/122.1 KB/i)).toBeInTheDocument();
    expect(screen.getByText(/43.9 KB/i)).toBeInTheDocument();
  });

  it("supports keyboard navigation and toggle closing", () => {
    render(<SkillEvidenceToggle skillName="TypeScript" evidence={mockEvidence} />);

    const button = screen.getByRole("button", { name: /Why was TypeScript detected/i });
    
    // Open via Enter key / click
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(screen.getByRole("region")).toBeInTheDocument();

    // Close on second click
    fireEvent.click(button);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("handles empty evidence gracefully", () => {
    render(<SkillEvidenceToggle skillName="Rust" evidence={[]} />);

    const button = screen.getByRole("button", { name: /Why was Rust detected/i });
    fireEvent.click(button);

    expect(screen.getByText(/No repository breakdown available for this skill/i)).toBeInTheDocument();
  });
});
