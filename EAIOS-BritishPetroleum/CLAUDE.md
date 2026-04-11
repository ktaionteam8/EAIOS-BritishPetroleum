# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project

AI Operations System for British Petroleum (EAIOS). Three-layer architecture:

- **frontend/** — React 18 + TypeScript dashboard
- **backend/** — FastAPI (Python) REST API with async SQLAlchemy + Redis cache
- **data-pipelines/** — Apache Airflow DAGs for data ingestion and processing

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, React Router v6 |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2 (async), Alembic |
| Database | PostgreSQL 16 (via asyncpg) |
| Cache | Redis 7 |
| Pipelines | Apache Airflow 2.9 |
| Dev infra | Docker Compose |

---

## Services & Ports

| Service | Port | Tech |
|---|---|---|
| Frontend | 3000 | React 18 + TypeScript |
| Backend API | 8000 | FastAPI + PostgreSQL + Redis |
| Airflow | 8080 | Apache Airflow 2.9 |
| PostgreSQL | 5432 | Postgres 16 |
| Redis | 6379 | Redis 7 |

---

## Dev Commands

### Run everything
```bash
docker-compose up
```

### Frontend (port 3000)
```bash
cd frontend
npm install
npm start          # dev server
npm run build      # production build
npm test           # run tests
npm run lint       # ESLint
```

### Backend (port 8000)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload     # dev server
pytest tests/                     # all tests
pytest tests/test_foo.py::test_bar  # single test
```

### Airflow (port 8080)
```bash
cd data-pipelines
pip install -r requirements.txt
airflow db init
airflow webserver &
airflow scheduler
```

---

## Architecture Notes

- Backend entry point: `backend/src/main.py` — FastAPI app with CORS configured for `localhost:3000`
- DB session: `backend/src/models/database.py` — async sessions via `get_db()` dependency
- Redis client: `backend/src/middleware/cache.py` — singleton via `get_redis()` dependency
- Airflow DAGs live in `data-pipelines/ingestion/` and are mounted into the Airflow container
- All services connect to the same PostgreSQL instance; Airflow uses its own `airflow` database
- The codebase is a scaffold — business logic, data models, UI components, and pipeline tasks are ready to be built

---

## Full Project Structure

```
EAIOS-BritishPetroleum/
├── CLAUDE.md
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── .claude/
│   ├── settings.json                  ← model: sonnet, memory: project
│   ├── agents/
│   │   ├── code-reviewer.md           ← Bugs, security & performance reviews
│   │   ├── debugger.md                ← Root cause analysis & fixes
│   │   ├── test-writer.md             ← Unit + integration tests
│   │   ├── refactorer.md              ← Structure improvements, no behaviour change
│   │   ├── doc-writer.md              ← Technical documentation
│   │   └── security-auditor.md        ← Security vulnerability audits
│   ├── commands/
│   │   ├── fix-issue.md               ← /fix-issue <number>
│   │   ├── deploy.md                  ← /deploy [staging|production]
│   │   └── pr-review.md               ← /pr-review <number>
│   ├── hooks/
│   │   ├── pre-commit.sh              ← tsc + eslint + ruff + secret scan (executable)
│   │   └── lint-on-save.sh            ← Lint current file by extension (executable)
│   ├── rules/
│   │   ├── frontend.md                ← React, TypeScript, component & styling rules
│   │   ├── database.md                ← Models, queries, migrations, indexes
│   │   └── api.md                     ← REST design, errors, pagination, caching
│   └── skills/                        ← Empty, reserved for future skills
│
├── tasks/
│   ├── todo.md                        ← Active task tracker (plan-first workflow)
│   └── lessons.md                     ← Lessons learned log (updated after corrections)
│
├── backend/
│   ├── .env.example                   ← DATABASE_URL, REDIS_URL, SECRET_KEY
│   ├── requirements.txt
│   └── src/
│       ├── main.py                    ← FastAPI app + CORS
│       ├── middleware/
│       │   └── cache.py               ← Redis singleton
│       └── models/
│           ├── __init__.py
│           └── database.py            ← Async engine + Base + get_db()
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/index.html
│   └── src/
│       ├── index.tsx                  ← React entry point
│       └── App.tsx                    ← Router + root component
│
└── data-pipelines/
    ├── requirements.txt
    ├── config/airflow.cfg
    └── ingestion/
        └── example_dag.py             ← DAG: bp_data_ingestion (@daily)
```

---

## Git Workflow

- **Development branch**: `claude/eaios-bp-setup-371sm`
- Always develop and push to this branch: `git push -u origin claude/eaios-bp-setup-371sm`
- Never push to `main` without explicit permission
- Do NOT create a pull request unless the user explicitly asks
- Commit messages follow: `<type>: <description>` (fix/feat/chore/docs/refactor)
- Stage specific files by name — never `git add -A` blindly

---

## .claude/ Configuration

### settings.json
- Default model: `claude-sonnet-4-6`
- Memory: `project`
- Hooks wired to `pre-commit.sh` and `lint-on-save.sh`
- Rules auto-loaded from `.claude/rules/`

### Agents (all use `model: sonnet`, `memory: project`)
| Agent | Purpose |
|---|---|
| `code-reviewer` | Review PRs for bugs, security, performance |
| `debugger` | Systematic root cause analysis and fixes |
| `test-writer` | Unit + integration tests (pytest, RTL, Airflow) |
| `refactorer` | Improve structure without changing behaviour |
| `doc-writer` | Docstrings, READMEs, OpenAPI docs |
| `security-auditor` | Secrets, auth, injection, dependency CVEs |

### Slash Commands
| Command | Purpose |
|---|---|
| `/fix-issue <n>` | Reproduce → fix → test → commit a GitHub issue end-to-end |
| `/deploy [env]` | Pre-deploy checklist + deploy to staging or production |
| `/pr-review <n>` | Full structured PR review using code-reviewer agent |

### Hooks
| Hook | Trigger | What it does |
|---|---|---|
| `pre-commit.sh` | Before every commit | `tsc --noEmit`, ESLint, ruff/flake8, secret scan |
| `lint-on-save.sh` | On file save | Lints `.ts/.tsx` (ESLint), `.py` (ruff/flake8), `.sh` (shellcheck) |

To activate pre-commit hook: `cp .claude/hooks/pre-commit.sh .git/hooks/pre-commit`

### Domain Rules
| File | Covers |
|---|---|
| `rules/frontend.md` | Component structure, TypeScript strict mode, hooks, state, routing, styling |
| `rules/database.md` | SQLAlchemy 2.0 models, naming conventions, queries, N+1 avoidance, Alembic |
| `rules/api.md` | URL design, Pydantic schemas, HTTP status codes, error format, pagination, caching |

---

## Superpowers Skills (obra/superpowers)

Installed skills that enforce disciplined engineering practices. Use them as slash commands.

| Skill | Command | When to use |
|---|---|---|
| Brainstorming | `/brainstorming` | Before designing any new feature — HARD GATE before code |
| Writing Plans | `/writing-plans` | After design approved — break into 2–5 min tasks with TDD |
| Executing Plans | `/executing-plans` | Run a written plan task by task with checkpoints |
| TDD | `/tdd` | Enforce RED→GREEN→REFACTOR — delete code written without a test |
| Systematic Debugging | `/systematic-debugging` | 4-phase root cause analysis before any fix |
| Requesting Code Review | `/requesting-code-review` | After every task batch, before merging |
| Verification Before Completion | `/verification-before-completion` | Prove it works with fresh evidence before saying done |
| Dispatching Parallel Agents | `/dispatching-parallel-agents` | 3+ independent problems — solve concurrently |
| Model | `/model` | Switch context: Opus for planning, Sonnet for execution |

### Superpowers Workflow (the full cycle)
```
1. /brainstorming      → Clarify requirements, design approved
2. /writing-plans      → Break into tasks, saved to docs/superpowers/plans/
3. /executing-plans    → Execute task by task with commits
4. /tdd                → Tests first on every task, no exceptions
5. /requesting-code-review → Review after every batch of tasks
6. /verification-before-completion → Fresh proof before saying done
```

### Output Folders
- Design specs: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Implementation plans: `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`

### Keeping Skills Up to Date
Skills, agents, and commands are fetched from upstream GitHub repos. The session-start hook auto-updates all registered repos weekly (7-day threshold). To manually trigger:
```bash
./scripts/update-skills.sh           # interactive
./scripts/update-skills.sh --yes     # auto-commit
./scripts/update-skills.sh --dry-run # preview only
```
To add a new GitHub repo, run `/fetch-github-repo <url>` or paste the URL in any prompt.

---

## /fetch-github-repo — Registered External Repositories

### Auto-Trigger Rule
**When a GitHub URL (`https://github.com/<owner>/<repo>`) appears in any prompt, automatically run the `/fetch-github-repo` workflow.** No need to invoke the command manually — detection and execution are automatic.

### Command
```
/fetch-github-repo <https://github.com/owner/repo.git>
```
Full workflow defined in `.claude/commands/fetch-github-repo.md`. The command:
1. Explores the repo for skills, agents, commands, and hooks
2. Downloads and integrates all found components
3. Adds URLs to `SKILL_SOURCES` / `AGENT_SOURCES` / `COMMAND_SOURCES` in `session-start.sh` and `scripts/update-skills.sh`
4. Updates this table with the new entry
5. Commits: `"feat: integrated external repo: <owner>/<repo> on <DATE>"`
6. Weekly auto-update is handled by the session-start hook (no extra scheduling needed)

### Registered Repositories

| Repository | URL | Date Added | Last Fetched | Components |
|---|---|---|---|---|
| `obra/superpowers` | https://github.com/obra/superpowers | 2026-04-09 | 2026-04-09 | 8 skills, 1 agent (`sp-code-reviewer`) |
| `nextlevelbuilder/ui-ux-pro-max-skill` | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | 2026-04-09 | 2026-04-09 | 7 skills |
| `thedotmack/claude-mem` | https://github.com/thedotmack/claude-mem | 2026-04-09 | 2026-04-09 | 7 skills |
| `czlonkowski/n8n-skills` | https://github.com/czlonkowski/n8n-skills | 2026-04-09 | 2026-04-09 | 7 skills |
| `kepano/obsidian-skills` | https://github.com/kepano/obsidian-skills | 2026-04-09 | 2026-04-09 | 5 skills |
| `gsd-build/get-shit-done` | https://github.com/gsd-build/get-shit-done | 2026-04-09 | 2026-04-09 | 4 agents, 13 commands |
| `hesreallyhim/awesome-claude-code` | https://github.com/hesreallyhim/awesome-claude-code | 2026-04-09 | — | Curated index only — no extractable files |
| `upstash/context7` | https://github.com/upstash/context7 | 2026-04-09 | 2026-04-09 | 1 rule (`context7.md`), 1 skill (`context7-docs.md`) |
| `affaan-m/everything-claude-code` | https://github.com/affaan-m/everything-claude-code | 2026-04-09 | 2026-04-09 | 13 agents (`ecc-*`), 12 skills (`ecc-*`), 10 rules (`ecc-common/`, `ecc-python/`, `ecc-typescript/`) |

### Weekly Auto-Update Schedule
All repos above are registered in `.claude/hooks/session-start.sh` → `SKILL_SOURCES`, `AGENT_SOURCES`, `COMMAND_SOURCES`. The hook runs on every session start and re-fetches everything if 7+ days have passed since the last update. No cron job or manual action required.

### Component Locations After Integration

| Component Type | Upstream Source | Local Path |
|---|---|---|
| Skills | `*/SKILL.md` | `.claude/skills/<name>.md` |
| Rules | `rules/*.md` | `.claude/rules/<name>.md` |
| Agents | `agents/*.md` | `.claude/agents/<name>.md` |
| GSD Commands | `commands/gsd/*.md` | `.claude/commands/gsd/<name>.md` |
| Backend utilities | `src/**/*.py` | `backend/src/skills\|agents\|commands/` |

---

## Model Strategy

| Mode | Model | Purpose |
|---|---|---|
| **Planning** | `claude-opus-4-6` | Plan mode, architecture, PR reviews, security audits, complex debugging |
| **Execution** | `claude-sonnet-4-6` | All regular prompts, writing code, editing files, running commands |

### Rules
- **Default for every prompt**: Sonnet (`claude-sonnet-4-6`)
- **Switch to Opus** when entering plan mode or invoking a planning-heavy agent
- Agents on Opus: `code-reviewer`, `security-auditor`, `debugger`
- Agents on Sonnet: `test-writer`, `refactorer`, `doc-writer`
- Use `/model status` to check, `/model plan` or `/model execute` to set context

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting work
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what is necessary. Avoid introducing bugs.

---

## Enterprise Architecture — EAIOS-BritishPetroleum

**Project:** EAIOS-BritishPetroleum — Enterprise AI Operating System
**Client:** British Petroleum (BP)
**Purpose:** AI-powered automation across 6 core business domains with 36 specialised agents

---

### Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only. Protected. Merge via PR after review. |
| `develop` | Integration and testing branch. All domains merge here first. |
| `domain/01-finance-accounting` | Finance domain development |
| `domain/02-human-resources-safety` | HR & Safety domain development |
| `domain/03-it-operations-cybersecurity` | IT & Cybersecurity domain development |
| `domain/04-commercial-trading` | Commercial & Trading domain development |
| `domain/05-manufacturing-plant-operations` | Manufacturing domain development |
| `domain/06-supply-chain-logistics` | Supply Chain domain development |

**Agent branches** follow the pattern: `agent/<agent-name>` (e.g., `agent/predictive-maintenance-agent`)

---

### Enterprise Folder Structure

```
EAIOS-BritishPetroleum/
├── 01-finance-accounting/
├── 02-human-resources-safety/
├── 03-it-operations-cybersecurity/
├── 04-commercial-trading/
├── 05-manufacturing-plant-operations/
├── 06-supply-chain-logistics/
├── core/
│   ├── shared-libs/
│   ├── ai-platform/
│   ├── data-pipelines/
│   ├── api-gateway/
│   └── auth/
└── infrastructure/
    ├── docker/
    ├── kubernetes/
    ├── airflow/
    └── monitoring/
