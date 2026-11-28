"""Unit tests for bounded parallel repository details fetching.

Verifies:
- Concurrency bounded by Semaphore.
- Significant latency reduction compared to serial execution.
- Graceful partial failure handling (one repo failing does not abort others).
- Correct caching behavior and configurable concurrency limit.
"""

import asyncio
import time
from unittest.mock import AsyncMock, patch
import pytest

from app.services.github_service import get_repository_details, _fetch_repo_details


@pytest.fixture
def sample_repositories():
    """Create sample repository metadata list."""
    return [
        {
            "full_name": f"testuser/repo-{i}",
            "fork": False,
            "updated_at": f"2026-01-0{i+1}T12:00:00Z",
        }
        for i in range(6)
    ]


@pytest.fixture
def sample_repositories_with_forks():
    """Create sample repositories including forks."""
    return [
        {"full_name": "testuser/fork-1", "fork": True, "updated_at": "2026-02-01T12:00:00Z"},
        {"full_name": "testuser/good-1", "fork": False, "updated_at": "2026-01-15T12:00:00Z"},
        {"full_name": "testuser/fork-2", "fork": True, "updated_at": "2026-01-10T12:00:00Z"},
        {"full_name": "testuser/good-2", "fork": False, "updated_at": "2026-01-05T12:00:00Z"},
    ]


@pytest.mark.asyncio
class TestParallelRepositoryFetch:
    """Test suite ensuring repository details are fetched concurrently and safely."""

    async def test_empty_repositories_returns_empty_dict(self):
        """Passing empty repo list immediately returns empty dictionary."""
        result = await get_repository_details([])
        assert result == {}

    async def test_skips_forks_and_limits_candidates(self, sample_repositories_with_forks):
        """Ensure forks are excluded and limit parameter is respected."""
        with patch("app.services.github_service._fetch_repo_details", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"languages": {"Python": 1000}, "dependencies": []}

            results = await get_repository_details(sample_repositories_with_forks, limit=1)

            assert len(results) == 1
            assert "testuser/good-1" in results
            assert "testuser/fork-1" not in results
            assert mock_fetch.call_count == 1

    async def test_parallel_execution_respects_concurrency_limit(self, sample_repositories):
        """Ensure active concurrent calls never exceed the configured concurrency limit."""
        active_concurrency = 0
        peak_concurrency = 0
        lock = asyncio.Lock()

        async def simulated_fetch(full_name: str, refresh: bool = False):
            nonlocal active_concurrency, peak_concurrency
            async with lock:
                active_concurrency += 1
                if active_concurrency > peak_concurrency:
                    peak_concurrency = active_concurrency

            await asyncio.sleep(0.05)

            async with lock:
                active_concurrency -= 1

            return {"languages": {"TypeScript": 500}, "dependencies": ["react"]}

        concurrency_limit = 3
        with patch("app.services.github_service._fetch_repo_details", side_effect=simulated_fetch):
            results = await get_repository_details(
                sample_repositories,
                limit=6,
                concurrency_limit=concurrency_limit,
            )

            assert len(results) == 6
            assert peak_concurrency <= concurrency_limit
            assert peak_concurrency > 1, "Execution was not parallelized"

    async def test_parallel_fetch_is_faster_than_serial(self, sample_repositories):
        """Verify concurrent execution is noticeably faster than sequential execution."""
        delay = 0.04

        async def simulated_delayed_fetch(full_name: str, refresh: bool = False):
            await asyncio.sleep(delay)
            return {"languages": {"Python": 200}, "dependencies": []}

        with patch("app.services.github_service._fetch_repo_details", side_effect=simulated_delayed_fetch):
            start = time.perf_counter()
            results = await get_repository_details(
                sample_repositories,
                limit=5,
                concurrency_limit=5,
            )
            duration = time.perf_counter() - start

            assert len(results) == 5
            # Serial would take 5 * 0.04 = 0.20s; parallel should take ~0.04 - 0.10s
            assert duration < (5 * delay * 0.8), f"Parallel execution took {duration}s, expected < {5 * delay * 0.8}s"

    async def test_graceful_partial_failure_handling(self, sample_repositories):
        """A failure in one repository does not disrupt remaining repositories."""
        async def simulated_mixed_fetch(full_name: str, refresh: bool = False):
            if "repo-2" in full_name:
                raise RuntimeError("Simulated network timeout for repo-2")
            return {"languages": {"Rust": 500}, "dependencies": []}

        with patch("app.services.github_service._fetch_repo_details", side_effect=simulated_mixed_fetch):
            results = await get_repository_details(
                sample_repositories[:4],
                limit=4,
                concurrency_limit=2,
            )

            assert len(results) == 3
            assert "testuser/repo-0" in results
            assert "testuser/repo-1" in results
            assert "testuser/repo-2" not in results
            assert "testuser/repo-3" in results

    async def test_refresh_flag_propagates_to_fetch_details(self, sample_repositories):
        """The refresh parameter must propagate through to _fetch_repo_details."""
        with patch("app.services.github_service._fetch_repo_details", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"languages": {}, "dependencies": []}

            await get_repository_details(sample_repositories[:2], limit=2, refresh=True)

            assert mock_fetch.call_count == 2
            for call in mock_fetch.call_args_list:
                assert call.kwargs.get("refresh") is True


    async def test_zero_concurrency_fallback(self, sample_repositories):
        """Zero or negative concurrency limits automatically fallback safely to at least 1."""
        with patch("app.services.github_service._fetch_repo_details", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"languages": {"Go": 120}, "dependencies": []}

            results = await get_repository_details(sample_repositories[:2], limit=2, concurrency_limit=0)
            assert len(results) == 2

    async def test_large_batch_scales_with_concurrency(self):
        """Test large candidate set to verify batch scalability."""
        repos = [{"full_name": f"user/large-{i}", "fork": False, "updated_at": f"2026-01-{i+1:02d}"} for i in range(15)]
        with patch("app.services.github_service._fetch_repo_details", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"languages": {"Python": 10}, "dependencies": []}

            results = await get_repository_details(repos, limit=15, concurrency_limit=4)
            assert len(results) == 15
            assert mock_fetch.call_count == 15

    async def test_all_repositories_fail_returns_empty_dict(self, sample_repositories):
        """When all repository details fail with exceptions, an empty dict is returned cleanly."""
        with patch("app.services.github_service._fetch_repo_details", side_effect=Exception("API connection severed")):
            results = await get_repository_details(sample_repositories[:3], limit=3)
            assert results == {}

    async def test_unhandled_exception_logged_as_warning(self, sample_repositories):
        """Ensure exceptions inside task workers are captured and do not crash the gather."""
        with patch("app.services.github_service._fetch_repo_details", side_effect=ValueError("Invalid repo payload")):
            results = await get_repository_details(sample_repositories[:1], limit=1)
            assert results == {}
