#!/usr/bin/env bash
# lint-on-save.sh
# Lints the current file on save. Pass the file path as the first argument.
#
# Usage (call from your editor's on-save hook):
#   .claude/hooks/lint-on-save.sh <file-path>
#
# VS Code: add to .vscode/settings.json under "emeraldwalk.runonsave" or similar extension
# JetBrains: configure as a File Watcher

set -euo pipefail

FILE="${1:-}"

if [ -z "$FILE" ]; then
  echo "Usage: lint-on-save.sh <file-path>"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi

EXT="${FILE##*.}"

# ── TypeScript / TSX ───────────────────────────────────────────────────────────

if [[ "$EXT" == "ts" || "$EXT" == "tsx" ]]; then
  echo "Linting $FILE (ESLint)..."

  FRONTEND_DIR="$(git rev-parse --show-toplevel)/frontend"

  if [ -f "$FRONTEND_DIR/.eslintrc.js" ] || [ -f "$FRONTEND_DIR/.eslintrc.json" ] || [ -f "$FRONTEND_DIR/package.json" ]; then
    cd "$FRONTEND_DIR"
    # Resolve path relative to frontend dir
    REL_FILE="${FILE#$FRONTEND_DIR/}"
    if npx eslint --max-warnings=0 "$REL_FILE" 2>&1; then
      echo "✔ ESLint clean: $FILE"
    else
      echo "✘ ESLint errors in: $FILE"
      exit 1
    fi
  else
    echo "⚠ ESLint config not found in $FRONTEND_DIR — skipping"
  fi
fi

# ── Python ─────────────────────────────────────────────────────────────────────

if [[ "$EXT" == "py" ]]; then
  echo "Linting $FILE (Python)..."

  if command -v ruff &>/dev/null; then
    if ruff check "$FILE" 2>&1; then
      echo "✔ ruff clean: $FILE"
    else
      echo "✘ ruff errors in: $FILE"
      exit 1
    fi
  elif command -v flake8 &>/dev/null; then
    if flake8 "$FILE" 2>&1; then
      echo "✔ flake8 clean: $FILE"
    else
      echo "✘ flake8 errors in: $FILE"
      exit 1
    fi
  else
    echo "⚠ No Python linter found (ruff or flake8). Install with: pip install ruff"
  fi
fi

# ── Shell scripts ──────────────────────────────────────────────────────────────

if [[ "$EXT" == "sh" ]]; then
  if command -v shellcheck &>/dev/null; then
    if shellcheck "$FILE" 2>&1; then
      echo "✔ shellcheck clean: $FILE"
    else
      echo "✘ shellcheck errors in: $FILE"
      exit 1
    fi
  fi
fi

exit 0
