import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ReactErrorBoundary from "../components/ReactErrorBoundary";
import { buildErrorDiagnostics, sanitizeRoute, sanitizeErrorMessage } from "../utils/errorDiagnostics";

function FailingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Render crash with token ghp_secretToken12345");
  }
  return <div data-testid="healthy-child">Healthy content</div>;
}

describe("ReactErrorBoundary & Error Diagnostics (Issue #477)", () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress React's own JSDOM error boundary console noise during intentional throw tests
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  it("renders friendly fallback when a child throws and re-renders on Try again", () => {
    let shouldThrow = true;
    const { rerender } = render(
      <ReactErrorBoundary>
        <FailingChild shouldThrow={shouldThrow} />
      </ReactErrorBoundary>
    );

    expect(screen.getByTestId("react-error-boundary-fallback")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Fix the child condition and click Try again
    shouldThrow = false;
    rerender(
      <ReactErrorBoundary>
        <FailingChild shouldThrow={shouldThrow} />
      </ReactErrorBoundary>
    );

    fireEvent.click(screen.getByTestId("error-boundary-try-again"));
    expect(screen.getByTestId("healthy-child")).toBeInTheDocument();
  });

  it("copies sanitized diagnostics with no usernames or tokens", async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(
      <ReactErrorBoundary>
        <FailingChild shouldThrow={true} />
      </ReactErrorBoundary>
    );

    fireEvent.click(screen.getByTestId("error-boundary-copy-diagnostics"));

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const copiedText = writeTextMock.mock.calls[0][0] as string;
    expect(copiedText).toContain("App Version:");
    expect(copiedText).toContain("Route:");
    expect(copiedText).toContain("Browser:");
    expect(copiedText).toContain("Error: Render crash with token [REDACTED]");
    expect(copiedText).not.toContain("ghp_secretToken12345");
  });

  it("sanitizes /u/<username> routes and query strings in diagnostics", () => {
    expect(sanitizeRoute("/u/octocat?q=react#top")).toBe("/u/[username]");
    expect(sanitizeRoute("/compare?a=alice&b=bob")).toBe("/compare");
    expect(sanitizeErrorMessage("Bearer abc.def.ghi failed")).toBe("[REDACTED] failed");

    const diag = buildErrorDiagnostics(new Error("Boom"), {
      appVersion: "1.2.3",
      route: "/u/octocat?token=123",
      userAgent: "TestBrowser/1.0",
    });
    expect(diag).toBe(
      "App Version: 1.2.3\nRoute: /u/[username]\nBrowser: TestBrowser/1.0\nError: Boom"
    );
    expect(diag).not.toContain("octocat");
  });
});
