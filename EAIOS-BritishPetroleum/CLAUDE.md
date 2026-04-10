# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EAIOS-BritishPetroleum** — Enterprise AI Operations System for British Petroleum.
An enterprise-grade platform with isolated microservice applications per manufacturing domain.

## Repository Architecture

### Branch Strategy

```
main (production — protected, deploy-ready)
│
└── develop (integration — all features merge here first)
    │
    ├── 05-manufacturing-predictive-maintenance
    ├── 05-manufacturing-refinery-yield-optimization
    ├── 05-manufacturing-quality-control-ai
    ├── 05-manufacturing-downtime-prevention
    ├── 05-manufacturing-energy-efficiency
    └── 05-manufacturing-digital-twin
```

### Git Workflow

```
feature/* → application branch → develop → main
```

1. **feature branches**: Created from an application branch (e.g., `feature/sensor-api` from `05-manufacturing-predictive-maintenance`)
2. **application branches**: Isolated per application. PRs merge into `develop` after review.
3. **develop**: Integration branch. All application branches merge here via PR.
4. **main**: Production branch. Only `develop` merges into `main` via release PR.

### Application Branch Naming Convention

```
05-manufacturing-<application-name>
```

Prefix `05` = Manufacturing domain code in the EAIOS numbering scheme.

## Application Branches

| Branch | Purpose |
|---|---|
| `05-manufacturing-predictive-maintenance` | ML models for equipment failure prediction using sensor/IoT data |
| `05-manufacturing-refinery-yield-optimization` | AI optimization of refinery output, feedstock blending, and process parameters |
| `05-manufacturing-quality-control-ai` | Computer vision and statistical models for product quality inspection |
| `05-manufacturing-downtime-prevention` | Scheduling and anomaly detection to minimize unplanned downtime |
| `05-manufacturing-energy-efficiency` | Energy consumption optimization across manufacturing operations |
| `05-manufacturing-digital-twin` | Virtual replicas of physical assets for simulation and monitoring |

## Per-Branch Folder Structure

Each application branch contains:

```
src/                    # Application source code
├── api/                # REST API endpoints (FastAPI routers)
├── models/             # ML models and data models
├── services/           # Business logic layer
└── utils/              # Shared utilities
tests/                  # Unit and integration tests
├── unit/
└── integration/
config/                 # Configuration files
├── settings.py         # App settings (env-based)
└── logging.yaml        # Logging configuration
README.md               # Application-specific documentation
requirements.txt        # Python dependencies
Dockerfile              # Container build
.env.example            # Environment variable template
```

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2 (async), Alembic |
| ML/AI | scikit-learn, TensorFlow/PyTorch, pandas, NumPy |
| Database | PostgreSQL 16 (via asyncpg) |
| Cache | Redis 7 |
| Message Queue | Apache Kafka (inter-service communication) |
| Orchestration | Apache Airflow 2.9 |
| Containers | Docker, Docker Compose, Kubernetes |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus, Grafana |

## Communication Between Applications

- **Applications are fully isolated** — no cross-imports or shared code between branches.
- **Inter-service communication** happens exclusively via the **API Gateway**.
- Each application exposes REST endpoints under `/api/v1/<app-name>/`.
- Shared data flows through Kafka topics or the central PostgreSQL database.

## Commands (Per Application Branch)

### Development
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port <PORT>
```

### Testing
```bash
pytest tests/                          # all tests
pytest tests/unit/                     # unit tests only
pytest tests/integration/              # integration tests only
pytest tests/test_foo.py::test_bar     # single test
```

### Docker
```bash
docker build -t eaios-bp-<app-name> .
docker run -p <PORT>:<PORT> eaios-bp-<app-name>
```

## Port Assignments

| Application | Port |
|---|---|
| predictive-maintenance | 8001 |
| refinery-yield-optimization | 8002 |
| quality-control-ai | 8003 |
| downtime-prevention | 8004 |
| energy-efficiency | 8005 |
| digital-twin | 8006 |
| API Gateway | 8000 |

## Architecture Rules

1. **No cross-code**: Each application branch is self-contained. Never import from another application.
2. **API-first**: All inter-service communication goes through the API gateway.
3. **Branch isolation**: Never merge one application branch into another application branch.
4. **Feature workflow**: `feature/* → app-branch → develop → main`.
5. **Config-driven**: Use environment variables and config files, never hardcode secrets or URLs.
