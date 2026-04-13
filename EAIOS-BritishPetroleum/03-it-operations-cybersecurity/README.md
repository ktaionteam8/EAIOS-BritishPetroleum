# 03 — IT Operations & Cybersecurity

**Domain:** IT Operations & Cybersecurity
**System:** EAIOS-BritishPetroleum

## Overview

AI agents for IT service automation, threat detection across IT/OT
networks, SCADA/ICS monitoring on Purdue Levels 1-3, shadow-IT discovery,
infrastructure observability, and compliance management across NIST CSF,
ISO 27001, SOX, GDPR, NERC CIP, IEC 62443, and PCI DSS.

## Agents

| # | Agent | Port | Purpose |
|---|-------|------|---------|
| 1 | `it-service-desk-agent`            | 8041 | AUTO_RESOLVE / ROUTE / ESCALATE — ticket triage |
| 2 | `threat-detection-agent`           | 8042 | THREAT / SUSPICIOUS / BENIGN — anomaly + IOC scoring |
| 3 | `ot-security-monitoring-agent` ⚠   | 8043 | CRITICAL / WARNING / NORMAL — ICS/SCADA asset safety |
| 4 | `shadow-it-rationalization-agent`  | 8044 | SANCTION / REVIEW / BLOCK — unsanctioned SaaS control |
| 5 | `infrastructure-monitoring-agent`  | 8045 | SCALE_UP / SCALE_DOWN / STABLE / ALERT — SLO-driven |
| 6 | `compliance-management-agent`      | 8046 | COMPLIANT / GAP / VIOLATION — control framework checks |

⚠ = safety-critical agent; its CRITICAL status can trigger enterprise-wide
HALT_OPERATIONS_SAFETY via the Master Agent.

## Domain Structure

```
03-it-operations-cybersecurity/
├── agents/            6 AI agents (each with src/, tests/, config/)
├── applications/      Web/UI applications for this domain
├── services/          Shared microservices
└── models/            Shared data models and schemas
```

## Branch Map

- `03-it-operations-it-service-desk-ai`
- `03-it-operations-threat-detection`
- `03-it-operations-ot-security-monitoring`
- `03-it-operations-shadow-it-rationalization`
- `03-it-operations-infrastructure-monitoring`
- `03-it-operations-compliance-management`

## Tech Stack

- Python 3.12 · FastAPI 0.111 · Pydantic v2 · pandas · numpy · pytest · Docker

## Quick Start (per agent)

```bash
git checkout 03-it-operations-threat-detection
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8042
pytest tests/ -v
```

## Standard API Contract

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/api/run` | Full agent scan |
| GET | `/api/decision` | Incidents requiring SOC / admin action |

## Security Posture

- No cross-branch imports — each agent communicates only over HTTP
- Secrets loaded via `.env.local` (gitignored); `.env.example` committed as a template
- Admin role (`admin@eaios.com`) sees the **Audit Log** (every actor,
  action, target, and timestamp across the platform)

## Operating Team

- **Domain Owner:** IT & Cybersecurity Manager (`it@eaios.com`)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
