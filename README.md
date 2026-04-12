# 02 — HR & Safety: Energy Transition Reskilling

> **Domain:** Human Resources & Safety  
> **Application:** energy-transition-reskilling  
> **Branch:** `02-human-resources-energy-transition-reskilling`  
> **Architecture:** Microservice (branch-isolated)

## Description

Identifies 100 employees in declining fossil-fuel roles and recommends
training pathways toward growing low-carbon roles (hydrogen systems,
carbon capture, renewables trading, EV charging, biofuels, grid
integration, sustainability analytics).

### Agent Role

**ReskillingAgent**:
- **RESKILL** when role demand declining ≥15%, ≥50% skill overlap with
  target role, and learning agility ≥ 0.6 (120 training hours)
- **UPSKILL** when current role softening but target low-carbon
  competencies in demand (60 training hours)
- **HOLD** when role demand is stable

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 100 candidates + total training hours |
| GET | `/api/decision` | Actionable reskilling/upskilling recommendations |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8036
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
