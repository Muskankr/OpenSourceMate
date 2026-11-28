/**
 * Unit tests verifying LazySectionPlaceholder component behavior.
 */

import { render, screen } from "@testing-library/react";
import LazySectionPlaceholder from "../components/LazySectionPlaceholder";

describe("LazySectionPlaceholder Component (Issue #177)", () => {
  it("renders with default title and status role", () => {
    render(<LazySectionPlaceholder />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading component...")).toBeInTheDocument();
  });

  it("renders custom title, description, and applies theme classes", () => {
    render(
      <LazySectionPlaceholder
        title="Loading Skills..."
        description="Parsing language breakdown"
        theme="light"
        heightClass="h-96"
      />
    );

    expect(screen.getByText("Loading Skills...")).toBeInTheDocument();
    expect(screen.getByText("Parsing language breakdown")).toBeInTheDocument();
    const container = screen.getByRole("status");
    expect(container).toHaveClass("h-96");
    expect(container).toHaveClass("border-gray-200");
  });

  it("contains screen-reader accessible loading text", () => {
    render(<LazySectionPlaceholder />);
    expect(screen.getByText("Loading content")).toHaveClass("sr-only");
  });
});

it("verifies theme-based styling contrast", () => {
  const { rerender } = render(<LazySectionPlaceholder theme="dark" />);
  expect(screen.getByRole("status")).toHaveClass("border-white/10");

  rerender(<LazySectionPlaceholder theme="light" />);
  expect(screen.getByRole("status")).toHaveClass("border-gray-200");
});

it("respects custom height classes for CLS reservation", () => {
  const { rerender } = render(<LazySectionPlaceholder heightClass="h-48" />);
  expect(screen.getByRole("status")).toHaveClass("h-48");

  rerender(<LazySectionPlaceholder heightClass="h-72" />);
  expect(screen.getByRole("status")).toHaveClass("h-72");
});

it("handles empty description gracefully", () => {
  render(<LazySectionPlaceholder description="" />);
  expect(screen.queryByText("Preparing performance-optimized view...")).not.toBeInTheDocument();
});
