"""Application configuration for Financial Close Automation."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "financial-close-automation"
SERVICE_PORT = 8051
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

MATERIALITY_THRESHOLD_USD = 25000
