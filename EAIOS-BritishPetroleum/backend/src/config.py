from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database — Supabase cloud PostgreSQL
    database_url: str

    # Redis — local
    redis_url: str = "redis://localhost:6379"

    # App — SECRET_KEY has no default; app fails at startup if not set in .env
    secret_key: str
    environment: str = "development"

    # CORS
    frontend_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
