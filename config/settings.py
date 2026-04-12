"""Application configuration for Aviation Fuel Forecasting."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "aviation-fuel-forecasting"
SERVICE_PORT = 8024
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

FORECAST_HORIZON_DAYS = 30
