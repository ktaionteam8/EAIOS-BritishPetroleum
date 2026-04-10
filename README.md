# EAIOS-BP: Refinery Yield Optimization

> AI optimization of refinery output, feedstock blending, and process parameters

## Part of EAIOS-BritishPetroleum Manufacturing Domain (05)

### Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8002
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
| GET | `/api/v1/refinery-yield-optimization/health` | Health check |

### Running Tests

```bash
pytest tests/              # all tests
pytest tests/unit/         # unit only
pytest tests/integration/  # integration only
```

### Docker

```bash
docker build -t eaios-bp-refinery-yield-optimization .
docker run -p 8002:8002 eaios-bp-refinery-yield-optimization
```

### Git Workflow

```
feature/* → 05-manufacturing-refinery-yield-optimization → develop → main
```

---

**Port**: 8002
**Communication**: Via API Gateway only (port 8000). No direct cross-service imports.
