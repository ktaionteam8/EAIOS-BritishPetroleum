"""Application configuration for Retail Fuel Optimization."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "retail-fuel-optimization"
SERVICE_PORT = 8015
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

STOCKOUT_COVERAGE_THRESHOLD = 0.5
DEMAND_SPIKE_THRESHOLD = 20000
