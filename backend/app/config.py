from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    # Optional. Raises the GitHub rate limit from 60 to 5000 requests/hour.
    github_token: str | None = None

    # How long (in seconds) GitHub profile and repository responses are
    # cached in memory. Set to 0 to turn caching off.
    github_cache_ttl: int = 300


@lru_cache
def get_settings() -> Settings:
    return Settings()
