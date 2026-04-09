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
