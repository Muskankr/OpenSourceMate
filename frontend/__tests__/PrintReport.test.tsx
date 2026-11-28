import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import PrintReportButton from "../components/PrintReportButton";

describe("PrintReportButton Component", () => {
  let originalPrint: typeof window.print;

  beforeEach(() => {
    originalPrint = window.print;
    window.print = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    window.print = originalPrint;
    jest.useRealTimers();
  });

  it("renders with accessible role, title, and aria-label", () => {
    render(<PrintReportButton />);
    const button = screen.getByRole("button", {
      name: /print or save analysis results as pdf/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Print or export as PDF");
    expect(button.className).toContain("no-print");
  });

  it("triggers window.print() after click", () => {
    const handleBefore = jest.fn();
    const handleAfter = jest.fn();

    render(
      <PrintReportButton
        reportTitle="Test User OpenSourceMate Report"
        onBeforePrint={handleBefore}
        onAfterPrint={handleAfter}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleBefore).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Preparing...")).toBeInTheDocument();

    act(() => {
      jest.runAllTimers();
    });

    expect(window.print).toHaveBeenCalledTimes(1);
    expect(handleAfter).toHaveBeenCalledTimes(1);
  });

  it("marks SVG print icon with aria-hidden='true'", () => {
    const { container } = render(<PrintReportButton />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("includes no-print class so the button itself is hidden on physical paper and PDF", () => {
    render(<PrintReportButton className="custom-test-class" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("no-print");
    expect(button.className).toContain("custom-test-class");
  });

  it("reverts document title back after printing completes", () => {
    const originalDocTitle = document.title;
    render(<PrintReportButton reportTitle="Temporary Custom Report Title" />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    act(() => {
      jest.runAllTimers();
    });

    expect(window.print).toHaveBeenCalled();
    expect(document.title).toBe(originalDocTitle);
  });

  it("handles print flow state lifecycle correctly", () => {
    render(<PrintReportButton />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(button).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(button).not.toBeDisabled();
    expect(screen.getByText("Print / PDF")).toBeInTheDocument();
  });
});
