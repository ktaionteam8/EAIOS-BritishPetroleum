# 04 — Commercial Trading: Cross-Commodity Arbitrage

> **Domain:** Commercial Trading  
> **Application:** cross-commodity-arbitrage  
> **Branch:** `04-commercial-trading-cross-commodity-arbitrage`  
> **Architecture:** Microservice (branch-isolated)

## Description

Scans 100 cross-commodity pairs (Brent/Diesel, WTI/Brent, Gasoil/Diesel,
LNG-JKM/LNG-TTF, Naphtha/Gasoline, etc.) for statistically significant
spread dislocations that exceed transaction costs.

### Agent Role

**ArbitrageAgent** — For each pair:
- Computes z-score of observed spread vs historical mean
- **DETECTED** when |z| ≥ 2.0 AND net margin (abs deviation − transaction cost) > 0
- Direction: `LONG_A_SHORT_B` (spread too wide) or `SHORT_A_LONG_B` (too tight)
- **NONE** otherwise

Returns leg_a, leg_b, z_score, net_margin, direction, and confidence.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full scan of all 100 pairs + counts |
| GET | `/api/decision` | Only detected arbitrage opportunities |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8026
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
