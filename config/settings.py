"""Application configuration for OT Security Monitoring."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "ot-security-monitoring"
SERVICE_PORT = 8043
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

CRITICAL_RISK_THRESHOLD = 0.6
WARNING_RISK_THRESHOLD = 0.3
