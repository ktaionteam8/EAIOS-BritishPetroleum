#!/usr/bin/env bash
# pre-commit.sh
# Runs TypeScript type check and lints staged files before every commit.
# Install: cp .claude/hooks/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -euo pipefail

echo "Running pre-commit checks..."

# ── Helpers ────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No colour

pass() { echo -e "${GREEN}✔ $1${NC}"; }
fail() { echo -e "${RED}✘ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

# ── Detect staged files ────────────────────────────────────────────────────────

STAGED_TS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)
STAGED_PY=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.py$' || true)

# ── TypeScript type check ──────────────────────────────────────────────────────

if [ -n "$STAGED_TS" ]; then
  echo "TypeScript files staged — running tsc..."
  if [ -f "frontend/tsconfig.json" ]; then
    cd frontend
    if npx tsc --noEmit 2>&1; then
      pass "TypeScript type check passed"
    else
      fail "TypeScript type check failed. Fix type errors before committing."
    fi
    cd ..
  else
    warn "frontend/tsconfig.json not found — skipping tsc"
  fi
fi

# ── ESLint on staged TypeScript/TSX files ─────────────────────────────────────

if [ -n "$STAGED_TS" ]; then
  echo "Linting staged TypeScript files..."
  cd frontend
  # Pass staged files relative to the frontend directory
  STAGED_TS_RELATIVE=$(echo "$STAGED_TS" | sed 's|^frontend/||' | grep -E '\.(ts|tsx)$' || true)
  if [ -n "$STAGED_TS_RELATIVE" ]; then
    if echo "$STAGED_TS_RELATIVE" | xargs npx eslint --max-warnings=0 2>&1; then
      pass "ESLint passed"
    else
      fail "ESLint found errors. Fix them before committing."
    fi
  fi
  cd ..
fi

# ── Python lint (ruff) on staged Python files ─────────────────────────────────

if [ -n "$STAGED_PY" ]; then
  echo "Linting staged Python files..."
  if command -v ruff &>/dev/null; then
    if echo "$STAGED_PY" | xargs ruff check 2>&1; then
      pass "Python lint (ruff) passed"
    else
      fail "Python lint failed. Fix lint errors before committing."
    fi
  elif command -v flake8 &>/dev/null; then
    if echo "$STAGED_PY" | xargs flake8 2>&1; then
      pass "Python lint (flake8) passed"
    else
      fail "Python lint failed. Fix lint errors before committing."
    fi
  else
    warn "No Python linter found (ruff or flake8). Skipping Python lint."
  fi
fi

# ── Check for secrets ─────────────────────────────────────────────────────────

echo "Checking for accidental secrets..."
SECRET_PATTERNS='(SECRET_KEY|password|api_key|token|private_key)\s*=\s*["\x27][^"\x27${}]'
STAGED_ALL=$(git diff --cached --name-only --diff-filter=ACM | grep -v '.env.example' || true)

if [ -n "$STAGED_ALL" ]; then
  if echo "$STAGED_ALL" | xargs git diff --cached -- | grep -iE "$SECRET_PATTERNS" &>/dev/null; then
    fail "Possible hardcoded secret detected in staged files. Review your changes."
  else
    pass "No obvious secrets detected"
  fi
fi

echo ""
pass "All pre-commit checks passed. Proceeding with commit."
