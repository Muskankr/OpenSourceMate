import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import MobileNavigationMenu, { DEFAULT_NAV_ITEMS } from "../components/MobileNavigationMenu";
import Navbar from "../components/Navbar";

describe("MobileNavigationMenu Component (#259)", () => {
  const defaultProps = {
    theme: "dark" as const,
    onToggleTheme: jest.fn(),
    activeSection: "analyzer",
    onNavigateSection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders mobile hamburger button and theme toggle, panel closed initially", () => {
    render(<MobileNavigationMenu {...defaultProps} />);

    const toggleBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

    // Theme toggle switch element must remain accessible on mobile
    const themeBtn = screen.getByRole("switch", { name: /Switch to light mode/i });
    expect(themeBtn).toBeInTheDocument();

    // Disclosure panel should not be visible when closed
    expect(screen.queryByTestId("mobile-navigation-panel")).not.toBeInTheDocument();
  });

  it("toggles the disclosure panel open and closed on button click", () => {
    render(<MobileNavigationMenu {...defaultProps} />);

    const toggleBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    fireEvent.click(toggleBtn);

    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByTestId("mobile-navigation-panel");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("role", "region");

    // Clicking again closes the panel
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-navigation-panel")).not.toBeInTheDocument();
  });

  it("renders all default navigation items in the panel", () => {
    render(<MobileNavigationMenu {...defaultProps} isOpen={true} />);

    const panel = screen.getByTestId("mobile-navigation-panel");
    DEFAULT_NAV_ITEMS.forEach((item) => {
      expect(within(panel).getByText(item.label)).toBeInTheDocument();
    });
  });

  it("closes the disclosure panel on Escape keypress and returns focus to button", () => {
    render(<MobileNavigationMenu {...defaultProps} />);

    const toggleBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("mobile-navigation-panel")).toBeInTheDocument();

    // Trigger Escape key event on window
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByTestId("mobile-navigation-panel")).not.toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the disclosure panel and triggers onNavigateSection on section link click", () => {
    const onNavigateSection = jest.fn();
    render(<MobileNavigationMenu {...defaultProps} onNavigateSection={onNavigateSection} />);

    const toggleBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    fireEvent.click(toggleBtn);

    const howItWorksLink = screen.getByTestId("mobile-nav-how-it-works");
    fireEvent.click(howItWorksLink);

    expect(onNavigateSection).toHaveBeenCalledWith("how-it-works");
    expect(screen.queryByTestId("mobile-navigation-panel")).not.toBeInTheDocument();
  });

  it("closes the disclosure panel when non-section router link is clicked", () => {
    render(<MobileNavigationMenu {...defaultProps} />);

    const toggleBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    fireEvent.click(toggleBtn);

    const compareLink = screen.getByTestId("mobile-nav-compare-profiles");
    fireEvent.click(compareLink);

    expect(screen.queryByTestId("mobile-navigation-panel")).not.toBeInTheDocument();
  });

  it("closes the menu on viewport resize above 768px", () => {
    render(<MobileNavigationMenu {...defaultProps} />);

    const toggleBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("mobile-navigation-panel")).toBeInTheDocument();

    // Simulate window resize to desktop viewport (1024px)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    fireEvent(window, new Event("resize"));

    expect(screen.queryByTestId("mobile-navigation-panel")).not.toBeInTheDocument();
  });

  it("supports light theme rendering with proper contrast tokens", () => {
    render(<MobileNavigationMenu {...defaultProps} theme="light" isOpen={true} />);

    const panel = screen.getByTestId("mobile-navigation-panel");
    expect(panel).toHaveClass("bg-white/95");
    expect(panel).toHaveClass("text-slate-800");

    const themeBtn = screen.getByRole("switch", { name: /Switch to dark mode/i });
    expect(themeBtn).toBeInTheDocument();
  });
});

describe("Navbar Component Mobile Navigation Integration (#259)", () => {
  const navbarProps = {
    theme: "dark" as const,
    onToggleTheme: jest.fn(),
    mobileMenuOpen: false,
    onToggleMobileMenu: jest.fn(),
    onNavigateSection: jest.fn(),
    activeSection: "analyzer",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders mobile toggle button with accessible aria attributes", () => {
    render(<Navbar {...navbarProps} />);

    const mobileBtn = screen.getByRole("button", { name: /Open navigation menu/i });
    expect(mobileBtn).toBeInTheDocument();
    expect(mobileBtn).toHaveAttribute("aria-expanded", "false");
    expect(mobileBtn).toHaveAttribute("aria-controls", "mobile-navigation-dropdown");
  });

  it("renders mobile dropdown when mobileMenuOpen is true", () => {
    render(<Navbar {...navbarProps} mobileMenuOpen={true} />);

    const mobileBtn = screen.getByRole("button", { name: /Close navigation menu/i });
    expect(mobileBtn).toHaveAttribute("aria-expanded", "true");

    const dropdown = screen.getByTestId("mobile-navigation-dropdown");
    expect(dropdown).toBeInTheDocument();
    expect(within(dropdown).getByText("Profile Analyzer")).toBeInTheDocument();
    expect(within(dropdown).getByText("Compare Profiles")).toBeInTheDocument();
  });

  it("triggers onToggleMobileMenu on Escape key when dropdown is open", () => {
    const onToggleMobileMenu = jest.fn();
    render(
      <Navbar {...navbarProps} mobileMenuOpen={true} onToggleMobileMenu={onToggleMobileMenu} />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onToggleMobileMenu).toHaveBeenCalledTimes(1);
  });

  it("triggers navigation callback and closes menu on mobile link click", () => {
    const onNavigateSection = jest.fn();
    const onToggleMobileMenu = jest.fn();
    render(
      <Navbar
        {...navbarProps}
        mobileMenuOpen={true}
        onNavigateSection={onNavigateSection}
        onToggleMobileMenu={onToggleMobileMenu}
      />
    );

    const dropdown = screen.getByTestId("mobile-navigation-dropdown");
    const faqLink = within(dropdown).getByText("FAQ");
    fireEvent.click(faqLink);

    expect(onNavigateSection).toHaveBeenCalledWith("faq");
    expect(onToggleMobileMenu).toHaveBeenCalledTimes(1);
  });
});
