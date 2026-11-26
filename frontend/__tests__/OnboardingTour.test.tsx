import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingTour, {
  ONBOARDING_TOUR_STEPS,
  ONBOARDING_TOUR_STORAGE_KEY,
} from "../components/OnboardingTour";
import Home from "../app/page";

jest.mock("../components/ContributorsWall", () => {
  return function MockContributorsWall() {
    return null;
  };
});

describe("OnboardingTour Component (Issue #439)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders 4 steps with Next, Back, and Finish tour controls", () => {
    const Wrapper = () => {
      const [step, setStep] = React.useState(0);
      const [open, setOpen] = React.useState(true);
      return (
        <OnboardingTour
          isOpen={open}
          currentStep={step}
          onStepChange={setStep}
          onSkip={() => setOpen(false)}
          onComplete={() => setOpen(false)}
        />
      );
    };

    render(<Wrapper />);

    expect(screen.getByTestId("tour-step-indicator")).toHaveTextContent("Step 1 of 4");
    expect(screen.getByText(ONBOARDING_TOUR_STEPS[0].title)).toBeInTheDocument();
    expect(screen.getByTestId("tour-back-button")).toBeDisabled();

    // Advance to Step 2
    fireEvent.click(screen.getByTestId("tour-next-button"));
    expect(screen.getByTestId("tour-step-indicator")).toHaveTextContent("Step 2 of 4");
    expect(screen.getByText(ONBOARDING_TOUR_STEPS[1].title)).toBeInTheDocument();
    expect(screen.getByTestId("tour-back-button")).not.toBeDisabled();

    // Advance to Step 3
    fireEvent.click(screen.getByTestId("tour-next-button"));
    expect(screen.getByTestId("tour-step-indicator")).toHaveTextContent("Step 3 of 4");

    // Advance to Step 4
    fireEvent.click(screen.getByTestId("tour-next-button"));
    expect(screen.getByTestId("tour-step-indicator")).toHaveTextContent("Step 4 of 4");
    expect(screen.getByTestId("tour-finish-button")).toBeInTheDocument();

    // Go back to Step 3
    fireEvent.click(screen.getByTestId("tour-back-button"));
    expect(screen.getByTestId("tour-step-indicator")).toHaveTextContent("Step 3 of 4");

    // Advance to Step 4 and Finish
    fireEvent.click(screen.getByTestId("tour-next-button"));
    fireEvent.click(screen.getByTestId("tour-finish-button"));
    expect(screen.queryByTestId("onboarding-tour")).toBeNull();
  });

  it("calls onSkip when Skip button is clicked or Escape is pressed", () => {
    const handleSkip = jest.fn();
    render(
      <OnboardingTour
        isOpen={true}
        currentStep={0}
        onStepChange={jest.fn()}
        onSkip={handleSkip}
        onComplete={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("tour-skip-button"));
    expect(handleSkip).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleSkip).toHaveBeenCalledTimes(2);
  });

  it("includes mobile-responsive positioning classes", () => {
    render(
      <OnboardingTour
        isOpen={true}
        currentStep={0}
        onStepChange={jest.fn()}
        onSkip={jest.fn()}
        onComplete={jest.fn()}
      />
    );

    const tourEl = screen.getByTestId("onboarding-tour");
    expect(tourEl.className).toContain("inset-x-3");
    expect(tourEl.className).toContain("bottom-3");
    expect(tourEl.className).toContain("sm:right-6");
  });

  it("auto-opens on first visit, remembers dismissal in localStorage, and restarts from footer link", () => {
    const { unmount } = render(<Home />);

    // First visit: tour is open automatically
    expect(screen.getByTestId("onboarding-tour")).toBeInTheDocument();
    expect(screen.getByTestId("tour-step-indicator")).toHaveTextContent("Step 1 of 4");

    // Skip the tour
    fireEvent.click(screen.getByTestId("tour-skip-button"));
    expect(screen.queryByTestId("onboarding-tour")).toBeNull();
    expect(window.localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBe("true");

    // Remount: tour stays closed
    unmount();
    render(<Home />);
    expect(screen.queryByTestId("onboarding-tour")).toBeNull();

    // Click "Take the tour" in the footer
    const footerTourLink = screen.getByTestId("take-the-tour-link");
    fireEvent.click(footerTourLink);
    expect(screen.getByTestId("onboarding-tour")).toBeInTheDocument();
    expect(screen.getByTestId("tour-step-indicator")).toHaveTextContent("Step 1 of 4");
  });
});
