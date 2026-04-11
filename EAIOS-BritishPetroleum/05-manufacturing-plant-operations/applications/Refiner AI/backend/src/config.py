"""
Refiner AI — Application Configuration
Reads from .env via pydantic-settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6380"
    secret_key: str  # Required — no default. App fails at startup if not set in .env.
    environment: str = "development"
    frontend_url: str = "http://localhost:3001"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
