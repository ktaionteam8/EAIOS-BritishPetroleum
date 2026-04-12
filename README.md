# 04 — Commercial Trading: Crude Trading Analytics

> **Domain:** Commercial Trading  
> **Application:** crude-trading-analytics  
> **Branch:** `04-commercial-trading-crude-trading-analytics`  
> **Architecture:** Microservice (branch-isolated)

## Description

Analyzes 80 crude oil trading positions across major grades (Brent, WTI, Dubai,
Urals, Bonny Light, Arab Light). Produces BUY / SELL / HOLD recommendations
based on deviation from 20-day moving average, volatility, and volume.

### Agent Role

**CrudeTradingAgent** — Computes price deviation vs 20-day MA and volatility
bands. Issues:
- **BUY** when price is >5% below MA with low volatility
- **SELL** when price is >5% above MA with low volatility
- **HOLD** when volatility is elevated or price is within the neutral band

Each decision includes `confidence`, `expected_pnl`, and `rationale`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 80 records + counts |
| GET | `/api/decision` | Actionable (non-HOLD) decisions only |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8021
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
