# Keyboard Shortcuts Help Dialog Architecture & Guide

## Overview
As specified in Issue #335, OpenSourceMate implements a global, fully accessible **Keyboard Shortcuts Help Dialog** (`frontend/components/KeyboardShortcutsDialog.tsx`).

Power users, maintainers, and screen reader / keyboard-only developers can navigate the application efficiently through keyboard shortcuts.

---

## Shortcut Specifications

| Key | Action | Context |
| :--- | :--- | :--- |
| `?` (`Shift` + `/`) | Open / Close Keyboard Shortcuts Dialog | Global (suppressed when typing in inputs/textareas) |
| `/` | Focus the GitHub Username input | Global |
| `Esc` | Close active dialogs, modals, and mobile navigation menus | Global |
| `t` | Toggle between Dark and Light mode themes | Global |
| `p` | Toggle Contribution Match Preferences panel | Global |
| `m` | Toggle Mobile Navigation disclosure menu | Viewport < 768px |

---

## Accessibility & Focus Trapping Design

### 1. ARIA Attributes
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby="keyboard-shortcuts-title"`
- `aria-describedby="keyboard-shortcuts-desc"`

### 2. Focus Management
- When triggered, the dialog records `document.activeElement`.
- Automatically transfers focus to the dialog close button upon opening.
- Traps keyboard `Tab` and `Shift + Tab` navigation exclusively inside the dialog container so users cannot tab behind the backdrop.
- Upon dismissal (via `Escape`, close button, or backdrop click), returns keyboard focus to the element that was focused prior to opening.

### 3. Input Suppression Rule
The `?` shortcut listener checks `document.activeElement`:
If the user is currently editing an `<input>`, `<textarea>`, `<select>`, or `contentEditable` field, the shortcut is ignored so typing punctuation does not trigger the modal.

---

## Testing & Verification
All behaviors are tested in `frontend/__tests__/KeyboardShortcutsDialog.test.tsx`:
- Modal visibility and ARIA attributes.
- Keyboard `Escape` and backdrop dismissal.
- Focus trapping and wrapping.
- Dark and light theme tokens.

Run tests:
```bash
npm --prefix frontend test -- __tests__/KeyboardShortcutsDialog.test.tsx
```
