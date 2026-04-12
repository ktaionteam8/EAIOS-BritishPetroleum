"""Application configuration for Energy Transition Reskilling."""

import os
from dotenv import load_dotenv

load_dotenv()

SERVICE_NAME = "energy-transition-reskilling"
SERVICE_PORT = 8036
VERSION = "1.0.0"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

RESKILL_DEMAND_THRESHOLD = -0.15
TRANSFERABLE_SKILLS_MIN = 0.5
LEARNING_AGILITY_MIN = 0.6
