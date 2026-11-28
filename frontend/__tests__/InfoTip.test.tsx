import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InfoTip from "../components/ui/InfoTip";

describe("Accessible InfoTip Component", () => {
  it("renders trigger button with accessible label and aria attributes", () => {
    render(
      <InfoTip
        term="Skill Proficiency"
        content="Derived from language byte counts and commit contributions."
      />
    );

    const button = screen.getByRole("button", {
      name: /more information about skill proficiency/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("opens tooltip on hover and focus, and links with aria-describedby", () => {
    render(
      <InfoTip
        term="Public Data Only"
        content="Only repositories and events visible on GitHub's public API are evaluated."
      />
    );

    const button = screen.getByRole("button");

    // Initially closed
    expect(screen.queryByText(/Only repositories and events visible/i)).not.toBeInTheDocument();

    // Trigger focus
    fireEvent.focus(button);

    // Now open and role="tooltip" present
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-describedby", tooltip.id);
    expect(screen.getByText(/Only repositories and events visible/i)).toBeInTheDocument();

    // Blur closes tooltip
    fireEvent.blur(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("toggles tooltip open/close on click for touch devices", () => {
    render(
      <InfoTip
        term="Analyzed Repositories"
        content="Non-fork repositories owned or contributed to by the developer."
      />
    );

    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("closes tooltip when user presses Escape key", () => {
    render(<InfoTip term="Test Term" content="Press Escape to dismiss this info popover." />);

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.keyDown(button, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes when clicking outside the tooltip", () => {
    render(
      <div>
        <InfoTip term="Term" content="Tooltip message" />
        <div data-testid="outside-element">Outside</div>
      </div>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    const outside = screen.getByTestId("outside-element");
    fireEvent.mouseDown(outside);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders term header when term prop is provided", () => {
    render(
      <InfoTip
        term="Repository Metrics"
        content="Detailed star, fork, and recent activity breakdown."
      />
    );

    const button = screen.getByRole("button");
    fireEvent.focus(button);

    expect(screen.getByText("Repository Metrics")).toBeInTheDocument();
  });
});
