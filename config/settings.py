"""Application configuration for Revenue Analytics."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "revenue-analytics"
SERVICE_PORT = 8056
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

GROWTH_THRESHOLD = 0.05
DECLINE_THRESHOLD = -0.03
