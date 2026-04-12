# 03 — IT Operations: Infrastructure Monitoring

> **Domain:** IT Operations & Cybersecurity  
> **Application:** infrastructure-monitoring  
> **Branch:** `03-it-operations-infrastructure-monitoring`  
> **Architecture:** Microservice (branch-isolated)

## Description

Tracks health of 120 services across prod/staging/DR environments.
Combines CPU, memory, disk, p95 latency, and error rate into scaling
and alerting recommendations.

### Agent Role

**InfraMonitoringAgent**:
- **ALERT** when error rate > 5%, p95 latency > 1000ms, or disk > 92%
- **SCALE_UP** when CPU/mem pressure is high
- **SCALE_DOWN** when over-provisioned (CPU < 30%)
- **STABLE** otherwise

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full health scan of 120 services |
| GET | `/api/decision` | Services requiring scaling or alerting |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8045
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
