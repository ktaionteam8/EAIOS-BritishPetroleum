# 03 — IT Operations: OT Security Monitoring

> **Domain:** IT Operations & Cybersecurity  
> **Application:** ot-security-monitoring  
> **Branch:** `03-it-operations-ot-security-monitoring`  
> **Architecture:** Microservice (branch-isolated)  
> **Classification:** SAFETY-CRITICAL

## Description

Monitors 90 OT/ICS/SCADA assets (PLCs, DCS controllers, RTUs, HMIs,
Historians, SIS) across refineries, terminals, and offshore platforms.
Detects unauthorized firmware, protocol anomalies, and lateral traffic
at Purdue Levels 1-3.

### Agent Role

**OTSecurityAgent** — Composite risk model weighted by asset criticality:
- **CRITICAL** (risk ≥ 0.6) → ISOLATE_AND_INVESTIGATE, IMMEDIATE priority
- **WARNING** (0.3 ≤ risk < 0.6) → MONITOR, HIGH priority
- **NORMAL** (risk < 0.3) → LOG

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full scan of 90 OT assets |
| GET | `/api/decision` | CRITICAL + WARNING assets |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8043
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
