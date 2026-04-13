# 04 — Commercial & Trading

**Domain:** Commercial & Trading
**System:** EAIOS-BritishPetroleum

## Overview

AI agents for crude oil trading analytics, carbon credit market operations,
Castrol lubricant pricing, aviation fuel demand forecasting, LNG cross-hub
arbitrage, and cross-commodity spread detection. Produces BUY / SELL / HOLD
recommendations with confidence scores and expected PnL.

## Agents

| # | Agent | Port | Purpose |
|---|-------|------|---------|
| 1 | `crude-trading-analytics-agent`    | 8021 | BUY / SELL / HOLD — price vs 20-day MA + volatility |
| 2 | `carbon-credit-trading-agent`      | 8022 | EU-ETS / CCA / VCM position analysis + policy drift |
| 3 | `castrol-pricing-engine-agent`     | 8023 | PRICE_UP / PRICE_DOWN / HOLD — margin × elasticity |
| 4 | `aviation-fuel-forecasting-agent`  | 8024 | 30-day jet fuel demand forecast + trend + confidence interval |
| 5 | `lng-trading-platform-agent`       | 8025 | TTF vs JKM arbitrage minus shipping cost |
| 6 | `cross-commodity-arbitrage-agent`  | 8026 | Z-score spread detection across commodity pairs |

## Domain Structure

```
04-commercial-trading/
├── agents/            6 AI agents (each with src/, tests/, config/)
├── applications/      Web/UI applications for this domain
├── services/          Shared microservices
└── models/            Shared data models and schemas
```

## Branch Map

- `04-commercial-trading-crude-trading-analytics`
- `04-commercial-trading-carbon-credit-trading`
- `04-commercial-trading-castrol-pricing-engine`
- `04-commercial-trading-aviation-fuel-forecasting`
- `04-commercial-trading-lng-trading-platform`
- `04-commercial-trading-cross-commodity-arbitrage`

## Tech Stack

- Python 3.12 · FastAPI 0.111 · Pydantic v2 · pandas · numpy · pytest · Docker

## Quick Start (per agent)

```bash
git checkout 04-commercial-trading-crude-trading-analytics
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8021
pytest tests/ -v
```

## Standard API Contract

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/api/run` | All positions + counts + total expected PnL |
| GET | `/api/decision` | Actionable (non-HOLD) decisions |

## Platform Integration

- Trading signals from the Crude and LNG agents combine with the Finance
  domain's Treasury decision in the Master Agent. When
  **`BUY` + `INVEST`** align → enterprise `EXECUTE_TRADE` decision.
- Arbitrage opportunities surface in real-time on the dashboard's
  activity feed and notification bell.

## Operating Team

- **Domain Owner:** Trading Manager (`trading@eaios.com`)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
