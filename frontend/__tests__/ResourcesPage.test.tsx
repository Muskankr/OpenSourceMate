import React from "react";
import { render, screen } from "@testing-library/react";
import ResourcesPage from "../app/resources/page";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

describe("Open Source 101 Resources Page (#187)", () => {
  it("renders the page title and hero introduction", () => {
    render(<ResourcesPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Essential Resources for Open Source Success/i
    );
    expect(screen.getByText(/Open Source 101/i)).toBeInTheDocument();
  });

  it("renders all 5 required curriculum sections", () => {
    render(<ResourcesPage />);

    // 1. Git basics
    expect(
      screen.getByRole("heading", { name: /1\. Git Basics & Version Control/i })
    ).toBeInTheDocument();

    // 2. Making a first pull request
    expect(
      screen.getByRole("heading", { name: /2\. Making Your First Pull Request/i })
    ).toBeInTheDocument();

    // 3. Reading a contributing guide
    expect(
      screen.getByRole("heading", { name: /3\. Reading & Understanding CONTRIBUTING\.md/i })
    ).toBeInTheDocument();

    // 4. Writing a good issue comment
    expect(
      screen.getByRole("heading", { name: /4\. Writing Good Issue Comments & Bug Reports/i })
    ).toBeInTheDocument();

    // 5. Communicating with maintainers
    expect(
      screen.getByRole("heading", { name: /5\. Communicating with Maintainers & Etiquette/i })
    ).toBeInTheDocument();
  });

  it("contains valid external links with secure target and rel attributes", () => {
    const { container } = render(<ResourcesPage />);
    const externalLinks = container.querySelectorAll('a[target="_blank"]');

    expect(externalLinks.length).toBeGreaterThanOrEqual(10);

    externalLinks.forEach((link) => {
      const href = link.getAttribute("href");
      expect(href).toMatch(/^https?:\/\//);
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("includes quick navigation jump links to all 5 sections", () => {
    render(<ResourcesPage />);

    expect(screen.getByRole("link", { name: /Git Basics & Version Control/i })).toHaveAttribute(
      "href",
      "#git-basics"
    );
    expect(screen.getByRole("link", { name: /Making Your First Pull Request/i })).toHaveAttribute(
      "href",
      "#first-pull-request"
    );
    expect(
      screen.getByRole("link", { name: /Reading & Understanding CONTRIBUTING\.md/i })
    ).toHaveAttribute("href", "#contributing-guides");
    expect(
      screen.getByRole("link", { name: /Writing Good Issue Comments & Bug Reports/i })
    ).toHaveAttribute("href", "#issue-comments");
    expect(
      screen.getByRole("link", { name: /Communicating with Maintainers & Etiquette/i })
    ).toHaveAttribute("href", "#maintainer-etiquette");
  });

  it("links to /resources from Navbar and Footer", () => {
    const { rerender } = render(
      <Navbar
        theme="dark"
        onToggleTheme={jest.fn()}
        mobileMenuOpen={false}
        onToggleMobileMenu={jest.fn()}
      />
    );

    const navResourceLinks = screen.getAllByRole("link", { name: /Resources/i });
    expect(navResourceLinks.some((l) => l.getAttribute("href") === "/resources")).toBe(true);

    rerender(<Footer theme="dark" />);
    const footerResourceLink = screen.getByRole("link", { name: /Open Source 101/i });
    expect(footerResourceLink).toHaveAttribute("href", "/resources");
  });
});
