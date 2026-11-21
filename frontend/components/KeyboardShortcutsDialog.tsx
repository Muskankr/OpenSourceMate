"use client";

import React, { useEffect, useRef } from "react";

export interface ShortcutItem {
  keyCombo: string[];
  description: string;
  category: "Navigation" | "Actions" | "General";
}

export const DEFAULT_KEYBOARD_SHORTCUTS: ShortcutItem[] = [
  {
    keyCombo: ["?"],
    description: "Open / close this keyboard shortcuts help dialog",
    category: "General",
  },
  {
    keyCombo: ["/"],
    description: "Focus the GitHub username analyzer input",
    category: "Navigation",
  },
  {
    keyCombo: ["Esc"],
    description: "Close active modals, dialogs, or mobile navigation menu",
    category: "General",
  },
  {
    keyCombo: ["t"],
    description: "Toggle between Dark and Light mode themes",
    category: "Actions",
  },
  {
    keyCombo: ["p"],
    description: "Open the recommendation preferences panel",
    category: "Actions",
  },
  {
    keyCombo: ["m"],
    description: "Toggle mobile navigation disclosure menu",
    category: "Navigation",
  },
];

export interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
  shortcuts?: ShortcutItem[];
}

/**
 * KeyboardShortcutsDialog Component (Issue #335)
 *
 * Implements accessible modal dialog:
 * - Triggered globally with '?' (Shift + /)
 * - Suppressed when typing inside inputs, textareas, or contentEditable elements
 * - Closes on 'Escape' or backdrop click
 * - Focus is trapped within dialog while open and returned to previous active element on close
 * - ARIA role="dialog", aria-modal="true", aria-labelledby, aria-describedby
 */
export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  isOpen,
  onClose,
  theme = "dark",
  shortcuts = DEFAULT_KEYBOARD_SHORTCUTS,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const isDark = theme === "dark";

  // Remember active element when opened and return focus on close
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      // Focus the close button when opened
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else if (triggerElementRef.current) {
      triggerElementRef.current.focus();
      triggerElementRef.current = null;
    }
  }, [isOpen]);

  // Handle Escape key and Tab focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="keyboard-shortcuts-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        aria-describedby="keyboard-shortcuts-desc"
        data-testid="keyboard-shortcuts-dialog"
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl backdrop-blur-xl transition-all ${
          isDark
            ? "border-slate-800 bg-slate-900/95 text-slate-100 shadow-emerald-950/30"
            : "border-slate-200 bg-white/95 text-slate-800 shadow-slate-300/60"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/40">
          <div>
            <h2
              id="keyboard-shortcuts-title"
              className="text-lg font-bold tracking-tight flex items-center gap-2"
            >
              <span>⌨️</span> Keyboard Shortcuts
            </h2>
            <p
              id="keyboard-shortcuts-desc"
              className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Navigate OpenSourceMate quickly with keyboard hotkeys
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            data-testid="shortcuts-close-button"
            className="p-1.5 rounded-xl border border-transparent text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content categorized */}
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-xs uppercase font-semibold tracking-wider text-emerald-400 mb-2">
                {category}
              </h3>
              <div className="space-y-1.5">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className={`flex items-center justify-between p-2 rounded-xl text-sm ${
                        isDark ? "bg-slate-950/40 hover:bg-slate-800/40" : "bg-slate-50 hover:bg-slate-100"
                      } transition-colors`}
                    >
                      <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keyCombo.map((k) => (
                          <kbd
                            key={k}
                            className={`px-2 py-0.5 rounded-lg border font-mono text-xs font-semibold shadow-sm ${
                              isDark
                                ? "border-slate-700 bg-slate-800 text-slate-200"
                                : "border-slate-300 bg-white text-slate-700"
                            }`}
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`mt-5 pt-3 border-t text-xs flex justify-between items-center ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
          <span>Press <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono">Esc</kbd> anytime to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl font-medium text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsDialog;
