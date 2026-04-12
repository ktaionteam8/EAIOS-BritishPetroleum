# 03 — IT Operations: Compliance Management

> **Domain:** IT Operations & Cybersecurity  
> **Application:** compliance-management  
> **Branch:** `03-it-operations-compliance-management`  
> **Architecture:** Microservice (branch-isolated)

## Description

Validates 100 controls against major compliance frameworks (NIST CSF,
ISO 27001, SOX, GDPR, NERC CIP, IEC 62443, PCI DSS). Tracks control
coverage, evidence freshness, and finding severity.

### Agent Role

**ComplianceAgent**:
- **VIOLATION** when finding severity ≥ 4 OR (regulator-required AND coverage < 50%)
- **GAP** when coverage < 80%, evidence > 365 days old, or severity ≥ 2
- **COMPLIANT** when control is fully covered with fresh evidence

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full control evaluation |
| GET | `/api/decision` | Non-compliant controls requiring remediation |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8046
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
