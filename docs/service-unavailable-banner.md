# Service Unavailable Banner & Offline Resilience (Issue #128)

## 1. Overview

When the backend API server is down, unreachable, stopped during development, or returning `5xx` errors (`500`, `502`, `503`, `504`), users previously saw vague or technical error text. 

**Issue #128** introduces an empathetic, non-technical **Service Unavailable Banner** (`<ServiceUnavailableBanner />`) that:
- Prominently informs the user that the backend server cannot be reached.
- Provides a one-click **"Retry Connection"** button to re-attempt the analysis.
- Provides a direct **"Report Problem"** link pre-filling a GitHub issue.
- **Strictly suppresses all raw errors, stack traces, and internal file paths**, preserving a polished developer experience.
- Builds upon the environment configuration in [PR #21](https://github.com/Muskankr/OpenSourceMate/pull/21) (Issue #1) and rate-limit error handling in [Issue #41](https://github.com/Muskankr/OpenSourceMate/issues/41).

---

## 2. Architecture & Error Classification

Error handling is centralized in `frontend/utils/errorHandling.ts`:

```
User Action (Analyze Profile)
            │
            ▼
     typedRequest()
            │
    ┌───────┴────────────────────────┐
    │                                │
    ▼                                ▼
Success                        Error Caught
                                     │
                    ┌────────────────┴─────────────────┐
                    │                                  │
                    ▼                                  ▼
         isNetworkOrServerError()                 Client Error
         (500, 502, 503, 504, 0,                (400, 404, 429)
         TypeError, ECONNREFUSED)                      │
                    │                                  ▼
                    ▼                           Standard Alert
      resolveServiceErrorDetails()              (e.g., User Not Found,
                    │                           Rate limit with reset time)
                    ▼
     <ServiceUnavailableBanner />
     - Friendly Title & Message
     - "Retry Connection" Button
     - "Report Problem" Link
     - Suppressed Traceback / Safe Mode
```

### Detection Invariants (`isNetworkOrServerError`)

| Error Condition | Trigger | Presentation |
| :--- | :--- | :--- |
| **Backend Stopped / Offline** | `TypeError: Failed to fetch`, `ECONNREFUSED`, status `0` | `<ServiceUnavailableBanner title="Unable to Connect to Server" />` |
| **Gateway / Upstream Down** | HTTP `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout` | `<ServiceUnavailableBanner title="Service Temporarily Unavailable" />` |
| **Internal Server Error** | HTTP `500 Internal Server Error` | `<ServiceUnavailableBanner title="Backend Service Error" />` |
| **Rate Limited (Issue #41)** | HTTP `429 Too Many Requests` | Standard red alert showing exact reset time |
| **User Not Found** | HTTP `404 Not Found` | Standard red alert suggesting spelling check |
| **Invalid Input** | Client validation failure | Inline form error message |

---

## 3. Security & Information Leakage Prevention

The `sanitizeErrorMessage` utility ensures:
1. **Zero Stack Traces**: Python tracebacks (`Traceback (most recent call last):`) and Node/V8 stack traces (`at ...`) are stripped and replaced with safe, user-friendly language.
2. **Zero Internal Paths**: File paths (`/var/...`, `C:\...`, `node_modules`) are removed.
3. **Zero Credentials Exposed**: GitHub tokens or internal environment variables are never attached to error alerts or report links.

---

## 4. Accessibility (WCAG 2.1 AA)

- **Role**: `role="alert"` ensures screen readers announce the alert immediately.
- **Live Region**: `aria-live="assertive"` with `aria-atomic="true"`.
- **Keyboard Navigation**: All interactive elements (Retry button, Report link, Dismiss button) have visible focus indicators (`focus-visible:ring-2 focus-visible:ring-amber-400`).
- **Contrast**: Tested in both Dark Mode (`amber-100` on `bg-amber-950/40`) and Light Mode (`amber-950` on `bg-amber-50`) to exceed the 4.5:1 contrast ratio.

---

## 5. Verification & Testing

Run the test suite to verify the service unavailable banner and error handling utilities:

```bash
# Frontend unit and component tests
cd frontend
npm test -- --ci __tests__/ServiceUnavailableBanner.test.tsx __tests__/errorHandling.test.ts __tests__/Home.test.tsx

# Lint and type check
npm run lint
npx tsc --noEmit
```

