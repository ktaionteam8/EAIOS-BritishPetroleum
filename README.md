# 06 — Supply Chain: Retail Fuel Optimization

> **Domain:** Supply Chain Logistics  
> **Application:** retail-fuel-optimization  
> **Branch:** `06-supply-chain-retail-fuel-optimization`  
> **Architecture:** Microservice (branch-isolated)

## Overview

Monitors retail gas stations across 6 global regions. Detects imminent
stockout conditions (stock/sales < 0.5) and demand spikes (>20k units/day)
to enable proactive replenishment.

### Agents

| Agent | Entities | Function |
|-------|----------|----------|
| **RetailAgent** | 100 retail stations | Detects stockout risk, demand spikes, low coverage |

### Governance

- **Tier 1 (Automated):** AUTO_APPROVED / FLAGGED / ESCALATED_TO_TIER2
- **Tier 2 (Human Review):** APPROVED_URGENT / CONDITIONALLY_APPROVED / DEFERRED

## Project Structure

```
src/
  agents/          RetailAgent
  api/             FastAPI REST endpoints
  services/        Data generators, governance engine
  models/          Pydantic schemas
tests/             pytest test suite
config/            Application settings, logging config
Dockerfile
requirements.txt
.env.example
README.md
```

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8015
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/agents/retail` | Retail station results |
| GET | `/api/agents/retail/critical` | Critical alerts only |
| GET | `/api/governance/tier1` | Tier 1 governance decisions |
| GET | `/api/governance/tier2` | Tier 2 human review decisions |
| GET | `/api/pipeline/run` | Full pipeline summary |

## Authorship

- **Developed by:** Person 2 (Teammate)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
