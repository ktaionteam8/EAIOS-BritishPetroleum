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
  # To add a new source: append one line in the format above and re-run.
  declare -a SKILL_SOURCES=(
    # ── obra/superpowers ──────────────────────────────────────────────────────
    "tdd.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/test-driven-development/SKILL.md"
    "systematic-debugging.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/systematic-debugging/SKILL.md"
    "brainstorming.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md"
    "writing-plans.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-plans/SKILL.md"
    "executing-plans.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/executing-plans/SKILL.md"
    "requesting-code-review.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/requesting-code-review/SKILL.md"
    "verification-before-completion.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/verification-before-completion/SKILL.md"
    "dispatching-parallel-agents.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/dispatching-parallel-agents/SKILL.md"

    # ── nextlevelbuilder/ui-ux-pro-max-skill ──────────────────────────────────
    "ui-ux-pro-max.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/ui-ux-pro-max/SKILL.md"
    "ui-banner-design.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/banner-design/SKILL.md"
    "ui-brand.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/brand/SKILL.md"
    "ui-design-system.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/design-system/SKILL.md"
    "ui-design.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/design/SKILL.md"
    "ui-slides.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/slides/SKILL.md"
    "ui-styling.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/ui-styling/SKILL.md"

    # ── thedotmack/claude-mem ─────────────────────────────────────────────────
    "mem-do.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/do/SKILL.md"
    "mem-knowledge-agent.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/knowledge-agent/SKILL.md"
    "mem-make-plan.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/make-plan/SKILL.md"
    "mem-search.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/mem-search/SKILL.md"
    "mem-smart-explore.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/smart-explore/SKILL.md"
    "mem-timeline-report.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/timeline-report/SKILL.md"
    "mem-version-bump.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/version-bump/SKILL.md"

    # ── czlonkowski/n8n-skills ────────────────────────────────────────────────
    "n8n-expression-syntax.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-expression-syntax/SKILL.md"
    "n8n-mcp-tools.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-mcp-tools-expert/SKILL.md"
    "n8n-workflow-patterns.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-workflow-patterns/SKILL.md"
    "n8n-validation.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-validation-expert/SKILL.md"
    "n8n-node-config.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-node-configuration/SKILL.md"
    "n8n-code-js.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-code-javascript/SKILL.md"
    "n8n-code-py.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-code-python/SKILL.md"

    # ── kepano/obsidian-skills ────────────────────────────────────────────────
    "obsidian-markdown.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/obsidian-markdown/SKILL.md"
    "obsidian-bases.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/obsidian-bases/SKILL.md"
    "json-canvas.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/json-canvas/SKILL.md"
    "obsidian-cli.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/obsidian-cli/SKILL.md"
    "defuddle.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/defuddle/SKILL.md"
  )

  # Command source map: "local-filename.md|raw-github-url"
  # These are fetched into .claude/commands/gsd/ (not skills/)
  COMMANDS_DIR="$PROJECT_DIR/.claude/commands/gsd"
  mkdir -p "$COMMANDS_DIR"

  declare -a COMMAND_SOURCES=(
    # ── gsd-build/get-shit-done ───────────────────────────────────────────────
    "new-project.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/new-project.md"
    "map-codebase.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/map-codebase.md"
    "discuss-phase.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/discuss-phase.md"
    "plan-phase.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/plan-phase.md"
    "execute-phase.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/execute-phase.md"
    "verify-work.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/verify-work.md"
    "ship.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/ship.md"
    "complete-milestone.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/complete-milestone.md"
    "new-milestone.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/new-milestone.md"
    "next.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/next.md"
    "quick.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/quick.md"
    "help.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/help.md"
    "settings.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/commands/gsd/settings.md"
  )

  UPDATED=()
  ADDED=()
  UPDATED_CMDS=()
  ADDED_CMDS=()

  # ── Fetch skills ──────────────────────────────────────────────────────────
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

  # ── Fetch commands (gsd-build/get-shit-done) ──────────────────────────────
  for entry in "${COMMAND_SOURCES[@]}"; do
    LOCAL_FILE="${entry%%|*}"
    REMOTE_URL="${entry##*|}"
    LOCAL_PATH="$COMMANDS_DIR/$LOCAL_FILE"

    HTTP_STATUS=$(curl -s -o /tmp/ss_skill_tmp.md -w "%{http_code}" --max-time 10 "$REMOTE_URL" 2>/dev/null || echo "000")

    if [[ "$HTTP_STATUS" != "200" ]]; then
      log "  SKIP commands/gsd/$LOCAL_FILE (HTTP $HTTP_STATUS)"
      continue
    fi

    if [[ ! -f "$LOCAL_PATH" ]]; then
      cp /tmp/ss_skill_tmp.md "$LOCAL_PATH"
      ADDED_CMDS+=("$LOCAL_FILE")
      log "  ADDED commands/gsd/$LOCAL_FILE"
    elif ! diff -q "$LOCAL_PATH" /tmp/ss_skill_tmp.md &>/dev/null; then
      cp /tmp/ss_skill_tmp.md "$LOCAL_PATH"
      UPDATED_CMDS+=("$LOCAL_FILE")
      log "  UPDATED commands/gsd/$LOCAL_FILE"
    fi
  done

  rm -f /tmp/ss_skill_tmp.md

  # Commit if anything changed
  TOTAL_CHANGES=$(( ${#UPDATED[@]} + ${#ADDED[@]} + ${#UPDATED_CMDS[@]} + ${#ADDED_CMDS[@]} ))
  if [[ "$TOTAL_CHANGES" -gt 0 ]]; then
    SKILL_PATHS=""
    CMD_PATHS=""
    [[ "${#UPDATED[@]}" -gt 0 || "${#ADDED[@]}" -gt 0 ]] && \
      SKILL_PATHS=$(printf "$SKILLS_DIR/%s " "${UPDATED[@]:-}" "${ADDED[@]:-}")
    [[ "${#UPDATED_CMDS[@]}" -gt 0 || "${#ADDED_CMDS[@]}" -gt 0 ]] && \
      CMD_PATHS=$(printf "$COMMANDS_DIR/%s " "${UPDATED_CMDS[@]:-}" "${ADDED_CMDS[@]:-}")

    # shellcheck disable=SC2086
    git add $SKILL_PATHS $CMD_PATHS 2>> "$LOG_FILE"
    git commit -m "chore: auto-update skills and commands from upstream repos

$(printf 'Skills updated: %s\n' "${UPDATED[@]:-}")
$(printf 'Skills added: %s\n' "${ADDED[@]:-}")
$(printf 'Commands updated: %s\n' "${UPDATED_CMDS[@]:-}")
$(printf 'Commands added: %s\n' "${ADDED_CMDS[@]:-}")

Sources: obra/superpowers, nextlevelbuilder/ui-ux-pro-max-skill,
  thedotmack/claude-mem, czlonkowski/n8n-skills,
  kepano/obsidian-skills, gsd-build/get-shit-done" 2>> "$LOG_FILE" \
      && log "Committed skill/command updates" \
      || log "Commit skipped (nothing to commit)"

    git push -u origin "$(git rev-parse --abbrev-ref HEAD)" 2>> "$LOG_FILE" && log "Pushed skill/command updates" || log "Push failed (will retry next session)"
  else
    log "Skills and commands: all up to date"
  fi

  # Save timestamp regardless of whether updates were found
  echo "$NOW" > "$TIMESTAMP_FILE"
  log "Timestamp updated: $NOW"
fi

log "=== Session start complete ==="
