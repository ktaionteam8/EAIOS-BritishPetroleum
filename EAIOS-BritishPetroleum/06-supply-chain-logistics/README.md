# 06 — Supply Chain & Logistics

**Domain:** Supply Chain & Logistics
**System:** EAIOS-BritishPetroleum

## Overview

AI agents for demand-supply matching, Castrol distribution, aviation fuel
logistics, marine bunkering, retail fuel optimisation, and inventory
management across BP's global network. Includes the safety-critical
`aviation-fuel-logistics-agent` which governs jet fuel availability at
60+ major airports worldwide.

## Agents

| # | Agent | Port | Purpose |
|---|-------|------|---------|
| 1 | `demand-supply-matching-agent`       | 8011 | Crude procurement × refinery demand (CrudeAgent + RefineryAgent) |
| 2 | `castrol-distribution-agent`         | 8012 | Lubricant shortage / overstock detection |
| 3 | `aviation-fuel-logistics-agent` ⚠    | 8013 | Jet fuel days-of-supply at major airports |
| 4 | `marine-bunkering-agent`             | 8014 | Multimodal transport delay + route risk |
| 5 | `retail-fuel-optimization-agent`     | 8015 | Retail station stockout + demand spike detection |
| 6 | `inventory-management-agent`         | 8016 | Warehouse stock vs safety stock monitoring |

⚠ = safety-critical agent; aviation fuel shortages escalate directly to
enterprise-wide safety decisions via the Master Agent.

## Domain Structure

```
06-supply-chain-logistics/
├── agents/            6 AI agents (each with src/, tests/, config/)
├── applications/      Web/UI applications for this domain
├── services/          Shared microservices
└── models/            Shared data models and schemas
```

## Branch Map

- `06-supply-chain-demand-supply-matching`
- `06-supply-chain-castrol-distribution`
- `06-supply-chain-aviation-fuel-logistics`
- `06-supply-chain-marine-bunkering`
- `06-supply-chain-retail-fuel-optimization`
- `06-supply-chain-inventory-management`

## Tech Stack

- Python 3.12 · FastAPI 0.111 · Pydantic v2 · pandas · numpy · pytest · Docker

## Governance Pipeline

Supply chain agents produce raw risk scores which feed a two-tier
governance engine:

- **Tier 1** — Automated: AUTO_APPROVED / FLAGGED / ESCALATED_TO_TIER2
- **Tier 2** — Human review: APPROVED_URGENT / CONDITIONALLY_APPROVED / DEFERRED

Aviation fuel critical items always receive APPROVED_URGENT + IMMEDIATE
deadline — no human-in-the-loop delay permitted on safety-critical signals.

## Quick Start (per agent)

```bash
git checkout 06-supply-chain-inventory-management
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8016
pytest tests/ -v
```

## Standard API Contract

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/api/run` | All records + summary counts |
| GET | `/api/decision` | Actionable items (critical + warning) |

## Platform Integration

- Inventory + Manufacturing maintenance risk combine in the Master Agent:
  when both are stressed → `ORDER_PARTS_AND_SCHEDULE_MAINTENANCE`.
- Aviation fuel CRITICAL status triggers cross-domain safety decisions.

## Operating Team

- **Domain Owner:** Supply Chain Manager (`scm@eaios.com`)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
