# 03 — IT Operations: Shadow IT Rationalization

> **Domain:** IT Operations & Cybersecurity  
> **Application:** shadow-it-rationalization  
> **Branch:** `03-it-operations-shadow-it-rationalization`  
> **Architecture:** Microservice (branch-isolated)

## Description

Catalogs and rationalizes 85 detected shadow IT applications (unauthorized
SaaS tools like Notion, ChatGPT, Slack personal, Dropbox, Figma, etc.).
Balances user adoption against compliance risk, data sensitivity, and
vendor risk.

### Agent Role

**ShadowITAgent**:
- **BLOCK** when compliance_risk ≥ 0.7 OR data_sensitivity ≥ 0.8 OR vendor_risk ≥ 0.75
- **SANCTION** when ≥ 50 users with low risk across all dimensions
- **BLOCK** when sanctioned alternative already exists (migrate users)
- **REVIEW** otherwise

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full scan of all 85 apps |
| GET | `/api/decision` | Apps requiring immediate action |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8044
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
