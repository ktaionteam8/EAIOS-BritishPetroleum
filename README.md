# EAIOS-BP: Quality Control AI

> Computer vision and statistical models for product quality inspection

## Part of EAIOS-BritishPetroleum Manufacturing Domain (05)

### Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8003
```

### Project Structure

```
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
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/quality-control-ai/health` | Health check |

### Running Tests

```bash
pytest tests/              # all tests
pytest tests/unit/         # unit only
pytest tests/integration/  # integration only
```

### Docker

```bash
docker build -t eaios-bp-quality-control-ai .
docker run -p 8003:8003 eaios-bp-quality-control-ai
```

### Git Workflow

```
feature/* → 05-manufacturing-quality-control-ai → develop → main
```

---

**Port**: 8003
**Communication**: Via API Gateway only (port 8000). No direct cross-service imports.

## Architecture Role

This application is part of the Manufacturing Domain in EAIOS.

- Type: Microservice (Branch-Isolated)
- Communication: API Gateway only
- Owned Data: Yes
- Deployment: Independent container

## AI Component

- Worker Agent: Handles domain-specific decisions
- Integrated with Master Agent for orchestration
