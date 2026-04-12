"""Application configuration for LNG Trading Platform."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "lng-trading-platform"
SERVICE_PORT = 8025
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

MIN_ARBITRAGE_MARGIN = 0.50
