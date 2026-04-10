"""Quality Control AI - Configuration Settings"""
import os


class Settings:
    APP_NAME: str = "Quality Control AI"
    APP_PORT: int = int(os.getenv("APP_PORT", "8003"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios_bp")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
