import React from "react";
import { render, screen } from "@testing-library/react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import ServiceUnavailableBanner from "../components/ServiceUnavailableBanner";
import ThemeToggle from "../components/ThemeToggle";

describe("Storybook Component Suite Integrity (Issue #203)", () => {
  it("exports and initializes core UI primitive components properly", () => {
    render(
      <Card data-testid="test-card">
        <Badge variant="primary">Badge</Badge>
        <Button variant="primary">Click</Button>
        <ThemeToggle theme="dark" />
        <ServiceUnavailableBanner />
      </Card>
    );

    expect(screen.getByTestId("test-card")).toBeInTheDocument();
    expect(screen.getByText("Badge")).toBeInTheDocument();
    expect(screen.getByText("Click")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });
});
