import time
import uuid
import logging
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.services.metrics_service import get_metrics_collector
from app.utils.logging import (
    request_id_ctx,
    sanitize_sensitive_data,
)

logger = logging.getLogger("app.middleware.logging")


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique X-Request-ID to each incoming HTTP request,
    sets it in the asynchronous context, records latency, status code, client info,
    and returns X-Request-ID in the response headers.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract existing X-Request-ID from header or generate a new UUID4
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        token = request_id_ctx.set(request_id)

        start_time = time.perf_counter()
        client_host = request.client.host if request.client else "unknown"
        method = request.method
        url_path = request.url.path

        # Log incoming request
        logger.info(
            f"Incoming request {method} {url_path}",
            extra={
                "request_id": request_id,
                "structured_data": {
                    "event": "request_started",
                    "http_method": method,
                    "path": url_path,
                    "client_ip": client_host,
                    "query_params": sanitize_sensitive_data(dict(request.query_params)),
                }
            },
        )

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Record in metrics collector
            get_metrics_collector().record_request(
                method=method,
                path=url_path,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )

            # Attach request id to response header
            response.headers["X-Request-ID"] = request_id

            logger.info(
                f"Completed {method} {url_path} with status {response.status_code} in {duration_ms}ms",
                extra={
                    "request_id": request_id,
                    "structured_data": {
                        "event": "request_completed",
                        "http_method": method,
                        "path": url_path,
                        "status_code": response.status_code,
                        "duration_ms": duration_ms,
                    }
                },
            )
            return response
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled error on {method} {url_path}: {exc}",
                exc_info=True,
                extra={
                    "request_id": request_id,
                    "structured_data": {
                        "event": "request_failed",
                        "http_method": method,
                        "path": url_path,
                        "duration_ms": duration_ms,
                        "error_type": type(exc).__name__,
                    }
                },
            )
            raise
        finally:
            request_id_ctx.reset(token)
