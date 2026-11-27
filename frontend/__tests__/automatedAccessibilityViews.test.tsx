import React from "react";
import { render } from "@testing-library/react";
import { assertNoSeriousA11yViolations } from "../utils/axeTestHelper";
import { ProfileHealthChecklist } from "../components/ProfileHealthChecklist";
import PreferencesPanel from "../components/PreferencesPanel";
import { RateLimitBanner } from "../components/RateLimitBanner";
import BuildVersionBadge from "../components/BuildVersionBadge";

describe("Automated Accessibility Suite - Interactive & Analyzer Views (#266)", () => {
  it("verifies ProfileHealthChecklist passes accessibility checks in dark and light themes", async () => {
    const health = {
      score: 85,
      passedCount: 2,
      totalCount: 3,
      items: [
        {
          id: "has_bio",
          label: "Profile Bio & Interests",
          passed: true,
          description: "Developer profile contains public bio.",
          actionText: "Add bio",
          actionUrl: "https://github.com/settings/profile",
        },
        {
          id: "has_readme",
          label: "Profile README",
          passed: true,
          description: "Special profile repository exists.",
          actionText: "Create README",
          actionUrl: "https://docs.github.com",
        },
        {
          id: "has_pinned",
          label: "Pinned Repositories",
          passed: false,
          description: "Showcase up to 6 standout projects.",
          actionText: "Customize pins",
          actionUrl: "https://github.com",
        },
      ],
    };

    const { container: darkContainer } = render(
      <ProfileHealthChecklist health={health} theme="dark" />
    );
    await assertNoSeriousA11yViolations(darkContainer);

    const { container: lightContainer } = render(
      <ProfileHealthChecklist health={health} theme="light" />
    );
    await assertNoSeriousA11yViolations(lightContainer);
  });

  it("verifies PreferencesPanel controls pass accessibility checks", async () => {
    const { container } = render(
      <PreferencesPanel theme="dark" isOpen={true} onToggleOpen={jest.fn()} />
    );

    await assertNoSeriousA11yViolations(container);
  });

  it("verifies RateLimitBanner passes accessibility checks", async () => {
    const { container } = render(
      <RateLimitBanner
        message="GitHub rate limit reached. Please wait."
        retryAfterSeconds={60}
        onDismiss={jest.fn()}
      />
    );

    await assertNoSeriousA11yViolations(container);
  });

  it("verifies BuildVersionBadge passes accessibility checks", async () => {
    const { container } = render(<BuildVersionBadge />);
    await assertNoSeriousA11yViolations(container);
  });
});
