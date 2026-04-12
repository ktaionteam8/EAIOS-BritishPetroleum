# Core — Master Agent Orchestrator

> **Branch:** `core-master-agent-orchestrator`  
> **Role:** Enterprise-level decision intelligence across all 6 domains  
> **Port:** 8000

## Overview

The Master Agent is the top layer of BP's EAIOS. It queries one
representative microservice from each domain's `/api/decision` endpoint,
aggregates the outputs, and produces a single enterprise-level decision
with a confidence score, reason, and an ordered list of actions.

If a domain service is unreachable, the orchestrator falls back to a
deterministic mock so the master layer always produces a decision.

## Domain Connections (default ports)

| Domain | Representative Service | URL env var |
|--------|-----------------------|-------------|
| 05 Manufacturing | predictive-maintenance | `MFG_URL` (8001) |
| 06 Supply Chain | inventory-management | `SCM_URL` (8016) |
| 04 Commercial Trading | crude-trading-analytics | `TRADING_URL` (8021) |
| 01 Finance — Treasury | treasury-management | `TREASURY_URL` (8055) |
| 01 Finance — Tax | tax-compliance | `TAX_URL` (8054) |
| 03 IT & Cybersecurity | ot-security-monitoring | `IT_OT_URL` (8043) |
| 02 HR & Safety | safety-incident-prediction | `HR_SAFETY_URL` (8034) |

## Decision Rules

Evaluated in priority order:

1. **STOP_OPERATIONS_COMPLIANCE** — tax VIOLATION/NON_COMPLIANT
2. **HALT_OPERATIONS_SAFETY** — OT CRITICAL or HR ALERT
3. **ORDER_PARTS_AND_SCHEDULE_MAINTENANCE** — manufacturing high risk + inventory low
4. **EXECUTE_TRADE** — trading BUY + treasury INVEST
5. **PRESERVE_LIQUIDITY** — treasury ALERT
6. **SCHEDULE_MAINTENANCE** — manufacturing high risk only
7. **REPLENISH_INVENTORY** — inventory low only
8. **CONTINUE_NORMAL_OPS** — otherwise

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/api/run` | Full run: all domain inputs + aggregated decision |
| GET | `/api/decision` | Final enterprise-level decision only |

### Output Format

```json
{
  "final_decision": "ORDER_PARTS_AND_SCHEDULE_MAINTENANCE",
  "confidence": 0.9,
  "reason": "Maintenance risk elevated while spare inventory is low",
  "actions": ["Order spare parts and schedule maintenance window"],
  "triggered_rules": ["MAINTENANCE_AND_STOCKOUT"],
  "agent": "MasterAgent",
  "timestamp": "...",
  "domain_inputs": { ... }
}
```

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8000
pytest tests/ -v
```

## Design Notes

- **No hardcoded dependencies** — every domain URL is injected via env var
- **Mock fallback** — works fully offline for development
- **No cross-branch imports** — only HTTP communication with domain services
- **Stateless** — each request triggers a fresh fan-out

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
