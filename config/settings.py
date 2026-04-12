"""Application configuration for Compliance Management."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "compliance-management"
SERVICE_PORT = 8046
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

COVERAGE_GAP_THRESHOLD = 0.8
EVIDENCE_STALE_DAYS = 365