```

Each domain follows this layout:
```
<domain>/
├── README.md
├── agents/
│   └── <agent-name>/
│       ├── src/
│       ├── tests/
│       ├── config/
│       └── README.md
├── applications/
├── services/
└── models/
```

---

### Domain 1 — Finance & Accounting (`01-finance-accounting/`)

| Agent | Purpose |
|---|---|
| `financial-close-automation-agent` | Automates period-end financial close: reconciliations, accruals, intercompany eliminations |
| `jv-accounting-agent` | Manages Joint Venture accounting, billing statements, cash calls, partner reporting |
| `cost-forecasting-agent` | Predicts cost variances vs budget; early-warning for overruns |
| `tax-compliance-agent` | Global tax compliance, filing reminders, transfer pricing validation |
| `treasury-management-agent` | Cash/liquidity optimisation, FX exposure, intercompany loans |
| `revenue-analytics-agent` | Revenue performance analytics across BUs, products, and geographies |

---

### Domain 2 — Human Resources & Safety (`02-human-resources-safety/`)

| Agent | Purpose |
|---|---|
| `workforce-planning-agent` | Forecasts headcount needs using project pipelines and attrition data |
| `skills-gap-analysis-agent` | Identifies capability gaps; recommends training and hiring interventions |
| `talent-analytics-agent` | Talent pipeline health, flight risk, succession planning |
| `safety-incident-prediction-agent` | Predicts HSE incidents using leading indicators and near-miss data |
| `contractor-management-agent` | Full contractor lifecycle: onboarding, competency, PTW compliance, offboarding |
| `energy-transition-reskilling-agent` | Maps oil & gas skills to renewable roles; personalised learning pathways |

---

### Domain 3 — IT Operations & Cybersecurity (`03-it-operations-cybersecurity/`)

| Agent | Purpose |
|---|---|
| `it-service-desk-agent` | Automates IT ticket triage, classification, routing, and resolution |
| `threat-detection-agent` | Detects cyber threats across IT/OT networks using behavioural analytics |
| `ot-security-monitoring-agent` | Monitors ICS/SCADA/DCS environments for security threats |
| `shadow-it-rationalization-agent` | Discovers unsanctioned cloud services; assesses risk and recommends governance |
| `infrastructure-monitoring-agent` | Infrastructure health, performance, capacity; predictive alerting and auto-remediation |
| `compliance-management-agent` | ISO 27001 / NIST / SOC2 compliance tracking, evidence collection, gap identification |

---

### Domain 4 — Commercial & Trading (`04-commercial-trading/`)

| Agent | Purpose |
|---|---|
| `crude-trading-analytics-agent` | Crude oil market dynamics, supply/demand fundamentals, trading opportunity analysis |
| `carbon-credit-trading-agent` | Carbon credit portfolio management, ETS compliance, voluntary market trading |
| `castrol-pricing-engine-agent` | Castrol lubricant pricing optimisation across 120+ global markets |
| `aviation-fuel-forecasting-agent` | Jet A-1 demand forecasting using flight schedules and airline capacity plans |
| `lng-trading-platform-agent` | LNG cargo trading: spot/term markets, shipping schedules, pricing differentials |
| `cross-commodity-arbitrage-agent` | Identifies arbitrage opportunities across crude, gas, power, and carbon |

---

### Domain 5 — Manufacturing & Plant Operations (`05-manufacturing-plant-operations/`)

| Agent | Purpose |
|---|---|
| `predictive-maintenance-agent` | Predicts equipment failures using IoT sensors, vibration analysis, thermography |
| `refinery-yield-optimization-agent` | Maximises refinery throughput via crude blend, unit conditions, product routing |
| `quality-control-agent` | Real-time product quality monitoring; deviation detection and root cause analysis |
| `downtime-prevention-agent` | Early-warning for unplanned plant shutdowns; triggers proactive interventions |
| `energy-efficiency-agent` | Optimises steam, power, fuel gas, and cooling water usage; supports decarbonisation |
| `digital-twin-agent` | High-fidelity plant simulation for scenario testing, operator training, and optimisation |

---

### Domain 6 — Supply Chain & Logistics (`06-supply-chain-logistics/`)

| Agent | Purpose |
|---|---|
| `demand-supply-matching-agent` | Balances product supply with downstream demand; optimises crude and product movements |
| `castrol-distribution-agent` | Optimises Castrol global distribution: blending, warehousing, last-mile delivery |
| `aviation-fuel-logistics-agent` | End-to-end aviation fuel supply chain from refinery to airport hydrant |
| `marine-bunkering-agent` | Marine fuel supply and bunkering operations across global ports |
| `retail-fuel-optimization-agent` | Retail station supply, pricing, and delivery optimisation |
| `inventory-management-agent` | Inventory level optimisation: safety stock, reorder points, tank utilisation |

---

### Core Shared Infrastructure (`core/`)

| Component | Purpose |
|---|---|
| `shared-libs/` | Shared Python/TypeScript libraries: auth utils, logging, Pydantic models, test fixtures |
| `ai-platform/` | Model registry, feature store, inference API, training orchestration, drift monitoring |
| `data-pipelines/` | Airflow DAGs, SAP/PI/market data connectors, transformation utilities |
| `api-gateway/` | **SOLE communication channel between all agents** — routes, auth, rate limiting, audit log |
| `auth/` | JWT issuance, RBAC, OAuth2 (Azure AD), API key lifecycle, audit trail |

---

### Infrastructure (`infrastructure/`)

| Component | Purpose |
|---|---|
| `docker/` | Docker Compose for local development and CI builds |
| `kubernetes/` | K8s manifests: deployments, services, ingress, HPA, ConfigMaps, secrets refs |
| `airflow/` | Airflow deployment config, plugins, connection templates |
| `monitoring/` | Prometheus, Grafana, Loki, Jaeger, PagerDuty/Slack alert routing |

---

### Agent Communication Rules

1. **API Gateway only** — All inter-agent communication routes through `core/api-gateway`. Direct calls are prohibited.
2. **Isolated branches** — Each agent is developed on its own branch (`agent/<agent-name>`).
3. **No shared state** — Agents do not share databases or in-memory state.
4. **Validated contracts** — All inputs/outputs are validated at the gateway boundary using OpenAPI schemas.
5. **Each agent must contain:** `src/`, `tests/`, `config/`, `README.md`

---

### Agent Branch Naming Convention

```
agent/financial-close-automation-agent
agent/predictive-maintenance-agent
agent/threat-detection-agent
... (one branch per agent, 36 total)
```

Domain branches:
```
domain/01-finance-accounting
domain/02-human-resources-safety
domain/03-it-operations-cybersecurity
domain/04-commercial-trading
domain/05-manufacturing-plant-operations
domain/06-supply-chain-logistics
```
