# 02 — HR & Safety: Contractor Management

> **Domain:** Human Resources & Safety  
> **Application:** contractor-management  
> **Branch:** `02-human-resources-contractor-management`  
> **Architecture:** Microservice (branch-isolated)

## Description

Evaluates 75 contractor engagements (drilling, well intervention, EPC,
turnaround maintenance, pipeline construction, HSE audit, IT services)
on efficiency, safety compliance, cost variance, and incident history.

### Agent Role

**ContractorAgent**:
- **REPLACE** when compliance < 0.7 OR ≥ 3 safety incidents (12m)
- **REVIEW** when efficiency < 0.6 OR cost variance > 15%
- **RETAIN** when composite score ≥ 0.85 (strong performer)
- **MAINTAIN** for acceptable performance

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 75 contractors |
| GET | `/api/decision` | Only REVIEW/REPLACE actions requiring intervention |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8035
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
