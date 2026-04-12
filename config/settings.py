"""Application configuration for Crude Trading Analytics."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "crude-trading-analytics"
SERVICE_PORT = 8021
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

BUY_THRESHOLD = -0.05
SELL_THRESHOLD = 0.05
HIGH_VOLATILITY = 0.4
