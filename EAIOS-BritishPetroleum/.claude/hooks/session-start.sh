#!/usr/bin/env bash
# session-start.sh
#
# Runs automatically at the start of every Claude Code session.
# 1. Installs project dependencies (backend, frontend, data-pipelines)
# 2. Auto-updates .claude/skills/ from upstream GitHub repos (max once per 24h)
#
# Registered in .claude/settings.json → hooks.SessionStart

set -euo pipefail

# ── Async mode: runs in background while session starts ────────────────────────
echo '{"async": true, "asyncTimeout": 300000}'

# ── Helpers ────────────────────────────────────────────────────────────────────

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
SKILLS_DIR="$PROJECT_DIR/.claude/skills"
TIMESTAMP_FILE="$PROJECT_DIR/.claude/.skills-last-updated"
LOG_FILE="$PROJECT_DIR/.claude/.session-start.log"

log() { echo "[$(date '+%H:%M:%S')] $1" >> "$LOG_FILE"; }

log "=== Session start: $(date) ==="
log "Project: $PROJECT_DIR"

# ── 1. Install backend dependencies ───────────────────────────────────────────

if [ -f "$PROJECT_DIR/backend/requirements.txt" ]; then
  log "Installing backend dependencies..."
  cd "$PROJECT_DIR/backend"
  pip install -q -r requirements.txt 2>> "$LOG_FILE" && log "Backend deps: OK" || log "Backend deps: FAILED"
fi

# ── 2. Install frontend dependencies ──────────────────────────────────────────

if [ -f "$PROJECT_DIR/frontend/package.json" ]; then
  log "Installing frontend dependencies..."
  cd "$PROJECT_DIR/frontend"
  npm install --silent 2>> "$LOG_FILE" && log "Frontend deps: OK" || log "Frontend deps: FAILED"
fi

# ── 3. Install data-pipeline dependencies ─────────────────────────────────────

if [ -f "$PROJECT_DIR/data-pipelines/requirements.txt" ]; then
  log "Installing data-pipeline dependencies..."
  cd "$PROJECT_DIR/data-pipelines"
  pip install -q -r requirements.txt 2>> "$LOG_FILE" && log "Pipeline deps: OK" || log "Pipeline deps: FAILED"
fi

# ── 4. Auto-update skills (max once per 24 hours) ─────────────────────────────

cd "$PROJECT_DIR"

ONE_WEEK=604800   # 7 days in seconds
NOW=$(date +%s)
LAST_UPDATE=0

if [ -f "$TIMESTAMP_FILE" ]; then
  LAST_UPDATE=$(cat "$TIMESTAMP_FILE")
fi

ELAPSED=$(( NOW - LAST_UPDATE ))

if [ "$ELAPSED" -lt "$ONE_WEEK" ]; then
  DAYS_AGO=$(( ELAPSED / 86400 ))
  log "Skills update skipped — last updated ${DAYS_AGO}d ago (threshold: 7 days)"
else
  log "Checking upstream skills for updates..."

  # Skill source map: "local-filename.md|raw-github-url"
  declare -a SKILL_SOURCES=(
    "tdd.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/test-driven-development/SKILL.md"
    "systematic-debugging.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/systematic-debugging/SKILL.md"
    "brainstorming.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md"
    "writing-plans.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-plans/SKILL.md"
    "executing-plans.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/executing-plans/SKILL.md"
    "requesting-code-review.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/requesting-code-review/SKILL.md"
    "verification-before-completion.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/verification-before-completion/SKILL.md"
    "dispatching-parallel-agents.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/dispatching-parallel-agents/SKILL.md"
  )

  UPDATED=()
  ADDED=()

  for entry in "${SKILL_SOURCES[@]}"; do
    LOCAL_FILE="${entry%%|*}"
    REMOTE_URL="${entry##*|}"
    LOCAL_PATH="$SKILLS_DIR/$LOCAL_FILE"

    HTTP_STATUS=$(curl -s -o /tmp/ss_skill_tmp.md -w "%{http_code}" --max-time 10 "$REMOTE_URL" 2>/dev/null || echo "000")

    if [[ "$HTTP_STATUS" != "200" ]]; then
      log "  SKIP $LOCAL_FILE (HTTP $HTTP_STATUS)"
      continue
    fi

    if [[ ! -f "$LOCAL_PATH" ]]; then
      cp /tmp/ss_skill_tmp.md "$LOCAL_PATH"
      ADDED+=("$LOCAL_FILE")
      log "  ADDED $LOCAL_FILE"
    elif ! diff -q "$LOCAL_PATH" /tmp/ss_skill_tmp.md &>/dev/null; then
      cp /tmp/ss_skill_tmp.md "$LOCAL_PATH"
      UPDATED+=("$LOCAL_FILE")
      log "  UPDATED $LOCAL_FILE"
    fi
  done

  rm -f /tmp/ss_skill_tmp.md

  # Commit if anything changed
  if [[ "${#UPDATED[@]}" -gt 0 || "${#ADDED[@]}" -gt 0 ]]; then
    ALL=("${UPDATED[@]:-}" "${ADDED[@]:-}")
    PATHS=$(printf "$SKILLS_DIR/%s " "${ALL[@]}")

    git add $PATHS 2>> "$LOG_FILE"
    git commit -m "chore: auto-update skills from upstream repos

$(printf 'Updated: %s\n' "${UPDATED[@]:-none}")
$(printf 'Added: %s\n' "${ADDED[@]:-none}")

Source: obra/superpowers" 2>> "$LOG_FILE" && log "Committed skill updates" || log "Commit skipped (nothing to commit)"

    git push -u origin "$(git rev-parse --abbrev-ref HEAD)" 2>> "$LOG_FILE" && log "Pushed skill updates" || log "Push failed (will retry next session)"
  else
    log "Skills: all up to date"
  fi

  # Save timestamp regardless of whether updates were found
  echo "$NOW" > "$TIMESTAMP_FILE"
  log "Timestamp updated: $NOW"
fi

log "=== Session start complete ==="
