"""Application configuration for Cost Forecasting."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "cost-forecasting"
SERVICE_PORT = 8053
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

OVERRUN_THRESHOLD = 0.08
UNDERRUN_THRESHOLD = -0.08
