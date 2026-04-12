# 03 — IT Operations: Service Desk AI

> **Domain:** IT Operations & Cybersecurity  
> **Application:** it-service-desk-ai  
> **Branch:** `03-it-operations-it-service-desk-ai`  
> **Architecture:** Microservice (branch-isolated)

## Description

Automated triage of 100 IT tickets. Classifies into AUTO_RESOLVE (known
solutions like password_reset, vpn_connect, printer), ROUTE (to team
queues), or ESCALATE (P1/P2 incidents or VIP users).

### Agent Role

**ServiceDeskAgent**:
- **ESCALATE** when severity ∈ {P1, P2} or user is VIP
- **AUTO_RESOLVE** for known categories (password, VPN, printer, etc.)
- **ROUTE** to appropriate team (network, application, security, hardware)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/run` | Full triage of all 100 tickets |
| GET | `/api/decision` | Tickets requiring human attention |

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn src.api.main:app --reload --port 8041
pytest tests/ -v
```

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
