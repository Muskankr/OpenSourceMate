# API Security Hardening & Abuse Prevention

## Overview
To protect OpenSourceMate's public REST API from abuse, credential stuffing, malformed queries, and denial-of-service attempts, this update implements multi-layer API defenses independent of upstream GitHub rate limits.

---

## 1. Input Validation & Parameter Sanitization

All incoming parameters across route handlers are strictly validated:
- **GitHub Usernames**: Path and query parameters adhere strictly to GitHub conventions (1–39 alphanumeric characters, single internal hyphens, no consecutive hyphens, no leading/trailing hyphens, and no special characters or spaces).
- **Pagination Limits**: Numeric limits such as `limit` on `/external-prs` must fall between 1 and 100.
- **Skill Filters**: Custom skill lists on matching endpoints validate every entry (1–50 characters, letters, numbers, and allowed symbols `+`, `#`, `.`, `-`).
- **Repository Identifiers**: Repo parameters on `/friendliness` enforce `owner/repo` or GitHub repository URL structures.
- **AI Analysis Body**: Empty issues or payload arrays exceeding bounds are rejected immediately.
- **Response**: Any invalid input returns **HTTP 400 Bad Request** with a descriptive, user-friendly message.

---

## 2. Per-IP Rate Limiting on Analyze Endpoints

Analysis endpoints (`/api/v1/github/users/...`, `/api/v1/matching/users/...`, `/api/v1/ai/...`, `/api/v1/repositories/...`) trigger external GitHub lookups and computationally intensive algorithms.

- **Sliding Window Algorithm**: Tracks requests per client IP across a 60-second rolling window with short-term burst protection.
- **HTTP 429 Status**: Exceeding the rate limit returns `HTTP 429 Too Many Requests`.
- **Headers Sent**:
  - `Retry-After`: Integer seconds remaining until requests are permitted again.
  - `X-RateLimit-Limit`: Maximum permitted requests in window.
  - `X-RateLimit-Remaining`: Count of remaining requests.
  - `X-RateLimit-Reset`: Unix epoch timestamp when limit resets.
- **Client IP Resolution**: Respects `X-Forwarded-For` when operating behind reverse proxies (e.g. Cloudflare, Vercel, Nginx).

---

## 3. Standard Security Headers & CORS Origin Restriction

### Standard Security Headers
Added to every response (including 200, 4xx, and 5xx responses) via `SecurityHeadersMiddleware`:
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `X-Frame-Options: DENY`: Blocks framing and clickjacking attacks.
- `Referrer-Policy: no-referrer`: Prevents leaking sensitive URL paths in HTTP referrers.
- `Cross-Origin-Opener-Policy: same-origin`: Isolates browser browsing context.
- `Content-Security-Policy`: Default `default-src 'none'; frame-ancestors 'none'` for JSON API endpoints, with relaxed frame-ancestors for Swagger UI and ReDoc.
- `Strict-Transport-Security`: Enforces HTTPS in production (`max-age=31536000`).

### Configurable CORS Frontend Origin
- Configurable via `CORS_ORIGINS` (comma-separated or JSON list) or `FRONTEND_URL` environment variables.
- Defaults permit local frontend origins (`http://localhost:3000`, `http://127.0.0.1:3000`) and the canonical production Vercel app.
- Unauthorized origins do not receive `Access-Control-Allow-Origin` headers.

---

## 4. Unified Consistent JSON Error Schema

All error responses across the application follow one standardized contract:

```json
{
  "error": {
    "code": "INVALID_USERNAME",
    "message": "Invalid GitHub username '-invalid-'. GitHub usernames must be 1-39 characters, contain only alphanumeric characters or single hyphens, and cannot start or end with a hyphen.",
    "details": {
      "username": "-invalid-"
    }
  },
  "detail": "Invalid GitHub username '-invalid-'."
}
```

---

## Acceptance Criteria Checklist
- [x] **Invalid input returns 400 with a clear message**: Path, query, and body parameter validation rejections return HTTP 400 with `INVALID_USERNAME` or descriptive validation errors.
- [x] **Exceeding the limit returns 429**: High-frequency requests on analysis endpoints trigger HTTP 429 with `Retry-After` header and rate limit metadata.
- [x] **Tests cover validation, rate limiting and CORS**: Comprehensive test coverage across backend (`test_security_hardening.py`) and frontend (`apiSecurityHardening.test.ts`).
