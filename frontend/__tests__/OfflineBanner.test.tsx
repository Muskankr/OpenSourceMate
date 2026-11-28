import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import OfflineBanner from "../components/OfflineBanner";

describe("OfflineBanner Component (components/OfflineBanner.tsx)", () => {
  it("renders nothing when online and not viewing cached results", () => {
    const { container } = render(<OfflineBanner isOnline={true} isViewingCached={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders an accessible offline alert banner when offline", () => {
    render(<OfflineBanner isOnline={false} isViewingCached={false} />);

    const banner = screen.getByTestId("offline-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute("role", "status");
    expect(banner).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Connect to the internet to analyze GitHub profiles/i)
    ).toBeInTheDocument();
  });

  it("renders cached results info with timestamp when offline and viewing cached data", () => {
    const fetchedAt = "2026-11-26T12:30:00.000Z";
    render(
      <OfflineBanner
        isOnline={false}
        isViewingCached={true}
        cachedUsername="octocat"
        cachedFetchedAt={fetchedAt}
      />
    );

    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
    expect(screen.getByText(/Viewing cached results for @octocat/i)).toBeInTheDocument();
    expect(screen.getByText(/Nov 26, 2026/i)).toBeInTheDocument();
  });

  it("calls onRetryConnection when Retry Connection button is clicked", () => {
    const onRetryConnection = jest.fn();
    render(
      <OfflineBanner
        isOnline={false}
        isViewingCached={false}
        onRetryConnection={onRetryConnection}
      />
    );

    const retryBtn = screen.getByRole("button", { name: /Retry Connection/i });
    fireEvent.click(retryBtn);

    expect(onRetryConnection).toHaveBeenCalledTimes(1);
  });

  it("renders Back Online banner when online and viewing cached data", () => {
    const onRefresh = jest.fn();
    const fetchedAt = "2026-11-26T12:00:00.000Z";

    render(
      <OfflineBanner
        isOnline={true}
        isViewingCached={true}
        cachedUsername="octocat"
        cachedFetchedAt={fetchedAt}
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByTestId("cached-notice-banner")).toBeInTheDocument();
    expect(screen.getByText(/Back Online!/i)).toBeInTheDocument();
    expect(screen.getByText(/Displaying cached results for @octocat/i)).toBeInTheDocument();

    const refreshBtn = screen.getByRole("button", { name: /Refresh Live Data/i });
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
