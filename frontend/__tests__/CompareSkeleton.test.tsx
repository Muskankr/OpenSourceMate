/**
 * Unit tests verifying CompareSkeleton component layout, accessibility, and no-js fallback (Issue #179).
 */

import { render, screen } from "@testing-library/react";
import CompareSkeleton from "../components/CompareSkeleton";

describe("CompareSkeleton Component (Issue #179)", () => {
  it("renders with status role and aria label", () => {
    render(<CompareSkeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-label", "Loading comparison tool skeleton");
  });

  it("renders screen-reader accessible loading announcement", () => {
    render(<CompareSkeleton />);
    expect(screen.getByText("Loading developer comparison interface...")).toHaveClass("sr-only");
  });

  it("applies dark mode background and border styling by default", () => {
    const { container } = render(<CompareSkeleton theme="dark" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("bg-[#05070d]");
    expect(root).toHaveClass("text-white");
  });

  it("applies light mode background and border styling when theme is light", () => {
    const { container } = render(<CompareSkeleton theme="light" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("bg-gray-50");
    expect(root).toHaveClass("text-gray-900");
  });

  it("contains two developer comparison input card skeletons", () => {
    const { container } = render(<CompareSkeleton />);
    const cardGrid = container.querySelector(".grid.grid-cols-1.md\\:grid-cols-2");
    expect(cardGrid).toBeInTheDocument();
    expect(cardGrid?.children.length).toBe(2);
  });

  it("includes a noscript element with JavaScript requirement instructions", () => {
    const { container } = render(<CompareSkeleton />);
    const noscript = container.querySelector("noscript");
    expect(noscript).toBeInTheDocument();
    expect(noscript?.innerHTML).toContain("JavaScript is required");
    expect(noscript?.innerHTML).toContain("enable JavaScript in your browser");
  });
});

it("renders navbar skeleton placeholders", () => {
  const { container } = render(<CompareSkeleton />);
  const header = container.querySelector("header");
  expect(header).toBeInTheDocument();
  expect(header).toHaveClass("sticky");
});

it("renders centered comparison CTA action button skeleton", () => {
  const { container } = render(<CompareSkeleton />);
  const buttonSkeleton = container.querySelector(".bg-purple-600\\/30, .bg-purple-600\\/20");
  expect(buttonSkeleton).toBeInTheDocument();
});

it("verifies noscript message styling contrast and role", () => {
  const { container } = render(<CompareSkeleton />);
  const alertBox = container.querySelector('noscript [role="alert"]');
  expect(alertBox).toBeInTheDocument();
  expect(alertBox).toHaveClass("border-amber-500/30");
});
