# EAIOS Dashboard — Enterprise UI

> **Branch:** `core-dashboard-ui`  
> **Stack:** Next.js 14 · TypeScript · Tailwind CSS · Recharts · Axios · lucide-react  
> **Theme:** Dark, enterprise-grade

Modern interactive dashboard for the BP Enterprise AI Operations System.
Visualises 6 business domains, 36 worker microservices, and the Master
Agent orchestrator in a single pane of glass.

## Features

- **Overview page** — KPI cards, 6-domain grid, Master Agent panel, live activity feed
- **Domain pages** — drill-down per domain showing 6 services with status/confidence/decision plus a 24h trend chart
- **Master Decision page** — full orchestrator view with contributing domain signals
- **Auto-refresh every 5s** across all pages
- **Live + mock fallback** — works offline when backend services aren't running
- **Dark theme** with green/amber/red status colour coding
- **Responsive** grid layouts down to tablet

## Quick Start

```bash
npm install
cp .env.example .env.local   # (optional) point NEXT_PUBLIC_MASTER_URL at your master orchestrator
npm run dev                   # http://localhost:3000
npm run build && npm run start
```

## Environment Variables

```
NEXT_PUBLIC_MASTER_URL=http://localhost:8000   # Master Agent base URL
```

If the Master Agent or domain services are unreachable the dashboard
renders deterministic mock data so the UI always has something to show.

## Project Structure

```
app/
  layout.tsx                Sidebar shell
  page.tsx                  Overview dashboard
  master-decision/page.tsx  Master Agent focus view
  domain/[slug]/page.tsx    Dynamic domain detail page
components/
  Sidebar.tsx, TopBar.tsx
  KpiCard.tsx, DomainCard.tsx
  MasterAgentPanel.tsx, ActivityFeed.tsx
  StatusBadge.tsx, ConfidenceBar.tsx, DomainChart.tsx
lib/
  api.ts         Axios + mock fallback
  domains.ts     Domain & service metadata
  types.ts       Shared types
hooks/
  useAutoRefresh.ts   5s polling hook
```

## API Integration

| Endpoint | Source | Fallback |
|----------|--------|----------|
| Master decision | `GET {MASTER_URL}/api/decision` | Deterministic mock |
| Domain summaries | Synthesised from service metadata | Deterministic mock |
| Activity feed | Derived from domain statuses | Deterministic mock |

Swap the Axios calls in `lib/api.ts` to hit real domain `/api/run`
endpoints when the microservices are deployed.

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
