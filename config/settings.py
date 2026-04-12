"""Application configuration for Threat Detection."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "threat-detection"
SERVICE_PORT = 8042
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

THREAT_SCORE_THRESHOLD = 0.7
IOC_THRESHOLD = 3
