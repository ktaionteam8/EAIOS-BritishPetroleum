# EAIOS-BP: Energy Efficiency

> Energy consumption optimization across manufacturing operations

## Part of EAIOS-BritishPetroleum Manufacturing Domain (05)

### Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8005
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
| GET | `/api/v1/energy-efficiency/health` | Health check |

### Running Tests

```bash
pytest tests/              # all tests
pytest tests/unit/         # unit only
pytest tests/integration/  # integration only
```

### Docker

```bash
docker build -t eaios-bp-energy-efficiency .
docker run -p 8005:8005 eaios-bp-energy-efficiency
```

### Git Workflow

```
feature/* → 05-manufacturing-energy-efficiency → develop → main
```

---

**Port**: 8005
**Communication**: Via API Gateway only (port 8000). No direct cross-service imports.
