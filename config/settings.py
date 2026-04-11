"""Application configuration for Aviation Fuel Logistics."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "aviation-fuel-logistics"
SERVICE_PORT = 8013
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

CRITICAL_DAYS_SUPPLY = 2
WARNING_DAYS_SUPPLY = 4
TARGET_DAYS_SUPPLY = 7
HIGH_CONSUMPTION_THRESHOLD = 30000
