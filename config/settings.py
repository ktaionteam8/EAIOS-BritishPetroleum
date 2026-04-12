"""Application configuration for Contractor Management."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "contractor-management"
SERVICE_PORT = 8035
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

COMPLIANCE_MIN = 0.7
INCIDENT_LIMIT = 3
EFFICIENCY_MIN = 0.6
COST_VARIANCE_MAX = 0.15
