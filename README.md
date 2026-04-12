# 01 — Finance: JV Accounting

> **Domain:** Finance & Accounting  
> **Application:** jv-accounting  
> **Branch:** `01-finance-jv-accounting`  
> **Architecture:** Microservice (branch-isolated)

## Description

Reconciles 80 joint venture partner-share transactions across major BP
JVs (ACG, Tangguh LNG, Shah Deniz, Clair Ridge, Atlantis, Thunder Horse,
Rumaila). Compares expected BP share against partner-reported figures.

### Agent Role

**JVAccountingAgent**:
- **MISMATCH** when variance > $50k AND > 5% of expected share
- **REVIEW** when variance exceeds 1% tolerance
- **BALANCED** otherwise

Standard output: `{decision, confidence, reason, variance, variance_pct}`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full JV reconciliation |
| GET | `/api/decision` | JVs requiring partner review |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8052
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
