# 01 — Finance: Revenue Analytics

> **Domain:** Finance & Accounting  
> **Application:** revenue-analytics  
> **Branch:** `01-finance-revenue-analytics`  
> **Architecture:** Microservice (branch-isolated)

## Description

Analyzes 75 revenue streams (Crude Trading, Refined Products, LNG,
Castrol Lubricants, Retail Fuel, Aviation Fuel, Marine Fuel,
Renewables, Carbon Credits, Gas & Power) across 6 global regions.
Combines simulated trading, retail, and demand signals to identify
GROWTH / STABLE / DECLINE patterns.

### Cross-Domain Inputs (Simulated Internally)

- **trading_revenue** (simulated Commercial Trading domain signal)
- **retail_sales** (simulated Supply Chain retail domain signal)
- **demand_index** (simulated demand signal)

No external API calls and no imports from other branches. All data
generated locally in `src/services/revenue_analytics_data.py`.

### Agent Role

**RevenueAnalyticsAgent**:
- **GROWTH** when QoQ growth > 5% AND demand index > 0.55
- **DECLINE** when QoQ growth < −3%
- **STABLE** otherwise

Standard output: `{decision, confidence, reason, revenue_trend, growth_rate, insight}`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full analysis of 75 revenue streams + totals |
| GET | `/api/decision` | Actionable streams (GROWTH + DECLINE) |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8056
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
