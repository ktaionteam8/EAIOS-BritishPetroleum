"""Application configuration for Castrol Pricing Engine."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "castrol-pricing-engine"
SERVICE_PORT = 8023
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

TARGET_MARGIN = 0.28
