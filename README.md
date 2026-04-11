# 06 — Supply Chain: Aviation Fuel Logistics

> **Domain:** Supply Chain Logistics  
> **Application:** aviation-fuel-logistics  
> **Branch:** `06-supply-chain-aviation-fuel-logistics`  
> **Architecture:** Microservice (branch-isolated)  
> **Classification:** SAFETY-CRITICAL

## Overview

Monitors aviation fuel supply at 10 major international airports (LHR, JFK,
DXB, SIN, FRA, CDG, NRT, LAX, ORD, AMS). This is a safety-critical domain:
fuel shortages at airports require immediate action with no delay tolerance.

### Agents

| Agent | Entities | Function |
|-------|----------|----------|
| **AviationAgent** | 60 airport fuel positions | Detects critically low supply (<2 days), consumption spikes (>30k bbl/day) |

### Governance (Safety-Critical Rules)

- **Tier 1 (Automated):** AUTO_APPROVED / FLAGGED / ESCALATED_TO_TIER2
- **Tier 2 (Human Review):** All aviation fuel critical items receive **APPROVED_URGENT** with **IMMEDIATE** deadline

## Project Structure

```
src/
  agents/          AviationAgent
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
uvicorn src.api.main:app --reload --port 8013
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/agents/aviation` | Aviation fuel supply results |
| GET | `/api/agents/aviation/critical` | Critical alerts only |
| GET | `/api/governance/tier1` | Tier 1 governance decisions |
| GET | `/api/governance/tier2` | Tier 2 human review decisions |
| GET | `/api/pipeline/run` | Full pipeline summary |

## Authorship

- **Developed by:** Person 2 (Teammate)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
