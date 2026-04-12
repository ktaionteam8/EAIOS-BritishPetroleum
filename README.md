# 04 — Commercial Trading: Aviation Fuel Forecasting

> **Domain:** Commercial Trading  
> **Application:** aviation-fuel-forecasting  
> **Branch:** `04-commercial-trading-aviation-fuel-forecasting`  
> **Architecture:** Microservice (branch-isolated)

## Description

30-day jet fuel demand forecasting across 50 airport-route combinations.
Combines historical demand, trend, and seasonality into a volume forecast
with a confidence interval for each route.

### Agent Role

**AviationForecastAgent** — Produces:
- `forecast_volume_bbl` (30-day projected volume)
- `trend`: INCREASING / DECREASING / STABLE
- `confidence_interval` (lower/upper bounds)
- `confidence` score based on historical volatility

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 50 forecasts + trend counts |
| GET | `/api/decision` | High-confidence directional forecasts only |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8024
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
