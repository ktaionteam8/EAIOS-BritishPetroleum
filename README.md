# 04 — Commercial Trading: Carbon Credit Trading

> **Domain:** Commercial Trading  
> **Application:** carbon-credit-trading  
> **Branch:** `04-commercial-trading-carbon-credit-trading`  
> **Architecture:** Microservice (branch-isolated)

## Description

Analyzes 60 carbon credit positions across major compliance and voluntary
schemes (EU-ETS EUA, California CCA, UK-ETS, VCM-Gold Standard, VCM-Verra).
Issues BUY / SELL / HOLD recommendations based on price vs fair value,
demand index, and regulatory policy tightening.

### Agent Role

**CarbonCreditAgent** — Computes price gap vs fair value and combines with
demand and policy signals:
- **BUY** when >8% undervalued with strong demand
- **SELL** when >8% overvalued with weak demand
- **HOLD** otherwise

Produces `target_price` adjusted for policy tightness.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 60 records + counts |
| GET | `/api/decision` | Actionable decisions only |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8022
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
