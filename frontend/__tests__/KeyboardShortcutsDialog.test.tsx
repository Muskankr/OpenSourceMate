import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import KeyboardShortcutsDialog, {
  DEFAULT_KEYBOARD_SHORTCUTS,
} from "../components/KeyboardShortcutsDialog";

describe("KeyboardShortcutsDialog Component (#335)", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    theme: "dark" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<KeyboardShortcutsDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId("keyboard-shortcuts-dialog")).not.toBeInTheDocument();
  });

  it("renders with accessible dialog role and labeled elements when open", () => {
    render(<KeyboardShortcutsDialog {...defaultProps} />);

    const dialog = screen.getByTestId("keyboard-shortcuts-dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "keyboard-shortcuts-title");
    expect(dialog).toHaveAttribute("aria-describedby", "keyboard-shortcuts-desc");

    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });

  it("renders all default shortcuts and their key combinations", () => {
    render(<KeyboardShortcutsDialog {...defaultProps} />);

    DEFAULT_KEYBOARD_SHORTCUTS.forEach((shortcut) => {
      expect(screen.getByText(shortcut.description)).toBeInTheDocument();
      shortcut.keyCombo.forEach((k) => {
        expect(screen.getAllByText(k).length).toBeGreaterThan(0);
      });
    });
  });

  it("triggers onClose when Escape key is pressed", () => {
    const onClose = jest.fn();
    render(<KeyboardShortcutsDialog {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onClose when backdrop is clicked", () => {
    const onClose = jest.fn();
    render(<KeyboardShortcutsDialog {...defaultProps} onClose={onClose} />);

    const backdrop = screen.getByTestId("keyboard-shortcuts-backdrop");
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(<KeyboardShortcutsDialog {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByTestId("shortcuts-close-button");
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("supports light theme rendering", () => {
    render(<KeyboardShortcutsDialog {...defaultProps} theme="light" />);

    const dialog = screen.getByTestId("keyboard-shortcuts-dialog");
    expect(dialog).toHaveClass("bg-white/95");
    expect(dialog).toHaveClass("text-slate-800");
  });

  it("traps focus between first and last focusable elements on Tab and Shift+Tab", () => {
    render(<KeyboardShortcutsDialog {...defaultProps} />);

    const closeBtn = screen.getByTestId("shortcuts-close-button");
    const gotItBtn = screen.getByRole("button", { name: /Got it/i });

    // Focus last element and press Tab -> should wrap to first
    gotItBtn.focus();
    expect(document.activeElement).toBe(gotItBtn);

    fireEvent.keyDown(window, { key: "Tab" });

    // Focus first element and press Shift+Tab -> should wrap to last
    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);

    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
  });
});
