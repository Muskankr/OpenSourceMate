"use client";

import { useState, useEffect, useCallback } from "react";
import type { IssueRecommendation } from "../types/api";

export interface UseIssueKeyboardNavigationOptions {
  issues: IssueRecommendation[];
  enabled?: boolean;
  onOpenIssue?: (issue: IssueRecommendation) => void;
}

/**
 * Checks whether an event target is an interactive editable form element.
 * When true, global single-key shortcuts must be ignored.
 */
export function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  const ceAttr = target.getAttribute("contenteditable");
  const isCe =
    target.isContentEditable ||
    ceAttr === "true" ||
    ceAttr === "" ||
    (target as any).contentEditable === "true";
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    Boolean(isCe) ||
    Boolean(
      target.closest(
        "input, textarea, select, [contenteditable='true'], [contenteditable='']"
      )
    )
  );
}

export function useIssueKeyboardNavigation({
  issues,
  enabled = true,
  onOpenIssue,
}: UseIssueKeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Clamp focusedIndex whenever issues change
  useEffect(() => {
    if (issues.length === 0) {
      setFocusedIndex(-1);
    } else if (focusedIndex >= issues.length) {
      setFocusedIndex(issues.length - 1);
    }
  }, [issues.length, focusedIndex]);

  const openFocusedIssue = useCallback(
    (index: number) => {
      if (index >= 0 && index < issues.length) {
        const issue = issues[index];
        if (onOpenIssue) {
          onOpenIssue(issue);
        } else if (issue.url && typeof window !== "undefined") {
          window.open(issue.url, "_blank", "noopener,noreferrer");
        }
      }
    },
    [issues, onOpenIssue]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 1. Never handle shortcuts when modifier keys like Ctrl, Alt, Meta are active
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // 2. Ignore all shortcuts when typing inside form fields, inputs, textareas
      if (isEditableElement(e.target) || isEditableElement(document.activeElement)) {
        return;
      }

      // 3. '?' opens the shortcuts help dialog
      if (e.key === "?") {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      if (!enabled || issues.length === 0) return;

      // 4. 'j' moves focus to next card
      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < issues.length - 1 ? prev + 1 : 0;
          // Smoothly scroll the card into view if available
          if (typeof document !== "undefined") {
            const cardEl = document.querySelector(`[data-issue-index="${next}"]`);
            if (cardEl && typeof cardEl.scrollIntoView === "function") {
              cardEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
          }
          return next;
        });
        return;
      }

      // 5. 'k' moves focus to previous card
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : issues.length - 1;
          if (typeof document !== "undefined") {
            const cardEl = document.querySelector(`[data-issue-index="${next}"]`);
            if (cardEl && typeof cardEl.scrollIntoView === "function") {
              cardEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
          }
          return next;
        });
        return;
      }

      // 6. 'o' opens the currently focused issue in a new tab
      if (e.key === "o" || e.key === "O") {
        if (focusedIndex >= 0 && focusedIndex < issues.length) {
          e.preventDefault();
          openFocusedIssue(focusedIndex);
        }
        return;
      }

      // 7. 'Enter' opens currently focused card, provided user isn't clicking a button/link
      if (e.key === "Enter") {
        const target = e.target;
        const isClickable =
          target instanceof HTMLElement &&
          (target.tagName.toLowerCase() === "button" ||
            target.tagName.toLowerCase() === "a" ||
            Boolean(target.closest("button, a")));

        if (!isClickable && focusedIndex >= 0 && focusedIndex < issues.length) {
          e.preventDefault();
          openFocusedIssue(focusedIndex);
        }
      }
    },
    [enabled, issues, focusedIndex, openFocusedIssue]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    focusedIndex,
    setFocusedIndex,
    isHelpOpen,
    setIsHelpOpen,
    openFocusedIssue,
  };
}
