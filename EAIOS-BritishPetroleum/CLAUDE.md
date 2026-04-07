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

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting work
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what is necessary. Avoid introducing bugs.
