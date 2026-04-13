# 05 — Manufacturing & Plant Operations

**Domain:** Manufacturing & Plant Operations
**System:** EAIOS-BritishPetroleum

## Overview

AI agents for predictive maintenance, refinery yield optimisation,
quality control, downtime prevention, energy efficiency, and digital twin
simulation across BP's 7 operating refineries (Whiting, Rotterdam,
Gelsenkirchen, Cherry Point, Castellon, Kwinana, Mumbai West).

Fleet metrics are visualised in the **Manufacturing AI Cockpit** at
`/apps/manufacturing-ai` — refinery map, 90-day failure prediction timeline,
multi-site OEE benchmarking, and live agent health telemetry.

## Agents

| # | Agent | Port | Purpose |
|---|-------|------|---------|
| 1 | `predictive-maintenance-agent`       | 8001 | Failure probability + days-to-failure per equipment |
| 2 | `refinery-yield-optimization-agent`  | 8002 | Over/under-utilisation + throughput optimisation |
| 3 | `quality-control-agent`              | 8003 | Off-spec detection + batch hold recommendations |
| 4 | `downtime-prevention-agent`          | 8004 | Unplanned outage forecasting |
| 5 | `energy-efficiency-agent`            | 8005 | Fuel gas / power consumption anomalies |
| 6 | `digital-twin-agent`                 | 8006 | What-if simulation of process changes |

## Domain Structure

```
05-manufacturing-plant-operations/
├── agents/            6 AI agents (each with src/, tests/, config/)
├── applications/      Web/UI applications for this domain
├── services/          Shared microservices
└── models/            Shared data models and schemas
```

## Branch Map

- `05-manufacturing-predictive-maintenance`
- `05-manufacturing-refinery-yield-optimization`
- `05-manufacturing-quality-control-ai`
- `05-manufacturing-downtime-prevention`
- `05-manufacturing-energy-efficiency`
- `05-manufacturing-digital-twin`

## Tech Stack

- Python 3.12 · FastAPI 0.111 · Pydantic v2 · pandas · numpy · pytest · Docker

## Quick Start (per agent)

```bash
git checkout 05-manufacturing-predictive-maintenance
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8001
pytest tests/ -v
```

## Standard API Contract

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/api/run` | All equipment records + risk scoring |
| GET | `/api/decision` | Critical items requiring maintenance action |

## Platform Integration

- Manufacturing risk + Supply Chain inventory combine in the Master Agent:
  when maintenance risk is high AND spare inventory is low →
  `ORDER_PARTS_AND_SCHEDULE_MAINTENANCE`.
- The Manufacturing AI Cockpit shows the fleet map, failure timeline,
  multi-site benchmarks (OEE, MTBF, MTTR), and agent call/latency/uptime.

## Operating Team

- **Domain Owner:** Manufacturing Manager (`mfg@eaios.com`)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
