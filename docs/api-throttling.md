# Backend Public API Per-IP Rate Throttling

## Overview
This document specifies the per-IP request throttling architecture implemented for OpenSourceMate's public REST API (Issue #197).

Unauthenticated, public API access is protected to prevent denial of service (DoS), scraper abuse, and exhaustion of upstream GitHub API quotas.

## Architecture

### 1. Sliding-Window Rate Limiter
The backend implements an in-memory sliding-window rate limiter in `app/middleware/rate_limit.py`:
- Tracks request timestamps per client IP.
- Prunes expired records older than the 60-second sliding window.
- Calculates accurate `Retry-After` seconds based on the oldest request timestamp in the active window.
- Enforces a short-window burst limit (maximum number of requests allowed within any 5-second interval).

### 2. Configuration Parameters
Customizable via environment variables (or Pydantic `Settings`):
- `API_RATE_LIMIT_ENABLED` (default: `True`): Master toggle for API rate limiting.
- `API_RATE_LIMIT_PER_MINUTE` (default: `60` requests / minute): Steady-state maximum requests per IP.
- `API_RATE_LIMIT_BURST` (default: `25` requests): Peak burst protection over a 5-second window.

### 3. Exemption Policies
Certain endpoints are exempt from IP rate throttling to preserve operational health monitoring and developer documentation:
- Health check endpoints: `/api/health`, `/api/v1/health`, `/api/health/diagnostics`, `/api/v1/health/diagnostics`.
- OpenAPI documentation: `/docs`, `/redoc`, `/openapi.json`.

### 4. Client IP Resolution
- Inspects `X-Forwarded-For` header for proxy/load-balancer configurations (e.g. Vercel, Cloudflare, AWS ALB), taking the client's original IP address.
- Falls back to `request.client.host` for direct connections.

### 5. Response Protocol & Headers
When rate limits are exceeded, the API returns `429 Too Many Requests`:
```json
{
  "code": "IP_RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please slow down and try again in a minute.",
  "details": {
    "client_ip": "203.0.113.195",
    "retry_after_seconds": 45
  }
}
```
HTTP response headers included on all responses:
- `X-RateLimit-Limit`: Maximum allowed requests per window.
- `X-RateLimit-Remaining`: Count of remaining permitted requests in the current window.
- `Retry-After`: (On 429) Number of seconds the client must wait.
- `X-RateLimit-Reset`: (On 429) Unix epoch timestamp when requests are replenished.
