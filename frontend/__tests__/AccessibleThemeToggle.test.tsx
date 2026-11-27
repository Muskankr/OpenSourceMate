import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "../components/ThemeToggle";

describe("Accessible ThemeToggle Component", () => {
  it("renders with role='switch' and correct aria-checked state in dark mode", () => {
    const handleToggle = jest.fn();
    render(<ThemeToggle theme="dark" onToggleTheme={handleToggle} />);

    const toggleButton = screen.getByRole("switch");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-checked", "true");
    expect(toggleButton).toHaveAttribute("aria-label", "Switch to light mode");
    expect(toggleButton).toHaveAttribute("title", "Switch to light mode");
  });

  it("renders with role='switch' and aria-checked='false' in light mode", () => {
    const handleToggle = jest.fn();
    render(<ThemeToggle theme="light" onToggleTheme={handleToggle} />);

    const toggleButton = screen.getByRole("switch");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-checked", "false");
    expect(toggleButton).toHaveAttribute("aria-label", "Switch to dark mode");
    expect(toggleButton).toHaveAttribute("title", "Switch to dark mode");
  });

  it("calls onToggleTheme when clicked", () => {
    const handleToggle = jest.fn();
    render(<ThemeToggle theme="dark" onToggleTheme={handleToggle} />);

    const toggleButton = screen.getByRole("switch");
    fireEvent.click(toggleButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("supports keyboard toggling via Space and Enter keys", () => {
    const handleToggle = jest.fn();
    render(<ThemeToggle theme="dark" onToggleTheme={handleToggle} />);

    const toggleButton = screen.getByRole("switch");

    fireEvent.keyDown(toggleButton, { key: "Enter", code: "Enter" });
    expect(handleToggle).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(toggleButton, { key: " ", code: "Space" });
    expect(handleToggle).toHaveBeenCalledTimes(2);

    // Other keys (e.g. Tab, Arrow) should not trigger toggle
    fireEvent.keyDown(toggleButton, { key: "ArrowRight", code: "ArrowRight" });
    fireEvent.keyDown(toggleButton, { key: "Tab", code: "Tab" });
    expect(handleToggle).toHaveBeenCalledTimes(2);
  });

  it("hides SVG icons from assistive technology using aria-hidden", () => {
    const { container } = render(<ThemeToggle theme="dark" />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("renders visible text label when showTextLabel is enabled", () => {
    const { rerender } = render(<ThemeToggle theme="dark" showTextLabel={true} />);
    expect(screen.getByText("Dark")).toBeInTheDocument();

    rerender(<ThemeToggle theme="light" showTextLabel={true} />);
    expect(screen.getByText("Light")).toBeInTheDocument();
  });

  it("contains screen-reader announcement elements and aria-live status", () => {
    const { container } = render(<ThemeToggle theme="dark" />);
    const srOnlyTexts = screen.getAllByText(/Switch to light mode/i);
    expect(srOnlyTexts.length).toBeGreaterThan(0);

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it("has prominent focus rings for keyboard users", () => {
    render(<ThemeToggle theme="dark" />);
    const button = screen.getByRole("switch");
    expect(button.className).toContain("focus-visible:ring-2");
    expect(button.className).toContain("focus-visible:ring-emerald-400");
  });

  it("accepts custom id and additional className properties", () => {
    render(<ThemeToggle id="custom-toggle-id" className="custom-container-class" theme="light" />);
    const button = screen.getByRole("switch");
    expect(button.id).toBe("custom-toggle-id");
    expect(button.parentElement?.className).toContain("custom-container-class");
  });
});
