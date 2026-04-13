# 01 — Finance & Accounting

**Domain:** Finance & Accounting
**System:** EAIOS-BritishPetroleum

## Overview

AI agents for automating financial operations, compliance, forecasting, and
revenue analytics across BP's global finance function. This domain is the
financial intelligence layer of EAIOS — every other domain's operational
signal (cost, logistics, workforce, revenue) ultimately flows here for
budget variance, compliance, and capital allocation decisions.

## Agents

| # | Agent | Port | Purpose |
|---|-------|------|---------|
| 1 | `financial-close-automation-agent` | 8051 | Automates period-end close — reconciliation %, pending entries, audit flags |
| 2 | `jv-accounting-agent`              | 8052 | Reconciles joint-venture partner shares (ACG, Tangguh, Shah Deniz, etc.) |
| 3 | `cost-forecasting-agent`           | 8053 | Rolls up manufacturing + logistics + workforce cost signals vs budget |
| 4 | `tax-compliance-agent`             | 8054 | Validates transactions against regional tax rules (UK, US, DE, IN, AE, SG, BR) |
| 5 | `treasury-management-agent`        | 8055 | Cash flow & liquidity coverage ratio monitoring |
| 6 | `revenue-analytics-agent`          | 8056 | Revenue trend, growth rate, and cross-domain insight |

Each agent is a standalone FastAPI microservice, branch-isolated, exposing
`/health`, `/api/run`, and `/api/decision`.

## Domain Structure

```
01-finance-accounting/
├── agents/            6 AI agents (each with src/, tests/, config/)
├── applications/      Web/UI applications for this domain
├── services/          Shared microservices
└── models/            Shared data models and schemas
```

## Branch Map

Each agent is deployed from its own isolated branch:

- `01-finance-financial-close-automation`
- `01-finance-jv-accounting`
- `01-finance-cost-forecasting`
- `01-finance-tax-compliance`
- `01-finance-treasury-management`
- `01-finance-revenue-analytics`

## Tech Stack

- **Runtime:** Python 3.12
- **API:** FastAPI 0.111, Pydantic v2, Uvicorn
- **Data:** pandas, numpy (synthetic generators for demo; DB-ready for production)
- **Tests:** pytest
- **Container:** Docker (one image per agent)

## Quick Start (per agent)

```bash
git checkout 01-finance-treasury-management
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8055
pytest tests/ -v
```

## Standard API Contract

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe (no dependencies) |
| GET | `/api/run` | Full agent run — all records + counts |
| GET | `/api/decision` | Only actionable decisions (filtered) |

Every agent emits a uniform envelope:
```json
{ "decision": "...", "confidence": 0.85, "reason": "...", "actions": [ ... ] }
```

## Role in the Enterprise Platform

- Aggregated by the **Master Agent Orchestrator** (port 8000) into the
  enterprise-level decision.
- Visualised in the **EAIOS Dashboard UI** (http://localhost:3000) under the
  Finance domain page.
- Compliance findings flow into the **Audit Log** for admin review.

## Operating Team

- **Domain Owner:** Finance Manager (`finance@eaios.com`)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
