"""Application configuration for Carbon Credit Trading."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "carbon-credit-trading"
SERVICE_PORT = 8022
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

BUY_GAP_THRESHOLD = 0.08
SELL_GAP_THRESHOLD = -0.08
