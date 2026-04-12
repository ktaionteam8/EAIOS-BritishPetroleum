# 02 — HR & Safety: Talent Analytics

> **Domain:** Human Resources & Safety  
> **Application:** talent-analytics  
> **Branch:** `02-human-resources-talent-analytics`  
> **Architecture:** Microservice (branch-isolated)

## Description

Evaluates 120 employees on performance, tenure, attrition risk, and
engagement to guide talent decisions: PROMOTE, RETAIN, REVIEW, MAINTAIN.

### Agent Role

**TalentAnalyticsAgent**:
- **RETAIN** when performer (perf ≥ 4.2) has high attrition risk (≥ 0.6)
- **PROMOTE** when top performer (perf ≥ 4.4) with tenure ≥ 3y and strong engagement
- **REVIEW** when performance < 2.8 (performance review needed)
- **MAINTAIN** otherwise

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 120 employees |
| GET | `/api/decision` | Actionable (non-MAINTAIN) decisions |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8033
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
