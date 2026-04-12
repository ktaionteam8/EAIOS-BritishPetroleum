# 01 — Finance: Financial Close Automation

> **Domain:** Finance & Accounting  
> **Application:** financial-close-automation  
> **Branch:** `01-finance-financial-close-automation`  
> **Architecture:** Microservice (branch-isolated)

## Description

Automates month-end close readiness assessment across 70 BP business
units. Evaluates reconciliation percentage, pending entries,
unreconciled amounts, and audit flags against materiality thresholds.

### Agent Role

**FinancialCloseAgent**:
- **ISSUE** when audit flag raised or unreconciled > 5x materiality ($125k)
- **PENDING** when reconciliation < 95%, > 5 pending entries, or unreconciled > materiality
- **CLOSE_READY** otherwise

Standard output: `{decision, confidence, reason, ...}`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full close assessment |
| GET | `/api/decision` | Books requiring attention |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8051
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
