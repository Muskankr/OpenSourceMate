from app.cache import TTLCache


def test_returns_value_before_expiry(monkeypatch):
    now = [100.0]
    monkeypatch.setattr("app.cache.time.monotonic", lambda: now[0])

    cache = TTLCache()
    cache.set("a", {"x": 1}, ttl=10)

    now[0] = 109.0
    assert cache.get("a") == {"x": 1}


def test_entry_expires_after_ttl(monkeypatch):
    now = [100.0]
    monkeypatch.setattr("app.cache.time.monotonic", lambda: now[0])

    cache = TTLCache()
    cache.set("a", 1, ttl=10)

    now[0] = 110.0
    assert cache.get("a") is None


def test_zero_ttl_does_not_store():
    cache = TTLCache()
    cache.set("a", 1, ttl=0)

    assert cache.get("a") is None


def test_oldest_entry_dropped_when_full():
    cache = TTLCache(max_entries=2)
    cache.set("a", 1, ttl=10)
    cache.set("b", 2, ttl=20)
    cache.set("c", 3, ttl=30)

    assert cache.get("a") is None
    assert cache.get("b") == 2
    assert cache.get("c") == 3
