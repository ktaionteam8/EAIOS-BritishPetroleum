# 02 — HR & Safety: Safety Incident Prediction

> **Domain:** Human Resources & Safety  
> **Application:** safety-incident-prediction  
> **Branch:** `02-human-resources-safety-incident-prediction`  
> **Architecture:** Microservice (branch-isolated)  
> **Classification:** SAFETY-CRITICAL

## Description

Predicts safety incident risk across 90 BP sites (offshore platforms,
refineries, pipelines, LNG terminals, drilling rigs, etc.) by combining
hazard scores, 90-day near-miss rates, training recency, and equipment age.

### Agent Role

**SafetyAgent** — Composite risk model triggering:
- **ALERT** (risk ≥ 0.6) — IMMEDIATE priority, intervention required
- **MONITOR** (0.3 ≤ risk < 0.6) — HIGH priority, close observation
- **NORMAL** (risk < 0.3) — routine ops

Contributing factors: hazard score, near-miss count, training lapses,
aging equipment.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 90 sites |
| GET | `/api/decision` | ALERT + MONITOR sites only |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8034
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
