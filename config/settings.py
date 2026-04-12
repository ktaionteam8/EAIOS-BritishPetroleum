"""Application configuration for Safety Incident Prediction."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "safety-incident-prediction"
SERVICE_PORT = 8034
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

HAZARD_HIGH = 0.7
NEAR_MISS_CRITICAL = 5
TRAINING_OVERDUE_DAYS = 365
EQUIPMENT_AGE_WARNING = 15
