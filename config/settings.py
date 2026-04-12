"""Application configuration for Talent Analytics."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "talent-analytics"
SERVICE_PORT = 8033
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

TOP_PERFORMER_THRESHOLD = 4.4
LOW_PERFORMER_THRESHOLD = 2.8
HIGH_ATTRITION_THRESHOLD = 0.6
