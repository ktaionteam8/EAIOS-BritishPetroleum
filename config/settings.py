"""Application configuration for Skills Gap Analysis."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "skills-gap-analysis"
SERVICE_PORT = 8032
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

TRAINABLE_THRESHOLD = 0.6
