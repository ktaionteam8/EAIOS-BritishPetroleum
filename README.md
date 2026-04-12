# 04 — Commercial Trading: Castrol Pricing Engine

> **Domain:** Commercial Trading  
> **Application:** castrol-pricing-engine  
> **Branch:** `04-commercial-trading-castrol-pricing-engine`  
> **Architecture:** Microservice (branch-isolated)

## Description

Dynamic pricing engine for 70 Castrol SKU/region combinations. Recommends
PRICE_UP, PRICE_DOWN, or HOLD actions by balancing target margin (28%)
against competitor pricing and demand elasticity.

### Agent Role

**CastrolPricingAgent** — For each SKU/region:
- **PRICE_UP** when margin is below target AND price is competitive
- **PRICE_DOWN** when margin is well above target AND demand is elastic,
  or when priced >10% above competitor
- **HOLD** otherwise

Returns `recommended_price`, `delta`, and projected `margin_impact`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 70 records + counts |
| GET | `/api/decision` | Actionable pricing changes only |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8023
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
