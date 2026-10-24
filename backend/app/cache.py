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

    def clear(self) -> None:
        self._store.clear()

    def _evict(self) -> None:
        now = time.monotonic()

        for key in [k for k, (exp, _) in self._store.items() if exp <= now]:
            del self._store[key]

        # Still full: drop the entry that expires first.
        if len(self._store) >= self._max_entries:
            oldest = min(self._store, key=lambda k: self._store[k][0])
            del self._store[oldest]
