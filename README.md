# 04 — Commercial Trading: LNG Trading Platform

> **Domain:** Commercial Trading  
> **Application:** lng-trading-platform  
> **Branch:** `04-commercial-trading-lng-trading-platform`  
> **Architecture:** Microservice (branch-isolated)

## Description

Evaluates 40 LNG cargoes for cross-hub arbitrage between TTF (Europe) and
JKM (Asia) benchmarks. Identifies the optimal destination route after
accounting for shipping cost and computes expected PnL.

### Agent Role

**LNGTradingAgent** — For each cargo:
- **BUY** and route to whichever hub (TTF/JKM) yields the highest margin
  after shipping, when margin exceeds $0.50/MMBtu
- **SELL** at origin when spot exceeds both destination hubs
- **HOLD** when no destination is profitable

Returns `best_route`, `arbitrage_margin`, and `expected_pnl`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 40 cargoes + counts + total PnL |
| GET | `/api/decision` | Actionable trades only |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8025
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
