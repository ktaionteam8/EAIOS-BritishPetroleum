# EAIOS-BP: Predictive Maintenance

> ML models for equipment failure prediction using sensor/IoT data

## Part of EAIOS-BritishPetroleum Manufacturing Domain (05)

### Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8001
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
| GET | `/api/v1/predictive-maintenance/health` | Health check |

### Running Tests

```bash
pytest tests/              # all tests
pytest tests/unit/         # unit only
pytest tests/integration/  # integration only
```

### Docker

```bash
docker build -t eaios-bp-predictive-maintenance .
docker run -p 8001:8001 eaios-bp-predictive-maintenance
```

### Git Workflow

```
feature/* → 05-manufacturing-predictive-maintenance → develop → main
```

---

**Port**: 8001
**Communication**: Via API Gateway only (port 8000). No direct cross-service imports.
