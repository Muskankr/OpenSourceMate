import time
from typing import Any


class TTLCache:
    """Small in-process cache where every entry expires after `ttl` seconds.

    Only get/set/clear are used by the services, so another backend (for
    example Redis) can replace this class without touching the callers.
    """

    def __init__(self, max_entries: int = 1000):
        self._max_entries = max_entries
        self._store: dict[str, tuple[float, Any]] = {}
        # Stores ETags and cached payloads for conditional HTTP requests (Issue #338)
        self._etag_store: dict[str, tuple[str, Any]] = {}

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)

        if entry is None:
            return None

        expires_at, value = entry

        if expires_at <= time.monotonic():
            del self._store[key]
            return None

        return value

    def set(self, key: str, value: Any, ttl: float) -> None:
        if ttl <= 0:
            return

        if len(self._store) >= self._max_entries:
            self._evict()

        self._store[key] = (time.monotonic() + ttl, value)

    def get_etag(self, url: str) -> tuple[str, Any] | None:
        """Get cached ETag and corresponding payload for conditional HTTP requests."""
        return self._etag_store.get(url)

    def set_etag(self, url: str, etag: str, value: Any) -> None:
        """Store ETag and response payload for conditional caching."""
        if not etag or not url:
            return
        if len(self._etag_store) >= self._max_entries:
            # Evict first item
            first_key = next(iter(self._etag_store))
            del self._etag_store[first_key]
        self._etag_store[url] = (etag, value)

    def clear(self) -> None:
        self._store.clear()
        self._etag_store.clear()

    def stats(self) -> dict[str, int]:
        now = time.monotonic()
        active = sum(1 for exp, _ in self._store.values() if exp > now)
        return {
            "active_entries": active,
            "total_keys": len(self._store),
            "etag_entries": len(self._etag_store),
            "max_entries": self._max_entries,
        }

    def _evict(self) -> None:
        now = time.monotonic()

        for key in [k for k, (exp, _) in self._store.items() if exp <= now]:
            del self._store[key]

        # Still full: drop the entry that expires first.
        if len(self._store) >= self._max_entries:
            oldest = min(self._store, key=lambda k: self._store[k][0])
            del self._store[oldest]


# Shared global cache instance for GitHub responses and ETags
cache = TTLCache()
