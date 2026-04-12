"""Application configuration for Cross-Commodity Arbitrage."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "cross-commodity-arbitrage"
SERVICE_PORT = 8026
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

Z_SCORE_THRESHOLD = 2.0
