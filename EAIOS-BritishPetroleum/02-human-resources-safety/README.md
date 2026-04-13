# 02 — Human Resources & Safety

**Domain:** Human Resources & Safety
**System:** EAIOS-BritishPetroleum

## Overview

AI agents for workforce planning, skills-gap analysis, talent analytics,
safety incident prediction, contractor management, and the energy-transition
reskilling programme. Includes the safety-critical `safety-incident-prediction-agent`
which prioritises incident prevention over operational throughput.

## Agents

| # | Agent | Port | Purpose |
|---|-------|------|---------|
| 1 | `workforce-planning-agent`            | 8031 | HIRE / MAINTAIN / REDEPLOY based on utilisation + pipeline |
| 2 | `skills-gap-analysis-agent`           | 8032 | TRAIN / HIRE / OK — role × skill capability gaps |
| 3 | `talent-analytics-agent`              | 8033 | PROMOTE / RETAIN / REVIEW — performance × attrition risk |
| 4 | `safety-incident-prediction-agent` ⚠  | 8034 | ALERT / MONITOR / NORMAL — safety-critical site scoring |
| 5 | `contractor-management-agent`         | 8035 | RETAIN / REVIEW / REPLACE — efficiency, compliance, incidents |
| 6 | `energy-transition-reskilling-agent`  | 8036 | RESKILL / UPSKILL / HOLD — pivot to low-carbon roles |

⚠ = safety-critical agent; its ALERT status flows straight to the Master
Agent and can trigger enterprise-wide HALT_OPERATIONS_SAFETY decisions.

## Domain Structure

```
02-human-resources-safety/
├── agents/            6 AI agents (each with src/, tests/, config/)
├── applications/      Web/UI applications for this domain
├── services/          Shared microservices
└── models/            Shared data models and schemas
```

## Branch Map

- `02-human-resources-workforce-planning`
- `02-human-resources-skills-gap-analysis`
- `02-human-resources-talent-analytics`
- `02-human-resources-safety-incident-prediction`
- `02-human-resources-contractor-management`
- `02-human-resources-energy-transition-reskilling`

## Tech Stack

- Python 3.12 · FastAPI 0.111 · Pydantic v2 · pandas · numpy · pytest · Docker

## Quick Start (per agent)

```bash
git checkout 02-human-resources-safety-incident-prediction
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8034
pytest tests/ -v
```

## Standard API Contract

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/api/run` | Full agent run + summary counts |
| GET | `/api/decision` | Actionable items only |

## Platform Integration

- HR Manager (`hr@eaios.com`) can post jobs via the HR Jobs page in the
  Dashboard — new postings appear live on the public Careers site.
- Resume applications flow into the Gemini-backed resume screening pipeline;
  shortlist decisions appear in the HR Jobs panel.
- Safety alerts from the SafetyAgent trigger enterprise-wide notifications.

## Operating Team

- **Domain Owner:** HR & Safety Manager (`hr@eaios.com`)
- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
