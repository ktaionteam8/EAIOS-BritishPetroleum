# 02 — HR & Safety: Skills Gap Analysis

> **Domain:** Human Resources & Safety  
> **Application:** skills-gap-analysis  
> **Branch:** `02-human-resources-skills-gap-analysis`  
> **Architecture:** Microservice (branch-isolated)

## Description

Analyzes 80 role/skill combinations across BP roles (process engineers,
traders, data scientists, safety officers, renewables engineers, etc.)
and detects where current capability levels fall short of requirements.

### Agent Role

**SkillsGapAgent**:
- **TRAIN** when gap > 0 and trainability score ≥ 0.6 (internal upskill)
- **HIRE** when gap > 0 and trainability is low (external sourcing)
- **OK** when current level meets or exceeds required

Assigns `priority` (HIGH/MEDIUM/LOW) based on gap magnitude.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full agent run; all 80 role/skill records |
| GET | `/api/decision` | Actionable gaps requiring training or hiring |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8032
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
