"""Application configuration for Workforce Planning."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "workforce-planning"
SERVICE_PORT = 8031
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

HIRE_UTIL_THRESHOLD = 1.05
REDEPLOY_UTIL_THRESHOLD = 0.75
