# EAIOS — British Petroleum Enterprise AI Operating System

AI-powered operations platform for British Petroleum across 6 business domains and 36 AI agents.

---

## Architecture

| Layer | Technology | Port |
|---|---|---|
| Frontend | React 18 + TypeScript + Tailwind | 3000 |
| Backend API | FastAPI + Python | 8000 |
| Database | **Supabase (cloud PostgreSQL)** | cloud |
| Cache | Redis 7 (local) | 6379 |
| Pipelines | Apache Airflow 2.9 | 8080 |

> **Database is cloud-hosted on Supabase — no local PostgreSQL needed.**
> Team members connect to the shared Supabase instance using credentials from the team lead.

---

## Prerequisites

Install these once on your machine:

| Tool | Version | Download |
|---|---|---|
| Node.js | 18 LTS or higher | https://nodejs.org |
| Python | 3.11 or higher | https://python.org/downloads |
| Git | Any recent | https://git-scm.com |
| Docker | For Redis | https://docker.com/get-started |

Verify everything is installed:
```bash
node --version    # v18+
python3 --version # Python 3.11+
git --version
docker --version
```

---

## Getting Started

### Step 1 — Clone the repository

```bash
git clone https://github.com/ktaionteam8/EAIOS-BritishPetroleum.git
cd EAIOS-BritishPetroleum
git checkout claude/eaios-bp-setup-371sm
```

### Step 2 — Get Supabase credentials

Ask your team lead for the **Supabase database password**.
The Supabase project is: `https://hnmsgojeexhyhsrlhgcv.supabase.co`

---

## Running the Frontend

```bash
# 1. Install dependencies (one-time)
cd frontend
npm install --legacy-peer-deps

# 2. Copy env file
cp .env.example .env.local

# 3. Start the app
npm start
```

Opens at **http://localhost:3000**

**To stop:** press `Ctrl + C`

**Next time:** just run `npm start` — no need to reinstall.

---

## Running the Backend

```bash
# 1. Go to backend folder
cd backend

# 2. Create Python virtual environment (one-time)
python3 -m venv .venv

# 3. Activate it
source .venv/bin/activate        # Mac / Linux
.venv\Scripts\activate           # Windows

# 4. Install dependencies (one-time)
pip install -r requirements.txt

# 5. Set up environment variables (one-time)
cp .env.example .env
```

Now open `backend/.env` and fill in your Supabase password:
```
DATABASE_URL=postgresql+asyncpg://postgres.[YOUR-PASSWORD]@db.hnmsgojeexhyhsrlhgcv.supabase.co:5432/postgres
```

```bash
# 6. Start the backend
uvicorn src.main:app --reload --port 8000
```

API runs at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

**To stop:** press `Ctrl + C`

**Next time:**
```bash
cd backend
source .venv/bin/activate
uvicorn src.main:app --reload --port 8000
```

---

## Running Redis (required by backend)

Redis runs locally via Docker:

```bash
docker run -d --name eaios-redis -p 6379:6379 redis:7-alpine
```

To start it again after a restart:
```bash
docker start eaios-redis
```

---

## Using Make (optional shortcut)

If you have `make` installed, you can use shortcuts:

```bash
make setup-frontend    # Install frontend deps + create .env.local
make setup-backend     # Create venv + install backend deps + create .env
make frontend          # Start frontend
make backend           # Start backend
make redis             # Start Redis via Docker
```

---

## Database — Supabase

The project uses **Supabase** as its cloud PostgreSQL database.

| Detail | Value |
|---|---|
| Project URL | https://hnmsgojeexhyhsrlhgcv.supabase.co |
| Dashboard | https://supabase.com/dashboard/project/hnmsgojeexhyhsrlhgcv |
| Host | `db.hnmsgojeexhyhsrlhgcv.supabase.co` |
| Port | `5432` |
| Database | `postgres` |
| User | `postgres` |

**All team members connect to the same shared database.**
Get the password from your team lead — never commit it to Git.

---

## Environment Files

| File | Purpose | Committed? |
|---|---|---|
| `backend/.env.example` | Template — safe to share | Yes |
| `backend/.env` | Your local secrets | **No — gitignored** |
| `frontend/.env.example` | Template — safe to share | Yes |
| `frontend/.env.local` | Your local config | **No — gitignored** |

---

## Project Structure

```
EAIOS-BritishPetroleum/
├── frontend/                        ← React 18 + TypeScript
│   ├── src/
│   │   ├── components/              ← UI components
│   │   ├── context/AuthContext.tsx  ← Auth state
│   │   ├── pages/                   ← Route pages
│   │   └── types/index.ts           ← Shared types
│   ├── .env.example                 ← Copy to .env.local
│   └── package.json
│
├── backend/                         ← FastAPI + Python
│   ├── src/
│   │   ├── main.py                  ← FastAPI app
│   │   ├── config.py                ← Settings (reads .env)
│   │   ├── models/database.py       ← DB session
│   │   └── middleware/cache.py      ← Redis client
│   ├── .env.example                 ← Copy to .env
│   └── requirements.txt
│
├── data-pipelines/                  ← Apache Airflow DAGs
│   └── ingestion/example_dag.py
│
├── 01-finance-accounting/           ← Domain: Finance (6 agents)
├── 02-human-resources-safety/       ← Domain: HR & Safety (6 agents)
├── 03-it-operations-cybersecurity/  ← Domain: IT & Cyber (6 agents)
├── 04-commercial-trading/           ← Domain: Trading (6 agents)
├── 05-manufacturing-plant-operations/ ← Domain: Manufacturing (6 agents)
├── 06-supply-chain-logistics/       ← Domain: Supply Chain (6 agents)
│
├── core/                            ← Shared infrastructure
│   ├── api-gateway/
│   ├── auth/
│   ├── ai-platform/
│   ├── data-pipelines/
│   └── shared-libs/
│
├── infrastructure/                  ← Deployment configs
│   ├── docker/
│   ├── kubernetes/
│   ├── airflow/
│   └── monitoring/
│
├── docker-compose.yml               ← Redis + Backend + Airflow
├── Makefile                         ← Convenience commands
└── README.md                        ← This file
```

---

## Common Issues

| Problem | Fix |
|---|---|
| `npm install` fails | Use `npm install --legacy-peer-deps` |
| `python3` not found (Windows) | Use `python` instead of `python3` |
| `.venv/bin/activate` not found (Windows) | Use `.venv\Scripts\activate` |
| `DATABASE_URL` error on backend start | Fill in Supabase password in `backend/.env` |
| Port 3000 already in use | Press `Y` when prompted to use a different port |
| Redis connection refused | Run `docker start eaios-redis` |

---

## Git Branches

| Branch | Purpose |
|---|---|
| `main` | Production — protected |
| `develop` | Integration — merge PRs here |
| `claude/eaios-bp-setup-371sm` | Current dev branch |
| `domain/01-finance-accounting` | Finance domain work |
| `domain/02-human-resources-safety` | HR domain work |
| `domain/03-it-operations-cybersecurity` | IT domain work |
| `domain/04-commercial-trading` | Trading domain work |
| `domain/05-manufacturing-plant-operations` | Manufacturing domain work |
| `domain/06-supply-chain-logistics` | Supply chain domain work |
