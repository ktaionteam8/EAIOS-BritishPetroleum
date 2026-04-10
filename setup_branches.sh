#!/bin/bash
set -e

create_branch() {
  local BRANCH="$1"
  local TITLE="$2"
  local DESC="$3"
  local PORT="$4"
  local APP_NAME=$(echo "$BRANCH" | sed 's/05-manufacturing-//')

  echo "========================================="
  echo "Creating branch: $BRANCH"
  echo "========================================="

  git checkout develop
  git checkout -b "$BRANCH"

  mkdir -p src/api src/models src/services src/utils
  mkdir -p tests/unit tests/integration
  mkdir -p config

  # src/api/main.py
  cat > src/api/main.py << PYEOF
"""${TITLE} - API Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EAIOS-BP: ${TITLE}",
    description="${DESC}",
    version="0.1.0",
    docs_url="/api/v1/${APP_NAME}/docs",
    openapi_url="/api/v1/${APP_NAME}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/${APP_NAME}/health")
async def health_check():
    return {"status": "healthy", "service": "${APP_NAME}"}
PYEOF

  touch src/__init__.py src/api/__init__.py src/models/__init__.py src/services/__init__.py src/utils/__init__.py
  touch tests/__init__.py tests/unit/__init__.py tests/integration/__init__.py

  # tests/unit/test_health.py
  cat > tests/unit/test_health.py << PYEOF
"""Unit tests for ${TITLE} health endpoint."""
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/${APP_NAME}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "${APP_NAME}"
PYEOF

  # config/settings.py
  cat > config/settings.py << PYEOF
"""${TITLE} - Configuration Settings"""
import os


class Settings:
    APP_NAME: str = "${TITLE}"
    APP_PORT: int = int(os.getenv("APP_PORT", "${PORT}"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/eaios_bp")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
PYEOF

  # config/logging.yaml
  cat > config/logging.yaml << PYEOF
version: 1
disable_existing_loggers: false
formatters:
  standard:
    format: "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
handlers:
  console:
    class: logging.StreamHandler
    formatter: standard
    level: INFO
root:
  level: INFO
  handlers: [console]
PYEOF

  # requirements.txt
  cat > requirements.txt << PYEOF
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
sqlalchemy[asyncio]>=2.0.0
asyncpg>=0.29.0
redis>=5.0.0
httpx>=0.26.0
pytest>=7.4.0
pytest-asyncio>=0.23.0
python-dotenv>=1.0.0
PYEOF

  # Dockerfile
  cat > Dockerfile << PYEOF
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE ${PORT}

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "${PORT}"]
PYEOF

  # .env.example
  cat > .env.example << PYEOF
APP_PORT=${PORT}
DEBUG=false
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/eaios_bp
REDIS_URL=redis://localhost:6379/0
LOG_LEVEL=INFO
PYEOF

  # README.md
  cat > README.md << PYEOF
# EAIOS-BP: ${TITLE}

> ${DESC}

## Part of EAIOS-BritishPetroleum Manufacturing Domain (05)

### Quick Start

\`\`\`bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port ${PORT}
\`\`\`

### Project Structure

\`\`\`
src/
├── api/            # FastAPI routers and endpoints
├── models/         # ML models and data schemas
├── services/       # Business logic
└── utils/          # Utilities and helpers
tests/
├── unit/           # Unit tests
└── integration/    # Integration tests
config/
├── settings.py     # App configuration
└── logging.yaml    # Logging setup
\`\`\`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/api/v1/${APP_NAME}/health\` | Health check |

### Running Tests

\`\`\`bash
pytest tests/              # all tests
pytest tests/unit/         # unit only
pytest tests/integration/  # integration only
\`\`\`

### Docker

\`\`\`bash
docker build -t eaios-bp-${APP_NAME} .
docker run -p ${PORT}:${PORT} eaios-bp-${APP_NAME}
\`\`\`

### Git Workflow

\`\`\`
feature/* → ${BRANCH} → develop → main
\`\`\`

---

**Port**: ${PORT}
**Communication**: Via API Gateway only (port 8000). No direct cross-service imports.
PYEOF

  git add -A
  git commit -m "Initialize ${TITLE} application scaffold

Set up isolated microservice structure with FastAPI entry point,
config, tests, Dockerfile, and README for the ${APP_NAME} application.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

  echo "Branch $BRANCH created and committed."
}

create_branch "05-manufacturing-predictive-maintenance" "Predictive Maintenance" "ML models for equipment failure prediction using sensor/IoT data" "8001"
create_branch "05-manufacturing-refinery-yield-optimization" "Refinery Yield Optimization" "AI optimization of refinery output, feedstock blending, and process parameters" "8002"
create_branch "05-manufacturing-quality-control-ai" "Quality Control AI" "Computer vision and statistical models for product quality inspection" "8003"
create_branch "05-manufacturing-downtime-prevention" "Downtime Prevention" "Scheduling and anomaly detection to minimize unplanned downtime" "8004"
create_branch "05-manufacturing-energy-efficiency" "Energy Efficiency" "Energy consumption optimization across manufacturing operations" "8005"
create_branch "05-manufacturing-digital-twin" "Digital Twin" "Virtual replicas of physical assets for simulation and monitoring" "8006"

echo ""
echo "All 6 application branches created successfully!"
