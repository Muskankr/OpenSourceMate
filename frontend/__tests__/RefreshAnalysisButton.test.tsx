import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import RefreshAnalysisButton, { formatLocalTimestamp } from "../components/RefreshAnalysisButton";

describe("RefreshAnalysisButton Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("formatLocalTimestamp utility", () => {
    it("handles null, undefined, or empty timestamps gracefully", () => {
      expect(formatLocalTimestamp(null)).toBe("Recently");
      expect(formatLocalTimestamp(undefined)).toBe("Recently");
      expect(formatLocalTimestamp("")).toBe("Recently");
      expect(formatLocalTimestamp("invalid-date-string")).toBe("Recently");
    });

    it("formats a valid ISO timestamp", () => {
      const iso = "2026-11-03T12:00:00Z";
      const formatted = formatLocalTimestamp(iso);
      expect(typeof formatted).toBe("string");
      expect(formatted).not.toBe("Recently");
    });
  });

  describe("Component Rendering and Interaction", () => {
    it("renders analyzed at timestamp and refresh button", () => {
      const onRefresh = jest.fn();
      render(<RefreshAnalysisButton analyzedAt="2026-11-03T10:30:00Z" onRefresh={onRefresh} />);

      expect(screen.getByText(/Analyzed at:/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Refresh analysis/i })).toBeEnabled();
    });

    it("triggers onRefresh and activates 30s rate-limit cooldown upon click", () => {
      const onRefresh = jest.fn();
      render(
        <RefreshAnalysisButton
          analyzedAt="2026-11-03T10:30:00Z"
          onRefresh={onRefresh}
          cooldownSeconds={30}
        />
      );

      const button = screen.getByRole("button", { name: /Refresh analysis/i });
      fireEvent.click(button);

      expect(onRefresh).toHaveBeenCalledTimes(1);

      // Immediately after click, countdown starts at 30s and button is disabled
      expect(button).toBeDisabled();
      expect(screen.getByText(/Refresh \(30s\)/i)).toBeInTheDocument();

      // Advance timers by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/Refresh \(29s\)/i)).toBeInTheDocument();

      // Advance by remaining 29 seconds
      act(() => {
        jest.advanceTimersByTime(29000);
      });

      // Cooldown expires: button re-enabled
      expect(button).toBeEnabled();
      expect(screen.getByText("Refresh analysis")).toBeInTheDocument();
    });

    it("displays loading state when isLoading is true", () => {
      const onRefresh = jest.fn();
      render(
        <RefreshAnalysisButton
          analyzedAt="2026-11-03T10:30:00Z"
          onRefresh={onRefresh}
          isLoading={true}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(screen.getByText("Refreshing...")).toBeInTheDocument();
    });

    it("renders properly with light theme", () => {
      const onRefresh = jest.fn();
      const { container } = render(
        <RefreshAnalysisButton
          analyzedAt="2026-11-03T10:30:00Z"
          onRefresh={onRefresh}
          theme="light"
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveClass("border-gray-200");
    });
  });
});
