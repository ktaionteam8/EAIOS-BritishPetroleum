# ─────────────────────────────────────────────────────────────────────────────
# EAIOS-BP — Makefile
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help frontend backend redis dev setup-frontend setup-backend

# ── Default ───────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  EAIOS-BP — Available Commands"
	@echo "  ─────────────────────────────────────────────"
	@echo "  make setup-frontend   Install frontend dependencies"
	@echo "  make setup-backend    Create Python venv + install backend deps"
	@echo "  make frontend         Start frontend dev server (port 3000)"
	@echo "  make backend          Start backend API server (port 8000)"
	@echo "  make redis            Start local Redis via Docker (port 6379)"
	@echo "  make dev              Start Redis + backend together"
	@echo ""

# ── One-time setup ────────────────────────────────────────────────────────────
setup-frontend:
	@echo "→ Installing frontend dependencies..."
	cd frontend && npm install --legacy-peer-deps
	@echo "✓ Frontend ready. Run: make frontend"

setup-backend:
	@echo "→ Creating Python virtual environment..."
	cd backend && python3 -m venv .venv
	@echo "→ Installing backend dependencies..."
	cd backend && .venv/bin/pip install --upgrade pip && .venv/bin/pip install -r requirements.txt
	@echo "→ Setting up .env file..."
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "✓ Created backend/.env — fill in your Supabase password"; fi
	@if [ ! -f frontend/.env.local ]; then cp frontend/.env.example frontend/.env.local; echo "✓ Created frontend/.env.local"; fi
	@echo "✓ Backend ready. Edit backend/.env then run: make backend"

# ── Run services ──────────────────────────────────────────────────────────────
frontend:
	@echo "→ Starting frontend on http://localhost:3000"
	cd frontend && npm start

backend:
	@echo "→ Starting backend on http://localhost:8000"
	cd backend && .venv/bin/uvicorn src.main:app --reload --port 8000

redis:
	@echo "→ Starting Redis on port 6379"
	docker run -d --name eaios-redis -p 6379:6379 redis:7-alpine || docker start eaios-redis

dev: redis backend
