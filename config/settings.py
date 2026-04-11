"""Application configuration for Marine Bunkering."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "marine-bunkering"
SERVICE_PORT = 8014
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

SEVERE_DELAY_DAYS = 10
MODERATE_DELAY_DAYS = 5
HIGH_ROUTE_RISK = 0.7
