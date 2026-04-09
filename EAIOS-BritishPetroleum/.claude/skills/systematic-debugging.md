# Systematic Debugging

Find the root cause before attempting any fix. Symptom fixes are failure.

## The Four Mandatory Phases

### Phase 1 — Root Cause Investigation
- Read the full error message and stack trace — all of it
- Reproduce the issue consistently before touching any code
- Review recent changes (git log, git diff) — what changed?
- Add instrumentation at system boundaries to locate where failure occurs
- For multi-component systems (frontend → API → DB → Redis): trace each boundary

### Phase 2 — Pattern Analysis
- Find similar working code in the codebase
- Compare the broken implementation to the working one completely
- List every difference — not just the obvious ones
- Do not skip this step because the issue "seems simple"

### Phase 3 — Hypothesis and Testing
- Form one specific hypothesis: "The bug is X because Y"
- Test it with the minimal possible change
- If hypothesis is wrong, form a new one — do not keep patching
- Stay open to being wrong about the root cause

### Phase 4 — Fix and Verify
- Write a failing test that reproduces the bug (TDD applies here too)
- Implement a focused fix that addresses the root cause only
- Run the test — it must now pass
- Run the full test suite — nothing else must break
- **Three consecutive failed fixes = stop and discuss architecture**

## Red Flags — Stop and Restart the Process

If you catch yourself doing any of these, stop immediately and go back to Phase 1:

- Proposing a solution before you've traced the full data flow
- Attempting multiple simultaneous fixes
- Skipping investigation because the issue "seems simple"
- Saying "let's just try X and see"
- Adding `print()` / `console.log` without a clear hypothesis

## For This Project

### Backend debugging
```bash
# Check FastAPI logs
docker-compose logs backend -f

# Run with debug output
uvicorn src.main:app --reload --log-level debug

# Reproduce with curl
curl -v http://localhost:8000/health

# Check DB connection
docker-compose exec backend python -c "from src.models.database import engine; print(engine)"

# Check Redis
docker-compose exec redis redis-cli ping
```

### Frontend debugging
```bash
# Check browser console errors (open DevTools)
# React DevTools: inspect component state and props
# Network tab: check API request/response shapes
```

### Airflow debugging
```bash
# Check task logs
docker-compose logs airflow -f

# List DAGs and check for import errors
docker-compose exec airflow airflow dags list

# Test a task manually
docker-compose exec airflow airflow tasks test bp_data_ingestion ingest_data 2024-01-01
```

## The Core Truth

Systematic debugging is **faster** than guess-and-check thrashing. Every minute spent investigating saves five minutes of random patching. Do not let time pressure skip Phase 1.
