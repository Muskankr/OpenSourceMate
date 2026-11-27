import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import BackToTopButton from "../components/BackToTopButton";

describe("BackToTopButton Component", () => {
  let originalScrollTo: typeof window.scrollTo;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalScrollTo = window.scrollTo;
    window.scrollTo = jest.fn();

    originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    window.matchMedia = originalMatchMedia;
  });

  it("is hidden when window.scrollY is below threshold", () => {
    Object.defineProperty(window, "scrollY", { value: 100, writable: true });
    render(<BackToTopButton threshold={300} />);

    expect(screen.queryByRole("button", { name: /scroll back to top/i })).not.toBeInTheDocument();
  });

  it("becomes visible when scrolling past threshold", () => {
    Object.defineProperty(window, "scrollY", { value: 100, writable: true });
    render(<BackToTopButton threshold={300} />);

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 450, writable: true });
      fireEvent.scroll(window);
    });

    const button = screen.getByRole("button", { name: /scroll back to top/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("title", "Scroll back to top of page");
  });

  it("scrolls smoothly to top when clicked under default motion settings", () => {
    Object.defineProperty(window, "scrollY", { value: 500, writable: true });
    render(<BackToTopButton threshold={300} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("respects prefers-reduced-motion media query with instant jump", () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    Object.defineProperty(window, "scrollY", { value: 500, writable: true });
    render(<BackToTopButton threshold={300} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "auto",
    });
  });

  it("supports keyboard activation via Space and Enter keys", () => {
    Object.defineProperty(window, "scrollY", { value: 500, writable: true });
    render(<BackToTopButton threshold={300} />);

    const button = screen.getByRole("button");

    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    expect(window.scrollTo).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: " ", code: "Space" });
    expect(window.scrollTo).toHaveBeenCalledTimes(2);

    // Other keys (e.g. Tab, Escape) should not trigger scroll
    fireEvent.keyDown(button, { key: "Tab", code: "Tab" });
    fireEvent.keyDown(button, { key: "Escape", code: "Escape" });
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });

  it("hides SVG arrow icon from screen readers using aria-hidden='true'", () => {
    Object.defineProperty(window, "scrollY", { value: 500, writable: true });
    const { container } = render(<BackToTopButton threshold={300} />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts custom threshold and className props", () => {
    Object.defineProperty(window, "scrollY", { value: 150, writable: true });
    render(<BackToTopButton threshold={100} className="custom-floating-button" />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("custom-floating-button");
  });

  it("renders custom label when provided", () => {
    Object.defineProperty(window, "scrollY", { value: 500, writable: true });
    render(<BackToTopButton threshold={300} label="Return to Top" />);

    expect(screen.getByRole("button", { name: "Return to Top" })).toBeInTheDocument();
  });
});
