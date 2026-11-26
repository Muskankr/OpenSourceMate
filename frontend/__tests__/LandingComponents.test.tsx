import React from "react";
import { render, screen } from "@testing-library/react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

describe("Landing Page Modular Components", () => {
  it("renders Navbar with brand and navigation links", () => {
    render(
      <Navbar
        theme="dark"
        onToggleTheme={jest.fn()}
        mobileMenuOpen={false}
        onToggleMobileMenu={jest.fn()}
      />
    );
    expect(screen.getByText("OpenSourceMate")).toBeInTheDocument();
    expect(screen.getByText("Profile Analyzer")).toBeInTheDocument();
    expect(screen.getByText("How It Works")).toBeInTheDocument();
  });

  it("renders Hero with headline and call-to-action buttons", () => {
    render(<Hero theme="dark" onExploreClick={jest.fn()} />);
    expect(screen.getByText(/Turn your GitHub history into/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analyze your profile/i })).toBeInTheDocument();
  });

  it("renders HowItWorks with 3 pipeline steps", () => {
    render(<HowItWorks theme="dark" />);
    expect(screen.getByText("How OpenSourceMate Works")).toBeInTheDocument();
    expect(screen.getByText("Analyze GitHub Repositories")).toBeInTheDocument();
    expect(screen.getByText("Extract & Weight Skills")).toBeInTheDocument();
    expect(screen.getByText("Discover Matched Issues")).toBeInTheDocument();
  });

  it("renders Footer with copyright and links", () => {
    render(<Footer theme="dark" />);
    expect(screen.getByText(/OpenSourceMate/i)).toBeInTheDocument();
    expect(screen.getByText(/MIT License/i)).toBeInTheDocument();
  });
});
