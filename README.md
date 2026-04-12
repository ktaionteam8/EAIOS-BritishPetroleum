# 01 — Finance: Cost Forecasting

> **Domain:** Finance & Accounting  
> **Application:** cost-forecasting  
> **Branch:** `01-finance-cost-forecasting`  
> **Architecture:** Microservice (branch-isolated)

## Description

Aggregates simulated cost signals from manufacturing, supply chain
(logistics), and HR (workforce) domains for 60 cost centers. Produces
a rolled-up forecast with variance vs budget and 3-month trend.

### Cross-Domain Inputs (Simulated Internally)

- **manufacturing_cost** (simulated Manufacturing domain signal)
- **logistics_cost** (simulated Supply Chain domain signal)
- **workforce_cost** (simulated HR domain signal)

No external API calls and no imports from other branches. All data
generated locally in `src/services/cost_forecast_data.py`.

### Agent Role

**CostForecastAgent**:
- **OVERRUN** when variance > +8% of budget AND 3m trend is rising
- **UNDERRUN** when variance < −8% of budget
- **STABLE** otherwise

Standard output: `{decision, confidence, reason, forecast_cost, variance, trend}`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full forecast of 60 cost centers + totals |
| GET | `/api/decision` | Actionable OVERRUN/UNDERRUN centers |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8053
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
