import { renderHook, act } from "@testing-library/react";
import {
  useIssueKeyboardNavigation,
  isEditableElement,
} from "../hooks/useIssueKeyboardNavigation";
import type { IssueRecommendation } from "../types/api";

const mockIssues: IssueRecommendation[] = [
  {
    id: 1,
    title: "First issue",
    repository: "octocat/hello-world",
    url: "https://github.com/octocat/hello-world/issues/1",
    state: "open",
    labels: [],
    comments: 0,
    created_at: "2026-11-20T10:00:00Z",
    updated_at: "2026-11-20T10:00:00Z",
  },
  {
    id: 2,
    title: "Second issue",
    repository: "pallets/flask",
    url: "https://github.com/pallets/flask/issues/2",
    state: "open",
    labels: [],
    comments: 1,
    created_at: "2026-11-20T10:00:00Z",
    updated_at: "2026-11-20T10:00:00Z",
  },
  {
    id: 3,
    title: "Third issue",
    repository: "tiangolo/fastapi",
    url: "https://github.com/tiangolo/fastapi/issues/3",
    state: "open",
    labels: [],
    comments: 2,
    created_at: "2026-11-20T10:00:00Z",
    updated_at: "2026-11-20T10:00:00Z",
  },
];

describe("useIssueKeyboardNavigation Hook (Issue #449)", () => {
  let originalOpen: typeof window.open;

  beforeEach(() => {
    originalOpen = window.open;
    window.open = jest.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
    jest.clearAllMocks();
  });

  describe("isEditableElement", () => {
    it("identifies inputs, textareas, selects, and contentEditable elements", () => {
      const input = document.createElement("input");
      const textarea = document.createElement("textarea");
      const select = document.createElement("select");
      const div = document.createElement("div");
      const contentEditable = document.createElement("div");
      contentEditable.contentEditable = "true";

      expect(isEditableElement(input)).toBe(true);
      expect(isEditableElement(textarea)).toBe(true);
      expect(isEditableElement(select)).toBe(true);
      expect(isEditableElement(contentEditable)).toBe(true);
      expect(isEditableElement(div)).toBe(false);
      expect(isEditableElement(null)).toBe(false);
    });

    it("identifies child elements inside an editable container", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      const span = document.createElement("span");
      input.appendChild(span);
      form.appendChild(input);

      expect(isEditableElement(span)).toBe(true);
    });
  });

  describe("Key Navigation (j / k)", () => {
    it("moves forward through issues with 'j' and wraps around", () => {
      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues })
      );

      expect(result.current.focusedIndex).toBe(-1);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      });
      expect(result.current.focusedIndex).toBe(0);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      });
      expect(result.current.focusedIndex).toBe(1);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      });
      expect(result.current.focusedIndex).toBe(2);

      // Wrapping back to start
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      });
      expect(result.current.focusedIndex).toBe(0);
    });

    it("moves backward through issues with 'k' and wraps around", () => {
      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues })
      );

      // From -1 or 0, 'k' moves to last issue
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
      });
      expect(result.current.focusedIndex).toBe(2);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
      });
      expect(result.current.focusedIndex).toBe(1);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
      });
      expect(result.current.focusedIndex).toBe(0);
    });
  });

  describe("Opening Issues (o / Enter)", () => {
    it("opens focused issue in new tab when 'o' is pressed", () => {
      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues })
      );

      // Focus first issue
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      });
      expect(result.current.focusedIndex).toBe(0);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "o" }));
      });
      expect(window.open).toHaveBeenCalledWith(
        mockIssues[0].url,
        "_blank",
        "noopener,noreferrer"
      );
    });

    it("opens focused issue in new tab when 'Enter' is pressed on non-button element", () => {
      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      });

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });
      expect(window.open).toHaveBeenCalledWith(
        mockIssues[0].url,
        "_blank",
        "noopener,noreferrer"
      );
    });

    it("does not intercept Enter when target is an interactive button", () => {
      const button = document.createElement("button");
      document.body.appendChild(button);

      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      });

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
        button.dispatchEvent(event);
      });

      expect(window.open).not.toHaveBeenCalled();
      document.body.removeChild(button);
    });

    it("supports custom onOpenIssue handler", () => {
      const onOpenMock = jest.fn();
      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues, onOpenIssue: onOpenMock })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
      });
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "o" }));
      });

      expect(onOpenMock).toHaveBeenCalledWith(mockIssues[0]);
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe("Shortcuts Help Dialog (?)", () => {
    it("toggles help dialog when '?' is pressed", () => {
      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues })
      );

      expect(result.current.isHelpOpen).toBe(false);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
      });
      expect(result.current.isHelpOpen).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
      });
      expect(result.current.isHelpOpen).toBe(false);
    });
  });

  describe("Input Field & Modifier Key Isolation (Acceptance Criterion 1)", () => {
    it("does nothing when typing inside an input element", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues })
      );

      act(() => {
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "j", bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "o", bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
      });

      expect(result.current.focusedIndex).toBe(-1);
      expect(result.current.isHelpOpen).toBe(false);
      expect(window.open).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it("ignores shortcuts when modifier keys (Ctrl, Alt, Meta) are held", () => {
      const { result } = renderHook(() =>
        useIssueKeyboardNavigation({ issues: mockIssues })
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", ctrlKey: true }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", altKey: true }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "o", metaKey: true }));
      });

      expect(result.current.focusedIndex).toBe(-1);
      expect(window.open).not.toHaveBeenCalled();
    });
  });
});
