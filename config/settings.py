"""Application configuration for Shadow IT Rationalization."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "shadow-it-rationalization"
SERVICE_PORT = 8044
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

BLOCK_COMPLIANCE_RISK = 0.7
BLOCK_DATA_SENSITIVITY = 0.8
SANCTION_USER_THRESHOLD = 50
