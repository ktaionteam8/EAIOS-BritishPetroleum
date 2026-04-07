# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI Operations System for British Petroleum (EAIOS). Three-layer architecture:

- **frontend/** — React 18 + TypeScript dashboard
- **backend/** — FastAPI (Python) REST API with async SQLAlchemy + Redis cache
- **data-pipelines/** — Apache Airflow DAGs for data ingestion and processing

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, React Router v6 |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2 (async), Alembic |
| Database | PostgreSQL 16 (via asyncpg) |
| Cache | Redis 7 |
| Pipelines | Apache Airflow 2.9 |
| Dev infra | Docker Compose |

## Commands

### Run everything
```bash
docker-compose up
```

### Frontend (port 3000)
```bash
cd frontend
npm install
npm start          # dev server
npm run build      # production build
npm test           # run tests
npm run lint       # ESLint
```

### Backend (port 8000)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload     # dev server
pytest tests/                     # all tests
pytest tests/test_foo.py::test_bar  # single test
```

### Airflow (port 8080)
```bash
cd data-pipelines
pip install -r requirements.txt
airflow db init
airflow webserver &
airflow scheduler
```

## Architecture Notes

- Backend entry point: `backend/src/main.py` — FastAPI app with CORS configured for `localhost:3000`
- DB session: `backend/src/models/database.py` — async sessions via `get_db()` dependency
- Redis client: `backend/src/middleware/cache.py` — singleton via `get_redis()` dependency
- Airflow DAGs live in `data-pipelines/ingestion/` and are mounted into the Airflow container
- All services connect to the same PostgreSQL instance; Airflow uses its own `airflow` database
