# 06 — Supply Chain: Inventory Management

> **Domain:** Supply Chain Logistics  
> **Application:** inventory-management  
> **Branch:** `06-supply-chain-inventory-management`  
> **Architecture:** Microservice (branch-isolated)

## Overview

Monitors warehouse inventory positions across 20 locations and 6 product types.
Detects stockout risk (stock < 50% safety stock) and overstock conditions
(stock > 3x safety stock) that tie up working capital.

### Agents

| Agent | Entities | Function |
|-------|----------|----------|
| **InventoryAgent** | 100 inventory positions | Detects stockout risk, overstock, safety stock violations |

### Governance

- **Tier 1 (Automated):** AUTO_APPROVED / FLAGGED / ESCALATED_TO_TIER2
- **Tier 2 (Human Review):** APPROVED_URGENT / CONDITIONALLY_APPROVED / DEFERRED

## Project Structure

```
src/
  agents/          InventoryAgent
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
uvicorn src.api.main:app --reload --port 8016
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/agents/inventory` | Inventory position results |
| GET | `/api/agents/inventory/critical` | Critical alerts only |
| GET | `/api/governance/tier1` | Tier 1 governance decisions |
| GET | `/api/governance/tier2` | Tier 2 human review decisions |
| GET | `/api/pipeline/run` | Full pipeline summary |

## Authorship

- **Developed by:** Person 2 (Teammate)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
