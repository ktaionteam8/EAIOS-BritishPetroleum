import logging

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Database — Supabase cloud PostgreSQL.
    # Falls back to SQLite for local dev / when DATABASE_URL is not set (e.g. Render
    # free tier first deploy).  Auth and health endpoints work without a database.
    database_url: str = "sqlite+aiosqlite:///./eaios_dev.db"

    # Redis — Upstash (production) or local Redis (dev)
    # Production: set REDIS_URL=rediss://<user>:<pass>@<host>:6380
    redis_url: str = "redis://localhost:6379"

    # App — SECRET_KEY is required; Render auto-generates it via render.yaml
    secret_key: str
    environment: str = "production"

    # CORS — set FRONTEND_URL to your Vercel deployment URL.
    # ALLOWED_ORIGINS overrides FRONTEND_URL when multiple origins are needed
    # (comma-separated, e.g. "https://eaios-bp.vercel.app,http://localhost:3000").
    frontend_url: str = "http://localhost:3000"
    allowed_origins: str = ""

    # Auth users — JSON mapping of username → bcrypt hash.
    # Generate: python -c "import bcrypt; print(bcrypt.hashpw(b'pw', bcrypt.gensalt()).decode())"
    # Example: AUTH_USERS='{"admin": "$2b$12$..."}'
    auth_users: str = "{}"

    @model_validator(mode="after")
    def _derive_cors_and_warn_sqlite(self) -> "Settings":
        """Derive CORS origins; warn loudly if production is using the SQLite fallback."""
        if not self.allowed_origins:
            self.allowed_origins = self.frontend_url
        if self.environment == "production" and "localhost" in self.allowed_origins:
            logger.warning(
                "CORS allowed_origins contains 'localhost' in production — "
                "set FRONTEND_URL to your production domain."
            )
        # Fail loudly in Render logs if DATABASE_URL was never set
        if self.environment == "production" and self.database_url.startswith("sqlite"):
            logger.error(
                "DATABASE_URL is not set — production is using the SQLite fallback. "
                "Auth and /health endpoints will work, but all database-backed endpoints "
                "will fail.  Set DATABASE_URL in the Render dashboard immediately."
            )
        return self

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
