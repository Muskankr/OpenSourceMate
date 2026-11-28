import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../components/ToastProvider";

// Test component using the hook
const TestToastConsumer: React.FC = () => {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success("Username copied successfully!", { title: "Copied" })}>
        Trigger Success
      </button>
      <button
        onClick={() => toast.error("Rate limit reached. Please wait 60s.", { title: "Rate Limit" })}
      >
        Trigger Error
      </button>
      <button onClick={() => toast.info("Profile exported as markdown.", { duration: 1000 })}>
        Trigger Info
      </button>
      <button onClick={() => toast.clearToasts()}>Clear All</button>
    </div>
  );
};

describe("Toast Notification System (#260)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("throws error when useToast is used outside of ToastProvider", () => {
    // Suppress console.error for expected test throw
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestToastConsumer />)).toThrow(
      "useToast must be used within a ToastProvider"
    );
    spy.mockRestore();
  });

  it("renders success toast with role status and aria-live polite", () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Success"));

    const toast = screen.getByTestId("toast-success");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveAttribute("role", "status");
    expect(toast).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Copied")).toBeInTheDocument();
    expect(screen.getByText("Username copied successfully!")).toBeInTheDocument();
  });

  it("renders error toast with role alert and aria-live assertive", () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Error"));

    const toast = screen.getByTestId("toast-error");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveAttribute("role", "alert");
    expect(toast).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByText("Rate Limit")).toBeInTheDocument();
    expect(screen.getByText("Rate limit reached. Please wait 60s.")).toBeInTheDocument();
  });

  it("auto-dismisses toasts after specified duration", () => {
    render(
      <ToastProvider defaultDuration={3000}>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Info"));
    expect(screen.getByTestId("toast-info")).toBeInTheDocument();

    // Advance timers by specified duration (1000ms for Info button)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByTestId("toast-info")).not.toBeInTheDocument();
  });

  it("dismisses toast manually via close button", () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Success"));
    const toast = screen.getByTestId("toast-success");
    expect(toast).toBeInTheDocument();

    const dismissBtn = screen.getByTestId("toast-dismiss-button");
    fireEvent.click(dismissBtn);

    expect(screen.queryByTestId("toast-success")).not.toBeInTheDocument();
  });

  it("queues multiple toasts correctly and limits to maxToasts", () => {
    render(
      <ToastProvider maxToasts={2}>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Success"));
    fireEvent.click(screen.getByText("Trigger Error"));
    fireEvent.click(screen.getByText("Trigger Info"));

    // Max 2 toasts should be rendered; the oldest (success) should be pushed out
    expect(screen.queryByTestId("toast-success")).not.toBeInTheDocument();
    expect(screen.getByTestId("toast-error")).toBeInTheDocument();
    expect(screen.getByTestId("toast-info")).toBeInTheDocument();
  });

  it("clears all toasts via clearToasts callback", () => {
    render(
      <ToastProvider>
        <TestToastConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Success"));
    fireEvent.click(screen.getByText("Trigger Error"));
    expect(screen.getByTestId("toast-success")).toBeInTheDocument();
    expect(screen.getByTestId("toast-error")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear All"));
    expect(screen.queryByTestId("toast-success")).not.toBeInTheDocument();
    expect(screen.queryByTestId("toast-error")).not.toBeInTheDocument();
  });
});
