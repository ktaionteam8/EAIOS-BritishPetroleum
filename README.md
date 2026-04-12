# 02 — HR & Safety: Workforce Planning

> **Domain:** Human Resources & Safety  
> **Application:** workforce-planning  
> **Branch:** `02-human-resources-workforce-planning`  
> **Architecture:** Microservice (branch-isolated)

## Description

Hiring demand prediction across 60 business units. Compares current
workload (FTE) and project pipeline against headcount to recommend
HIRE / MAINTAIN / REDEPLOY actions with exact hires-needed counts.

### Agent Role

**WorkforceAgent**:
- **HIRE** when utilization > 105% and projected gap > 0
- **REDEPLOY** when utilization < 75% and surplus capacity exists
- **MAINTAIN** otherwise

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 60 units |
| GET | `/api/decision` | Actionable (non-MAINTAIN) decisions |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8031
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
