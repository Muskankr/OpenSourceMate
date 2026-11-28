import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProgramSelector from "../components/ProgramSelector";
import type { ContributorProgram } from "../types/api";

describe("ProgramSelector Component", () => {
  const mockPrograms: ContributorProgram[] = [
    {
      id: "hacktoberfest",
      name: "Hacktoberfest",
      labels: ["hacktoberfest"],
      topics: ["hacktoberfest"],
    },
    {
      id: "nsoc",
      name: "NSoC / NWOC",
      labels: ["nsoc", "nwoc"],
      topics: ["nsoc"],
    },
  ];

  it("renders accessible label and dropdown with default option", () => {
    const handleChange = jest.fn();
    render(
      <ProgramSelector value="" onChange={handleChange} programs={mockPrograms} theme="dark" />
    );

    expect(screen.getByLabelText(/Contributor Program/i)).toBeInTheDocument();
    const select = screen.getByTestId("program-filter-select");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("");

    // Check options
    expect(screen.getByRole("option", { name: /All Programs/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Hacktoberfest" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "NSoC / NWOC" })).toBeInTheDocument();
  });

  it("triggers onChange when a program is selected", () => {
    const handleChange = jest.fn();
    render(<ProgramSelector value="" onChange={handleChange} programs={mockPrograms} />);

    const select = screen.getByTestId("program-filter-select");
    fireEvent.change(select, { target: { value: "nsoc" } });

    expect(handleChange).toHaveBeenCalledWith("nsoc");
  });

  it("displays the active program badge when a program is selected", () => {
    render(
      <ProgramSelector
        value="hacktoberfest"
        onChange={jest.fn()}
        programs={mockPrograms}
        showBadge={true}
      />
    );

    const badge = screen.getByTestId("active-program-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Hacktoberfest");
  });

  it("hides the active badge when showBadge is false", () => {
    render(
      <ProgramSelector
        value="hacktoberfest"
        onChange={jest.fn()}
        programs={mockPrograms}
        showBadge={false}
      />
    );

    expect(screen.queryByTestId("active-program-badge")).not.toBeInTheDocument();
  });
});
