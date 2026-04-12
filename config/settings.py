"""Application configuration for Tax Compliance."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "tax-compliance"
SERVICE_PORT = 8054
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

NON_COMPLIANT_RATE_DIFF = 0.03
RISK_RATE_DIFF = 0.005
