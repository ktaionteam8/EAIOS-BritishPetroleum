# core/api-gateway

Central API Gateway — the ONLY authorised communication channel between all EAIOS-BP agents.

## Rule
> All inter-agent communication MUST route through this gateway.
> Direct agent-to-agent calls are strictly prohibited.

## Contents
- `routes/`       — Route definitions per domain
- `auth/`         — API key and JWT validation middleware
- `rate-limiting/` — Per-agent rate limit configuration
- `logging/`      — Request/response audit logging
- `contracts/`    — OpenAPI specs for all agent APIs

## Stack
- FastAPI + Uvicorn
- Redis (rate limiting)
- PostgreSQL (audit log)
