"""Application configuration for Infrastructure Monitoring."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "infrastructure-monitoring"
SERVICE_PORT = 8045
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

SCALE_UP_CPU = 85
SCALE_DOWN_CPU = 30
ERROR_SLO = 0.05
LATENCY_SLO_MS = 1000
