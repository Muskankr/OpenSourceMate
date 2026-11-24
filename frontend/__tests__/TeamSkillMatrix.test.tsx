import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TeamSkillMatrix from "../components/TeamSkillMatrix";
import type { TeamSkillMatrixSummary } from "../types/team";

describe("TeamSkillMatrix Component", () => {
  const sampleSummary: TeamSkillMatrixSummary = {
    analyzedUsers: ["alice", "bob"],
    failedUsers: [
      { username: "unknown-dev", error: "GitHub user not found" },
    ],
    skillsMatrix: [
      {
        skillName: "TypeScript",
        userCoverage: { alice: 3, bob: 2 },
        coveredByCount: 2,
        coveredByUsers: ["alice", "bob"],
        isSingleExpert: false,
      },
      {
        skillName: "Rust",
        userCoverage: { alice: 2 },
        coveredByCount: 1,
        coveredByUsers: ["alice"],
        isSingleExpert: true,
        singleExpertUsername: "alice",
      },
    ],
    singleExpertSkills: [
      {
        skillName: "Rust",
        userCoverage: { alice: 2 },
        coveredByCount: 1,
        coveredByUsers: ["alice"],
        isSingleExpert: true,
        singleExpertUsername: "alice",
      },
    ],
    sharedSkills: [
      {
        skillName: "TypeScript",
        userCoverage: { alice: 3, bob: 2 },
        coveredByCount: 2,
        coveredByUsers: ["alice", "bob"],
        isSingleExpert: false,
      },
    ],
    totalDistinctSkills: 2,
  };

  it("renders matrix with KPI summary, visual matrix, and partial failures alert", () => {
    render(<TeamSkillMatrix summary={sampleSummary} />);

    // Partial failure alert
    expect(screen.getByTestId("team-partial-failures")).toBeInTheDocument();
    expect(screen.getByText(/@unknown-dev:/i)).toBeInTheDocument();
    expect(screen.getByText(/GitHub user not found/i)).toBeInTheDocument();

    // Technologies that only one person knows
    expect(screen.getByTestId("single-expert-section")).toBeInTheDocument();
    expect(screen.getByTestId("single-expert-rust")).toBeInTheDocument();

    // Visual Matrix table by default
    expect(screen.getByTestId("team-visual-matrix")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getAllByText("Rust").length).toBeGreaterThanOrEqual(1);
  });

  it("toggles to accessible table alternative (Acceptance criterion)", () => {
    render(<TeamSkillMatrix summary={sampleSummary} />);

    const tableToggle = screen.getByTestId("toggle-accessible-table");
    fireEvent.click(tableToggle);

    // Accessible table displayed
    const accessibleTable = screen.getByTestId("team-accessible-table");
    expect(accessibleTable).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /Accessible Team Skill Matrix Table/i })).toBeInTheDocument();
    expect(screen.getByText(/Coverage Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Single person only \(@alice\)/i)).toBeInTheDocument();
  });
});
