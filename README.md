# 01 — Finance: Treasury Management

> **Domain:** Finance & Accounting  
> **Application:** treasury-management  
> **Branch:** `01-finance-treasury-management`  
> **Architecture:** Microservice (branch-isolated)

## Description

Monitors 50 treasury accounts across BP entities and currencies. Uses
liquidity coverage ratio (LCR = cash + 30d inflow / 30d obligations)
and FX exposure to guide treasury decisions.

### Agent Role

**TreasuryAgent**:
- **ALERT** when LCR < 1.0 or projected cash < 0 (shortfall risk)
- **INVEST** when LCR ≥ 1.8 and FX exposure < 25% (deploy surplus)
- **HOLD** otherwise

Standard output: `{decision, confidence, reason, suggested_action}`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full treasury scan |
| GET | `/api/decision` | Accounts requiring action |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8055
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
