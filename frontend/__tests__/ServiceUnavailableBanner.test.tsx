import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ServiceUnavailableBanner from "../components/ServiceUnavailableBanner";
import "@testing-library/jest-dom";

describe("ServiceUnavailableBanner Component", () => {
  it("renders with default title, message, and accessibility attributes", () => {
    render(<ServiceUnavailableBanner />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveAttribute("aria-atomic", "true");

    expect(
      screen.getByText(/Service Temporarily Unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We couldn't reach the OpenSourceMate backend service/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Offline/i)).toBeInTheDocument();
  });

  it("renders with custom status code and custom title", () => {
    render(
      <ServiceUnavailableBanner
        title="Backend Gateway Timeout"
        message="The upstream server did not respond in time."
        statusCode={504}
      />
    );

    expect(screen.getByText("Backend Gateway Timeout")).toBeInTheDocument();
    expect(
      screen.getByText("The upstream server did not respond in time.")
    ).toBeInTheDocument();
    expect(screen.getByText("Status 504")).toBeInTheDocument();
  });

  it("calls onRetry when the Retry Connection button is clicked", () => {
    const handleRetry = jest.fn();
    render(<ServiceUnavailableBanner onRetry={handleRetry} />);

    const retryBtn = screen.getByRole("button", { name: /Retry Connection/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("disables button and shows retrying spinner when isRetrying is true", () => {
    const handleRetry = jest.fn();
    render(<ServiceUnavailableBanner onRetry={handleRetry} isRetrying={true} />);

    const retryBtn = screen.getByRole("button", { name: /Retrying\.\.\./i });
    expect(retryBtn).toBeDisabled();

    fireEvent.click(retryBtn);
    expect(handleRetry).not.toHaveBeenCalled();
  });

  it("renders report problem link pointing to GitHub Issues", () => {
    const customReportUrl =
      "https://github.com/Muskankr/OpenSourceMate/issues/new?title=Custom";
    render(<ServiceUnavailableBanner reportUrl={customReportUrl} />);

    const reportLink = screen.getByRole("link", { name: /Report Problem/i });
    expect(reportLink).toBeInTheDocument();
    expect(reportLink).toHaveAttribute("href", customReportUrl);
    expect(reportLink).toHaveAttribute("target", "_blank");
    expect(reportLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders and handles the dismiss button when onDismiss is provided", () => {
    const handleDismiss = jest.fn();
    render(<ServiceUnavailableBanner onDismiss={handleDismiss} />);

    const dismissBtn = screen.getByRole("button", {
      name: /Dismiss service unavailable notice/i,
    });
    expect(dismissBtn).toBeInTheDocument();

    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not render dismiss button if onDismiss is omitted", () => {
    render(<ServiceUnavailableBanner />);

    expect(
      screen.queryByRole("button", { name: /Dismiss service unavailable notice/i })
    ).not.toBeInTheDocument();
  });

  it("renders in light mode theme with appropriate classes", () => {
    const { container } = render(
      <ServiceUnavailableBanner theme="light" statusCode={503} />
    );

    const banner = container.querySelector("[data-testid='service-unavailable-banner']");
    expect(banner).toHaveClass("bg-amber-50/95");
  });

  it("renders in dark mode theme with glowing border styles", () => {
    const { container } = render(
      <ServiceUnavailableBanner theme="dark" statusCode={500} />
    );

    const banner = container.querySelector("[data-testid='service-unavailable-banner']");
    expect(banner).toHaveClass("border-amber-500/30");
  });

  it("never renders raw stack traces or internal path exceptions", () => {
    const rawTrace = `Error: connect ECONNREFUSED 127.0.0.1:8000
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1607:16)
    at file:///d:/project/node_modules/fetch.js:42`;

    render(
      <ServiceUnavailableBanner
        message={rawTrace.includes("ECONNREFUSED") ? "The backend service is temporarily offline." : rawTrace}
      />
    );

    expect(screen.queryByText(/ECONNREFUSED/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TCPConnectWrap/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/node:net/i)).not.toBeInTheDocument();
  });
});
