# 06 — Supply Chain: Marine Bunkering

> **Domain:** Supply Chain Logistics  
> **Application:** marine-bunkering  
> **Branch:** `06-supply-chain-marine-bunkering`  
> **Architecture:** Microservice (branch-isolated)

## Overview

Monitors multimodal transport shipments across pipelines, tankers, rail, and
truck. Detects delivery delays, high-risk routes, and logistics disruptions
across BP's global supply chain network.

### Agents

| Agent | Entities | Function |
|-------|----------|----------|
| **LogisticsAgent** | 120 shipments | Detects severe delays (>10 days), high-risk routes (>0.7), multi-mode transport issues |

### Governance

- **Tier 1 (Automated):** AUTO_APPROVED / FLAGGED / ESCALATED_TO_TIER2
- **Tier 2 (Human Review):** APPROVED_URGENT / CONDITIONALLY_APPROVED / DEFERRED

## Project Structure

```
src/
  agents/          LogisticsAgent
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
uvicorn src.api.main:app --reload --port 8014
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/agents/logistics` | Logistics shipment results |
| GET | `/api/agents/logistics/critical` | Critical alerts only |
| GET | `/api/governance/tier1` | Tier 1 governance decisions |
| GET | `/api/governance/tier2` | Tier 2 human review decisions |
| GET | `/api/pipeline/run` | Full pipeline summary |

## Authorship

- **Developed by:** Person 2 (Teammate)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
