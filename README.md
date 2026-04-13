# EAIOS Enterprise Platform — British Petroleum

> **Branch:** `core-enterprise-platform`  
> **Stack:** Next.js 14 · TypeScript · Tailwind CSS · Recharts · Axios · Gemini AI  
> **Theme:** Dark, enterprise-grade

Full enterprise platform built on top of the EAIOS dashboard — adds Gemini
AI, chatbot, RBAC, HR automation, task management, notifications, and a
public company website. **Zero existing branches modified.**

## What's new vs `core-dashboard-ui`

| Feature | Location |
|---------|----------|
| **Gemini master agent** (with rule fallback) | `app/api/master/route.ts` + `backend/gemini_service.py` |
| **Enterprise chatbot** (Gemini-backed, triggers actions) | `components/Chatbot.tsx` + `app/api/chat/route.ts` |
| **Role-based access (RBAC)** with hardcoded demo users | `lib/rbac.ts` + `middleware.ts` + `app/login` |
| **HR job posting & resume screening** (Gemini-powered) | `app/hr/jobs` + `app/api/resume-screen/route.ts` |
| **Task assignment system** | `app/tasks` + `app/api/tasks/route.ts` |
| **Notification center** (bell with unread count) | `components/NotificationBell.tsx` + `app/api/notifications/route.ts` |
| **Public company website** (Home, About, Services, Careers, Contact) | `app/website/*` |
| **HR → Website integration** (jobs appear live on Careers) | Shared store in `lib/store.ts` |

## Demo Accounts

Click any account on the login page to auto-fill:

| Role | Username | Password | Can see |
|------|----------|----------|---------|
| Admin | `admin` | `admin123` | Everything |
| CEO | `ceo` | `ceo123` | Overview + Master Decision |
| Mfg Manager | `manager_mfg` | `mfg123` | Manufacturing only |
| HR Manager | `manager_hr` | `hr123` | HR domain + Jobs page |
| Employee | `employee_mfg` | `emp123` | My tasks + limited view |

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY=...
npm run dev
```

Visit http://localhost:3000/login to sign in, or
http://localhost:3000/website for the public portal.

## Environment

```bash
GEMINI_API_KEY=your-key        # required for live AI; system falls back to rules if missing/rate-limited
NEXT_PUBLIC_MASTER_URL=http://localhost:8000  # optional Python master agent base URL
```

## Architecture

```
app/
  (auth)        login/              RBAC login page
  (public)      website/            Home, About, Services, Careers, Contact
  (private)     page.tsx            Enterprise overview (KPIs + domain grid)
                master-decision/    Orchestrator view
                domain/[slug]/      Per-domain drill-down
                tasks/              Task board
                hr/jobs/            HR job management + AI resume screening
  api/
    auth/login            Session cookie auth
    master                Gemini-backed enterprise decision (rule fallback)
    chat                  Chatbot with Gemini + intent-triggered side effects
    jobs                  Job posting CRUD (shared by HR + Careers)
    tasks                 Task assignment CRUD
    notifications         Notification center + unread count
    resume-screen         Gemini-powered resume screening

components/                Sidebar, TopBar, Chatbot, NotificationBell,
                           KpiCard, DomainCard, MasterAgentPanel, ActivityFeed,
                           DomainChart, StatusBadge, ConfidenceBar, UserChip, AppShell
lib/
  gemini.ts                @google/generative-ai client + JSON/text helpers
  rbac.ts                  Hardcoded users + permission helpers
  session.ts               Client-side cookie session
  store.ts                 Shared in-memory stores (jobs, tasks, notifications, screenings)
  api.ts                   Dashboard data fetcher (axios + mock fallback)
  domains.ts               Domain metadata
backend/
  gemini_service.py        Python wrapper for the master agent (for the FastAPI orchestrator)
middleware.ts              Route guard — redirects unauthenticated users to /login
```

## Chatbot Capabilities

The floating chatbot (bottom-right) accepts natural-language queries and can:

- Summarize domain status: *"Show refinery status"*
- Analyze performance: *"Analyze last 10 days performance"*
- Suggest improvements: *"Suggest improvements for supply chain"*
- **Trigger actions**: *"Assign employee_mfg to inspect Pump P-101"* → creates a real task
- **Create jobs**: *"Create a job posting for data scientist"* → prompts HR flow

All traffic goes to `/api/chat` which forwards to Gemini with an enterprise
system prompt. If Gemini is rate-limited or unreachable, the chatbot falls
back gracefully and the UI tags the response as *offline mode*.

## Safety / Isolation

- Lives entirely on `core-enterprise-platform`
- Built **on top of** `core-dashboard-ui` — inherits all dashboard work
- **No changes** to `main`, `develop`, domain branches (01–06), or
  `core-master-agent-orchestrator`
- `.env.local` (with real Gemini key) is gitignored; only `.env.example`
  is committed

## Authorship

- **Integrated by:** Sathishkumar B
- **Architecture:** EAIOS Enterprise AI Operations System — British Petroleum
