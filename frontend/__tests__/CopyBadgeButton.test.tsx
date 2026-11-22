import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CopyBadgeButton from "../components/CopyBadgeButton";

describe("CopyBadgeButton Component", () => {
  let originalClipboard: Clipboard;

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
      writable: true,
    });
    jest.useRealTimers();
  });

  it("renders with default label and accessibility attributes", () => {
    render(<CopyBadgeButton username="octocat" />);

    const button = screen.getByRole("button", {
      name: /copy badge markdown for github profile readme/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Copy badge Markdown");
    expect(button).toHaveAttribute("data-testid", "copy-badge-markdown-btn");
  });

  it("copies markdown snippet to clipboard when clicked", async () => {
    jest.useFakeTimers();
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<CopyBadgeButton username="octocat" />);

    const button = screen.getByRole("button", {
      name: /copy badge markdown for github profile readme/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const copiedText = writeTextMock.mock.calls[0][0];
    expect(copiedText).toContain("/api/badge/octocat.svg");
    expect(copiedText).toContain("[![OpenSourceMate Skills]");

    // State changes to "Badge copied!"
    expect(button).toHaveTextContent("Badge copied!");

    // After 2 seconds, reverts back
    act(() => {
      jest.advanceTimersByTime(2100);
    });

    expect(button).toHaveTextContent("Copy badge Markdown");
  });

  it("falls back to document.execCommand when clipboard API is unavailable", async () => {
    jest.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const execCommandMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      value: execCommandMock,
      configurable: true,
      writable: true,
    });

    render(<CopyBadgeButton username="alice" />);
    const button = screen.getByRole("button", {
      name: /copy badge markdown for github profile readme/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(execCommandMock).toHaveBeenCalledWith("copy");
    expect(button).toHaveTextContent("Badge copied!");
  });

  it("does nothing when username is empty", async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<CopyBadgeButton username="" />);
    const button = screen.getByRole("button");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeTextMock).not.toHaveBeenCalled();
    expect(button).toHaveTextContent("Copy badge Markdown");
  });
});
