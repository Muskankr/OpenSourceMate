import json
import logging
import re
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

# ContextVar holding the current request id for the active async task
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")

# Sensitive key patterns to sanitize
SENSITIVE_KEYS = {
    "authorization",
    "token",
    "github_token",
    "access_token",
    "secret",
    "secret_key",
    "password",
    "api_key",
    "ai_api_key",
    "bearer",
}

# Regex to detect and mask Bearer/token patterns in text
TOKEN_REGEX = re.compile(r"(gh[pousr]_[A-Za-z0-9_]{16,}|Bearer\s+[A-Za-z0-9_\-\.]+)", re.IGNORECASE)


def sanitize_sensitive_data(data: Any) -> Any:
    """
    Recursively sanitize dictionaries, lists, and strings to prevent leaking tokens or secrets in logs.
    """
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            k_lower = str(k).lower()
            if any(s in k_lower for s in SENSITIVE_KEYS):
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = sanitize_sensitive_data(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_sensitive_data(item) for item in data]
    elif isinstance(data, str):
        # Mask tokens in string values
        return TOKEN_REGEX.sub("[REDACTED_TOKEN]", data)
    return data


class StructuredJsonFormatter(logging.Formatter):
    """
    Formats log records into machine-readable JSON output with timestamp, level,
    request ID context, caller metadata, and sanitized payload details.
    """

    def format(self, record: logging.LogRecord) -> str:
        raw_msg = record.getMessage()
        sanitized_msg = sanitize_sensitive_data(raw_msg) if isinstance(raw_msg, str) else str(raw_msg)
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": sanitized_msg,
        }

        # Include request ID if present in context or record
        req_id = getattr(record, "request_id", None) or request_id_ctx.get()
        if req_id:
            log_entry["request_id"] = req_id

        # Include caller metadata
        log_entry["module"] = record.module
        log_entry["line"] = record.lineno

        # Extract extra structured fields
        if hasattr(record, "structured_data") and isinstance(record.structured_data, dict):
            log_entry.update(sanitize_sensitive_data(record.structured_data))

        # Check for exception info
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_structured_logging(level: str = "INFO", json_format: bool = True) -> None:
    """
    Configures root and app loggers with structured JSON formatting.
    """
    root_logger = logging.getLogger()
    log_level = getattr(logging, level.upper(), logging.INFO)
    root_logger.setLevel(log_level)

    # Clear existing handlers
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if json_format:
        handler.setFormatter(StructuredJsonFormatter())
    else:
        fmt = "%(asctime)s [%(levelname)s] [req_id=%(request_id)s] %(name)s: %(message)s"
        handler.setFormatter(logging.Formatter(fmt))

    root_logger.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """
    Retrieves a logger instance for an application module.
    """
    return logging.getLogger(name)
