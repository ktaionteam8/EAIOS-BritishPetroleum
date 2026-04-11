# Refiner AI

**Predictive Maintenance Intelligence Platform**
Domain: Manufacturing & Plant Operations — EAIOS British Petroleum

---

## Overview

Refiner AI is an AI-powered predictive maintenance platform that monitors 6,842 assets across 40 global refineries, providing real-time equipment health intelligence, failure prediction, and maintenance optimisation.

---

## Architecture

| Layer       | Technology                          | Port  |
|-------------|-------------------------------------|-------|
| Frontend    | React 18 + TypeScript + Tailwind    | 3001  |
| Backend API | FastAPI + Python                    | 8001  |
| Database    | PostgreSQL (Supabase cloud)         | cloud |
| Cache       | Redis 7                             | 6379  |

---

## Key Features

- **Live Dashboard** — Global refinery health map with real-time KPI cards
- **Live Alerts** — AI-prioritised alerts (LSTM + XGBoost pipeline)
- **Equipment Health Register** — Predictive health index across all 6,842 assets
- **Digital Twin** — Real-time virtual replica of individual equipment with sensor telemetry
- **AI Advisor** — Natural language maintenance recommendations
- **ML Models** — Model registry with performance tracking (9 AI/ML models)
- **Spare Parts** — Inventory optimisation and procurement recommendations
- **AI Work Orders** — Auto-generated maintenance work orders
- **ROI & 40% Target** — Financial impact tracking and downtime reduction analytics

---

## Folder Structure

```
Refiner AI/
├── frontend/                  ← React 18 + TypeScript SPA
│   ├── public/
│   └── src/
│       ├── components/        ← Reusable UI components
│       ├── pages/             ← Route-level page components
│       ├── hooks/             ← Custom React hooks
│       ├── api/               ← API client functions
│       ├── types/             ← TypeScript interfaces
│       ├── context/           ← React Context (auth, theme)
│       └── utils/             ← Pure utility functions
│
├── backend/                   ← FastAPI Python API
│   ├── src/
│   │   ├── routers/           ← Route handlers (thin controllers)
│   │   ├── services/          ← Business logic layer
│   │   ├── models/            ← SQLAlchemy ORM models
│   │   ├── schemas/           ← Pydantic request/response schemas
│   │   └── middleware/        ← Auth, cache, logging middleware
│   └── tests/                 ← pytest unit + integration tests
│
├── database/
│   ├── migrations/            ← Alembic migration files
│   ├── seeds/                 ← Seed data for development
│   └── schema.sql             ← Full database schema reference
│
├── config/                    ← Environment and app configuration
├── docs/                      ← Technical documentation
├── docker-compose.yml         ← Local development services
└── README.md
```

---

## Getting Started

Requirements will be added once the application specification is finalised.

---

## Module Status

| Module              | Status      |
|---------------------|-------------|
| Dashboard           | Planned     |
| Live Alerts         | Planned     |
| Equipment Health    | Planned     |
| Digital Twin        | Planned     |
| AI Advisor          | Planned     |
| ML Models           | Planned     |
| Spare Parts         | Planned     |
| AI Work Orders      | Planned     |
| ROI & 40% Target    | Planned     |
