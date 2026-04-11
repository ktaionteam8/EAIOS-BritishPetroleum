# 06 — Supply Chain: Demand-Supply Matching

> **Domain:** Supply Chain Logistics  
> **Application:** demand-supply-matching  
> **Branch:** `06-supply-chain-demand-supply-matching`  
> **Architecture:** Microservice (branch-isolated)

## Overview

Monitors crude oil procurement and refinery operations to detect supply-demand
imbalances, cost anomalies, delivery delays, and capacity utilization risks
across BP's global refinery network.

### Agents

| Agent | Entities | Function |
|-------|----------|----------|
| **CrudeAgent** | 100 crude shipments | Detects cost spikes (>$100/bbl), delivery delays (>60 days), low volumes (<200k bbl) |
| **RefineryAgent** | 80 refinery operations | Detects over-utilization (>95%), under-utilization (<40%), low throughput |

### Governance

- **Tier 1 (Automated):** AUTO_APPROVED / FLAGGED / ESCALATED_TO_TIER2
- **Tier 2 (Human Review):** APPROVED_URGENT / CONDITIONALLY_APPROVED / DEFERRED

## Project Structure

```
src/
  agents/          CrudeAgent, RefineryAgent
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
uvicorn src.api.main:app --reload --port 8011
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/agents/crude` | Crude supply risk results |
| GET | `/api/agents/crude/critical` | Critical crude alerts only |
| GET | `/api/agents/refinery` | Refinery utilization results |
| GET | `/api/agents/refinery/critical` | Critical refinery alerts only |
| GET | `/api/governance/tier1` | Tier 1 governance decisions |
| GET | `/api/governance/tier2` | Tier 2 human review decisions |
| GET | `/api/pipeline/run` | Full pipeline summary |

## Authorship

- **Developed by:** Person 2 (Teammate)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
