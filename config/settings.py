"""Application configuration for Demand-Supply Matching."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "demand-supply-matching"
SERVICE_PORT = 8011
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

CRUDE_COST_THRESHOLD = 100
CRUDE_DELAY_THRESHOLD = 60
CRUDE_MIN_VOLUME = 200_000
REFINERY_OVER_UTIL = 0.95
REFINERY_UNDER_UTIL = 0.40
