# Backend Outgoing GitHub Session Resilience: Timeouts, Retries, and Connection Pooling

## Overview
This document outlines the architecture and resilience mechanisms implemented for outgoing GitHub REST API requests in OpenSourceMate (Issue #196).

Prior to this implementation, API calls utilized default unconfigured timeout limits and lacked retry logic for transient upstream drops or GitHub 5xx errors. Under heavy traffic or temporary GitHub degradation, connections could stall or fail immediately without graceful backoff.

## Architecture

### 1. Shared Singleton `httpx.AsyncClient`
- Reuses an existing connection pool across concurrent user profile lookups.
- Avoids socket exhaustion and DNS lookup overhead by reusing persistent TCP and TLS handshakes.
- Managed via FastAPI lifespan hooks to ensure clean shutdown (`close_client()`).

### 2. Explicit Timeouts
Configurable via environment variables (or Pydantic `Settings`):
- `GITHUB_CONNECT_TIMEOUT` (default: `5.0s`): Maximum time allowed to establish TCP/TLS connection with GitHub servers.
- `GITHUB_READ_TIMEOUT` (default: `10.0s`): Maximum time waiting for bytes from GitHub after request delivery.
- `GITHUB_WRITE_TIMEOUT` (default: `10.0s`): Maximum time allowed for sending request payload.
- `GITHUB_POOL_TIMEOUT` (default: `5.0s`): Maximum time waiting to acquire an available connection from the pool.

### 3. Automatic Retries with Exponential Backoff
- `GITHUB_MAX_RETRIES` (default: `3`): Number of attempts before failing.
- `GITHUB_RETRY_BACKOFF_FACTOR` (default: `0.5s`): Base delay calculation: `delay = backoff_factor * (2 ** (attempt - 1))`.
- Retried conditions:
  - Network disconnection / socket drops (`httpx.NetworkError`).
  - Read/connect timeouts (`httpx.TimeoutException`).
  - Transient 5xx server errors (`500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`).
- Non-retried conditions:
  - Rate limits (`429` or `403` with `X-RateLimit-Remaining: 0`) raise `GitHubRateLimitError` immediately.
  - Client errors (`400`, `401`, `404`, `422`) return directly to caller.

### 4. Custom Error Handling & FastAPI Exception Handlers
- `GitHubTimeoutError`: Translates to standard HTTP `504 Gateway Timeout` with informative JSON payload.
- `GitHubUpstreamError`: Translates to standard HTTP `502 Bad Gateway` when GitHub repeatedly fails with 5xx status.
- `GitHubRateLimitError`: Translates to HTTP `429 Too Many Requests` with `reset_at` metadata.
