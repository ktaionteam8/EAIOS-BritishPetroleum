"""Application configuration for Castrol Distribution."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "castrol-distribution"
SERVICE_PORT = 8012
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

SHORTAGE_RATIO = 0.5
OVERSTOCK_RATIO = 3.5
