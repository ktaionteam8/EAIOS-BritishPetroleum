"""Application configuration for Treasury Management."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "treasury-management"
SERVICE_PORT = 8055
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

LCR_ALERT = 1.0
LCR_INVEST = 1.8
