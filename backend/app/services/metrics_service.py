"""In-memory metrics tracking for OpenSourceMate backend (Issue #452).

Tracks:
- Request counts (total, per status code, per path/method)
- Request latencies (total count, sum ms, min, max, average)
- GitHub API calls, latencies, and error counts (rate limit, timeout, 5xx upstream, other errors)
"""

from __future__ import annotations

import threading
from typing import Any


class MetricsCollector:
    """Thread-safe collector for request and upstream GitHub API metrics."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    def reset(self) -> None:
        """Reset all metrics to zero."""
        with getattr(self, "_lock", threading.Lock()):
            self.total_requests: int = 0
            self.status_codes: dict[str, int] = {}
            self.endpoints: dict[str, int] = {}
            self.latency_sum_ms: float = 0.0
            self.latency_count: int = 0
            self.latency_min_ms: float | None = None
            self.latency_max_ms: float | None = None

            # GitHub metrics
            self.github_requests_total: int = 0
            self.github_errors_total: int = 0
            self.github_rate_limits: int = 0
            self.github_timeouts: int = 0
            self.github_upstream_5xx: int = 0
            self.github_latency_sum_ms: float = 0.0
            self.github_latency_count: int = 0
            self.github_last_rate_limit_remaining: int | None = None

    def record_request(self, method: str, path: str, status_code: int, duration_ms: float) -> None:
        """Record an incoming HTTP request completion."""
        with self._lock:
            self.total_requests += 1

            status_key = str(status_code)
            self.status_codes[status_key] = self.status_codes.get(status_key, 0) + 1

            endpoint_key = f"{method} {path}"
            self.endpoints[endpoint_key] = self.endpoints.get(endpoint_key, 0) + 1

            self.latency_sum_ms += duration_ms
            self.latency_count += 1
            if self.latency_min_ms is None or duration_ms < self.latency_min_ms:
                self.latency_min_ms = duration_ms
            if self.latency_max_ms is None or duration_ms > self.latency_max_ms:
                self.latency_max_ms = duration_ms

    def record_github_call(
        self,
        duration_ms: float,
        remaining_rate_limit: int | None = None,
        error_type: str | None = None,
    ) -> None:
        """Record an outgoing GitHub API call."""
        with self._lock:
            self.github_requests_total += 1
            self.github_latency_sum_ms += duration_ms
            self.github_latency_count += 1

            if remaining_rate_limit is not None:
                self.github_last_rate_limit_remaining = remaining_rate_limit

            if error_type:
                self.github_errors_total += 1
                if error_type == "rate_limit":
                    self.github_rate_limits += 1
                elif error_type == "timeout":
                    self.github_timeouts += 1
                elif error_type == "upstream_5xx":
                    self.github_upstream_5xx += 1

    def get_metrics_snapshot(self) -> dict[str, Any]:
        """Return a read-only snapshot dictionary of all collected metrics."""
        with self._lock:
            avg_latency = (
                round(self.latency_sum_ms / self.latency_count, 2)
                if self.latency_count > 0
                else 0.0
            )
            github_avg_latency = (
                round(self.github_latency_sum_ms / self.github_latency_count, 2)
                if self.github_latency_count > 0
                else 0.0
            )

            return {
                "requests": {
                    "total": self.total_requests,
                    "by_status": dict(self.status_codes),
                    "by_endpoint": dict(self.endpoints),
                    "latency_ms": {
                        "average": avg_latency,
                        "min": self.latency_min_ms if self.latency_min_ms is not None else 0.0,
                        "max": self.latency_max_ms if self.latency_max_ms is not None else 0.0,
                    },
                },
                "github": {
                    "requests_total": self.github_requests_total,
                    "errors_total": self.github_errors_total,
                    "rate_limit_errors": self.github_rate_limits,
                    "timeouts": self.github_timeouts,
                    "upstream_5xx_errors": self.github_upstream_5xx,
                    "average_latency_ms": github_avg_latency,
                    "last_rate_limit_remaining": self.github_last_rate_limit_remaining,
                },
            }


_metrics_collector = MetricsCollector()


def get_metrics_collector() -> MetricsCollector:
    """Return the global singleton metrics collector."""
    return _metrics_collector
