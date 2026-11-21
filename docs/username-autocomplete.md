# GitHub Username Autocomplete with Debounce & Rate-Limit Shield

## Overview

Entering GitHub usernames manually can be error-prone due to typos, case variations, and special characters. However, querying GitHub's search user API naively on every keystroke quickly consumes rate limits and degrades frontend performance.

To resolve this, OpenSourceMate implements a multi-layer rate-limit shield paired with a client-side debounced combobox component.

---

## Architecture & Rate-Limit Protection

1. **Threshold & Debounce Gate**:
   - Keystrokes are debounced by **300ms** (`debounceMs = 300`).
   - Requests are suppressed unless the input contains at least **3 characters** (`minChars = 3`).
2. **Request AbortController Cancellation**:
   - Typing rapid characters aborts stale in-flight requests, preventing out-of-order responses and saving client bandwidth.
3. **Backend Multi-Tier Caching**:
   - Backend queries are cached in `autocomplete_cache` for **10 minutes (600s)**, returning immediate results for common prefixes.
4. **Graceful Fallback on Rate Limits (HTTP 429)**:
   - If GitHub returns HTTP 429 or secondary limits, the component automatically closes the dropdown and falls back cleanly to a standard text input without blocking form submission.
5. **Accessibility (WAI-ARIA Combobox Pattern)**:
   - Implements `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, and `aria-activedescendant`.
   - Supports keyboard `ArrowUp`, `ArrowDown`, `Enter` selection, and `Escape` dismissal.

---

## API Specification

### Endpoint: `GET /api/v1/github/users/autocomplete?q={prefix}&limit=5`

#### Sample Response:
```json
[
  {
    "username": "octocat",
    "avatar_url": "https://avatars.githubusercontent.com/u/583231",
    "profile_url": "https://github.com/octocat"
  },
  {
    "username": "octocat-dev",
    "avatar_url": "https://avatars.githubusercontent.com/u/123",
    "profile_url": "https://github.com/octocat-dev"
  }
]
```

---

## Verification
- Backend service tested in `backend/tests/test_username_autocomplete.py` (4 unit tests).
- Frontend component interactions tested in `frontend/__tests__/UsernameAutocomplete.test.tsx` (5 unit tests).
