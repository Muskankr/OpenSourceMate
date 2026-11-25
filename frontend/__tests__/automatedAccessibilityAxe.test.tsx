import React from "react";
import { render } from "@testing-library/react";
import { checkA11yViolations, assertNoSeriousA11yViolations } from "../utils/axeTestHelper";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import FAQ from "../components/FAQ";
import ProfileCard from "../components/ProfileCard";
import ServiceUnavailableBanner from "../components/ServiceUnavailableBanner";
import CompareSkeleton from "../components/CompareSkeleton";
import TopRepositoriesDisplay from "../components/TopRepositoriesDisplay";
import HowItWorksPage from "../app/how-it-works/page";

describe("Automated Accessibility Suite (axe) (#266)", () => {
  it("verifies Navbar has zero serious or critical accessibility violations", async () => {
    const { container } = render(
      <Navbar
        theme="dark"
        onToggleTheme={jest.fn()}
        mobileMenuOpen={false}
        onToggleMobileMenu={jest.fn()}
      />
    );

    await assertNoSeriousA11yViolations(container);
  });

  it("verifies Navbar in mobile open state passes accessibility checks", async () => {
    const { container } = render(
      <Navbar
        theme="light"
        onToggleTheme={jest.fn()}
        mobileMenuOpen={true}
        onToggleMobileMenu={jest.fn()}
      />
    );

    await assertNoSeriousA11yViolations(container);
  });

  it("verifies Hero component passes accessibility checks", async () => {
    const { container } = render(
      <Hero
        theme="dark"
        username="octocat"
        onUsernameChange={jest.fn()}
        onSubmit={jest.fn()}
        loading={false}
        error={null}
      />
    );

    await assertNoSeriousA11yViolations(container);
  });

  it("verifies HowItWorks section passes accessibility checks", async () => {
    const { container } = render(<HowItWorks theme="dark" />);
    await assertNoSeriousA11yViolations(container);
  });

  it("verifies FAQ component passes accessibility checks", async () => {
    const { container } = render(<FAQ theme="dark" />);
    await assertNoSeriousA11yViolations(container);
  });

  it("verifies ServiceUnavailableBanner error state passes accessibility checks", async () => {
    const { container } = render(
      <ServiceUnavailableBanner
        theme="dark"
        onRetry={jest.fn()}
      />
    );

    await assertNoSeriousA11yViolations(container);
  });

  it("verifies CompareSkeleton loading state passes accessibility checks", async () => {
    const { container } = render(<CompareSkeleton theme="dark" />);
    await assertNoSeriousA11yViolations(container);
  });

  it("verifies TopRepositoriesDisplay cards pass accessibility checks", async () => {
    const sampleRepos = [
      {
        id: 1,
        name: "awesome-python",
        full_name: "octocat/awesome-python",
        stars: 1420,
        forks: 230,
        language: "Python",
        updated_at: "2026-11-01T12:00:00Z",
        url: "https://github.com/octocat/awesome-python",
        description: "Curated collection of libraries",
        is_fork: false,
      },
      {
        id: 2,
        name: "next-portfolio",
        full_name: "octocat/next-portfolio",
        stars: 89,
        forks: 12,
        language: "TypeScript",
        updated_at: "2026-10-15T09:30:00Z",
        url: "https://github.com/octocat/next-portfolio",
        description: "Modern developer portfolio",
        is_fork: false,
      },
    ];

    const { container } = render(
      <TopRepositoriesDisplay
        theme="dark"
        repositories={sampleRepos}
      />
    );

    await assertNoSeriousA11yViolations(container);
  });

  it("verifies HowItWorksPage has zero serious accessibility violations", async () => {
    const { container } = render(<HowItWorksPage />);
    await assertNoSeriousA11yViolations(container);
  });
});
