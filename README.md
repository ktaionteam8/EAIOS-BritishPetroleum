# 06 — Supply Chain: Castrol Distribution

> **Domain:** Supply Chain Logistics  
> **Application:** castrol-distribution  
> **Branch:** `06-supply-chain-castrol-distribution`  
> **Architecture:** Microservice (branch-isolated)

## Overview

Monitors Castrol lubricant distribution positions across 6 global regions
and 7 SKU types. Detects shortage risks (inventory < 50% demand) and
overstock conditions (inventory > 3.5x demand) that tie up working capital.

### Agents

| Agent | Entities | Function |
|-------|----------|----------|
| **LubricantAgent** | 80 distribution points | Detects shortages, overstock, and inventory-demand imbalances |

### Governance

- **Tier 1 (Automated):** AUTO_APPROVED / FLAGGED / ESCALATED_TO_TIER2
- **Tier 2 (Human Review):** APPROVED_URGENT / CONDITIONALLY_APPROVED / DEFERRED

## Project Structure

```
src/
  agents/          LubricantAgent
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
uvicorn src.api.main:app --reload --port 8012
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/agents/lubricant` | Lubricant distribution results |
| GET | `/api/agents/lubricant/critical` | Critical alerts only |
| GET | `/api/governance/tier1` | Tier 1 governance decisions |
| GET | `/api/governance/tier2` | Tier 2 human review decisions |
| GET | `/api/pipeline/run` | Full pipeline summary |

## Authorship

- **Developed by:** Person 2 (Teammate)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
