import React from "react";
import { render, screen } from "@testing-library/react";
import ContributionRequirementsChips from "../components/ContributionRequirementsChips";
import type { ContributionRequirementsResult } from "../types/api";

describe("ContributionRequirementsChips Component (Issue #417)", () => {
  const allRequirements: ContributionRequirementsResult = {
    repository: "sample/all-repo",
    contributing: {
      detected: true,
      name: "Contributing Guide",
      url: "https://github.com/sample/all-repo/blob/main/CONTRIBUTING.md",
      status: "present",
    },
    code_of_conduct: {
      detected: true,
      name: "Contributor Covenant",
      url: "https://github.com/sample/all-repo/blob/main/CODE_OF_CONDUCT.md",
      status: "present",
    },
    license: {
      detected: true,
      name: "MIT",
      url: "https://github.com/sample/all-repo/blob/main/LICENSE",
      status: "present",
    },
    cla_dco: {
      detected: true,
      type: "CLA",
      name: "CLA Required",
      url: "https://github.com/sample/all-repo/blob/main/CLA.md",
      status: "present",
    },
  };

  const someRequirements: ContributionRequirementsResult = {
    repository: "sample/some-repo",
    contributing: {
      detected: true,
      name: "Contributing Guide",
      url: "https://github.com/sample/some-repo/blob/main/CONTRIBUTING.md",
      status: "present",
    },
    code_of_conduct: {
      detected: false,
      name: null,
      url: null,
      status: "unknown",
    },
    license: {
      detected: true,
      name: "Apache-2.0",
      url: "https://github.com/sample/some-repo/blob/main/LICENSE",
      status: "present",
    },
    cla_dco: {
      detected: false,
      name: null,
      url: null,
      status: "unknown",
    },
  };

  const noneRequirements: ContributionRequirementsResult = {
    repository: "sample/none-repo",
    contributing: {
      detected: false,
      name: null,
      url: null,
      status: "unknown",
    },
    code_of_conduct: {
      detected: false,
      name: null,
      url: null,
      status: "unknown",
    },
    license: {
      detected: false,
      name: null,
      url: null,
      status: "unknown",
    },
    cla_dco: {
      detected: false,
      name: null,
      url: null,
      status: "unknown",
    },
  };

  it("renders active chips linking to real repository files when ALL files are present", () => {
    render(<ContributionRequirementsChips repository="sample/all-repo" requirements={allRequirements} />);

    // Contributing chip links to real file
    const contributingChip = screen.getByTestId("chip-contributing");
    expect(contributingChip).toHaveTextContent("Contributing");
    expect(contributingChip).toHaveAttribute(
      "href",
      "https://github.com/sample/all-repo/blob/main/CONTRIBUTING.md"
    );
    expect(contributingChip).toHaveAttribute("target", "_blank");

    // Code of Conduct chip links to real file
    const cocChip = screen.getByTestId("chip-coc");
    expect(cocChip).toHaveTextContent("Contributor Covenant");
    expect(cocChip).toHaveAttribute(
      "href",
      "https://github.com/sample/all-repo/blob/main/CODE_OF_CONDUCT.md"
    );

    // License chip links to real file
    const licChip = screen.getByTestId("chip-license");
    expect(licChip).toHaveTextContent("MIT");
    expect(licChip).toHaveAttribute(
      "href",
      "https://github.com/sample/all-repo/blob/main/LICENSE"
    );

    // CLA chip links to real file
    const claChip = screen.getByTestId("chip-cla-dco");
    expect(claChip).toHaveTextContent("CLA Required");
    expect(claChip).toHaveAttribute(
      "href",
      "https://github.com/sample/all-repo/blob/main/CLA.md"
    );
  });

  it("renders present chips with links and missing items with 'unknown' when SOME files are present", () => {
    render(<ContributionRequirementsChips repository="sample/some-repo" requirements={someRequirements} />);

    // Present chips have valid links
    expect(screen.getByTestId("chip-contributing")).toHaveAttribute(
      "href",
      "https://github.com/sample/some-repo/blob/main/CONTRIBUTING.md"
    );
    expect(screen.getByTestId("chip-license")).toHaveAttribute(
      "href",
      "https://github.com/sample/some-repo/blob/main/LICENSE"
    );

    // Missing chips display 'unknown' rather than 'none'
    const cocUnknown = screen.getByTestId("chip-coc-unknown");
    expect(cocUnknown).toHaveTextContent("Code of Conduct: unknown");
    expect(cocUnknown).not.toHaveTextContent("none");

    const claUnknown = screen.getByTestId("chip-cla-dco-unknown");
    expect(claUnknown).toHaveTextContent("CLA/DCO: unknown");
    expect(claUnknown).not.toHaveTextContent("none");
  });

  it("renders 'unknown' for all items when NONE of the files are detected", () => {
    render(<ContributionRequirementsChips repository="sample/none-repo" requirements={noneRequirements} />);

    expect(screen.getByTestId("chip-contributing-unknown")).toHaveTextContent("Contributing: unknown");
    expect(screen.getByTestId("chip-coc-unknown")).toHaveTextContent("Code of Conduct: unknown");
    expect(screen.getByTestId("chip-license-unknown")).toHaveTextContent("License: unknown");
    expect(screen.getByTestId("chip-cla-dco-unknown")).toHaveTextContent("CLA/DCO: unknown");

    // Strictly ensure none are displayed as 'none'
    expect(screen.queryByText(/Contributing: none/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Code of Conduct: none/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/License: none/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CLA\/DCO: none/i)).not.toBeInTheDocument();
  });
});
