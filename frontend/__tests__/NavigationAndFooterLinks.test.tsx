import React from "react";
import { render, screen } from "@testing-library/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileNavigationMenu from "../components/MobileNavigationMenu";

describe("Navbar & Footer How It Works and FAQ Links Integration (#445)", () => {
  it("renders How It Works and FAQ links in desktop Navbar", () => {
    render(
      <Navbar
        theme="dark"
        onToggleTheme={jest.fn()}
        mobileMenuOpen={false}
        onToggleMobileMenu={jest.fn()}
      />
    );

    const howItWorksLink = screen.getByRole("link", { name: "How It Works" });
    expect(howItWorksLink).toBeInTheDocument();
    expect(howItWorksLink).toHaveAttribute("href", "/how-it-works");

    const faqLink = screen.getByRole("link", { name: "FAQ" });
    expect(faqLink).toBeInTheDocument();
    expect(faqLink).toHaveAttribute("href", "/how-it-works#faq");
  });

  it("renders How It Works & FAQ link in Footer", () => {
    render(<Footer theme="dark" />);

    const howItWorksFooterLink = screen.getByRole("link", { name: /How It Works & FAQ/i });
    expect(howItWorksFooterLink).toBeInTheDocument();
    expect(howItWorksFooterLink).toHaveAttribute("href", "/how-it-works");
  });

  it("renders How It Works and FAQ items in open MobileNavigationMenu", () => {
    render(
      <MobileNavigationMenu
        theme="dark"
        onToggleTheme={jest.fn()}
        isOpen={true}
      />
    );

    const panel = screen.getByTestId("mobile-navigation-panel");
    expect(panel).toBeInTheDocument();

    const howItWorksItem = screen.getByTestId("mobile-nav-how-it-works");
    expect(howItWorksItem).toBeInTheDocument();
    expect(howItWorksItem).toHaveAttribute("href", "/how-it-works");

    const faqItem = screen.getByTestId("mobile-nav-faq");
    expect(faqItem).toBeInTheDocument();
    expect(faqItem).toHaveAttribute("href", "/how-it-works#faq");
  });
});
