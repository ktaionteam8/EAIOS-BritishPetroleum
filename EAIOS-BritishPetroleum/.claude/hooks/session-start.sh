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

# ── 0. Install and auth gh CLI (if GITHUB_TOKEN is set) ───────────────────────

# Load GITHUB_TOKEN from ~/.claude/.env if not already in environment
if [ -z "${GITHUB_TOKEN:-}" ] && [ -f "$HOME/.claude/.env" ]; then
  # shellcheck disable=SC1090
  set -a; source "$HOME/.claude/.env"; set +a
fi

if ! command -v gh &>/dev/null; then
  log_early() { echo "[session-start] $1"; }
  log_early "Installing gh CLI..."
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list
    apt-get update -qq && apt-get install -y -qq gh 2>/dev/null || log_early "gh install failed"
  fi
fi

if command -v gh &>/dev/null && [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "$GITHUB_TOKEN" | gh auth login --with-token 2>/dev/null || true
  export GH_TOKEN="$GITHUB_TOKEN"   # gh CLI also reads GH_TOKEN
fi
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

    # ── affaan-m/everything-claude-code (ECC) ────────────────────────────────
    "ecc-python-patterns.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/python-patterns/SKILL.md"
    "ecc-search-first.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/search-first/SKILL.md"
    "ecc-docker-patterns.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/docker-patterns/SKILL.md"
    "ecc-continuous-learning.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/continuous-learning-v2/SKILL.md"
    "ecc-cost-aware-llm.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/cost-aware-llm-pipeline/SKILL.md"
    "ecc-security-scan.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/security-scan/SKILL.md"
    "ecc-mcp-server-patterns.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/mcp-server-patterns/SKILL.md"
    "ecc-documentation-lookup.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/documentation-lookup/SKILL.md"
    "ecc-skill-stocktake.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/skill-stocktake/SKILL.md"
    "ecc-frontend-slides.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/frontend-slides/SKILL.md"
    "ecc-pytorch-patterns.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/pytorch-patterns/SKILL.md"
    "ecc-nestjs-patterns.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/nestjs-patterns/SKILL.md"
  )

  # Rule source map: "local-filename.md|raw-github-url"
  # These are fetched into .claude/rules/ and kept updated weekly.
  RULES_DIR="$PROJECT_DIR/.claude/rules"
  mkdir -p "$RULES_DIR"

  # Rules are stored in subdirectories to preserve relative references
  # ECC rules: .claude/rules/ecc-common/, .claude/rules/ecc-python/, .claude/rules/ecc-typescript/
  mkdir -p "$RULES_DIR/ecc-common" "$RULES_DIR/ecc-python" "$RULES_DIR/ecc-typescript"

  declare -a RULE_SOURCES=(
    # ── upstash/context7 ─────────────────────────────────────────────────────
    "context7.md|https://raw.githubusercontent.com/upstash/context7/master/rules/context7-cli.md"

    # ── affaan-m/everything-claude-code — common rules ────────────────────
    "ecc-common/coding-style.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/common/coding-style.md"
    "ecc-common/git-workflow.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/common/git-workflow.md"
    "ecc-common/testing.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/common/testing.md"
    "ecc-common/performance.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/common/performance.md"
    "ecc-common/patterns.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/common/patterns.md"
    "ecc-common/hooks.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/common/hooks.md"
    "ecc-common/agents.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/common/agents.md"
    "ecc-common/security.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/common/security.md"

    # ── affaan-m/everything-claude-code — python + typescript rules ────────
    "ecc-python/patterns.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/python/patterns.md"
    "ecc-typescript/patterns.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/rules/typescript/patterns.md"
  )

  # Agent source map: "local-filename.md|raw-github-url"
  # These are fetched into .claude/agents/ (upstream agents only)
  # NOTE: Local project agents (code-reviewer, debugger, etc.) are NOT overwritten.
  #   obra/superpowers code-reviewer → sp-code-reviewer.md (prefixed to avoid conflict)
  #   gsd agents already have gsd- prefix, no conflict.
  AGENTS_DIR="$PROJECT_DIR/.claude/agents"
  mkdir -p "$AGENTS_DIR"

  declare -a AGENT_SOURCES=(
    # ── obra/superpowers ──────────────────────────────────────────────────────
    "sp-code-reviewer.md|https://raw.githubusercontent.com/obra/superpowers/main/agents/code-reviewer.md"

    # ── gsd-build/get-shit-done ───────────────────────────────────────────────
    "gsd-plan-checker.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-plan-checker.md"
    "gsd-verifier.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-verifier.md"
    "gsd-executor.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-executor.md"
    "gsd-planner.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-planner.md"

    # ── affaan-m/everything-claude-code (ECC) ────────────────────────────────
    "ecc-planner.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/planner.md"
    "ecc-architect.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/architect.md"
    "ecc-tdd-guide.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/tdd-guide.md"
    "ecc-security-reviewer.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/security-reviewer.md"
    "ecc-build-error-resolver.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/build-error-resolver.md"
    "ecc-database-reviewer.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/database-reviewer.md"
    "ecc-python-reviewer.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/python-reviewer.md"
    "ecc-typescript-reviewer.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/typescript-reviewer.md"
    "ecc-docs-lookup.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/docs-lookup.md"
    "ecc-loop-operator.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/loop-operator.md"
    "ecc-harness-optimizer.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/harness-optimizer.md"
    "ecc-refactor-cleaner.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/refactor-cleaner.md"
    "ecc-doc-updater.md|https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/doc-updater.md"
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
  UPDATED_RULES=()
  ADDED_RULES=()
  UPDATED_AGENTS=()
  ADDED_AGENTS=()
  UPDATED_CMDS=()
  ADDED_CMDS=()

  # ── Fetch rules ───────────────────────────────────────────────────────────
  for entry in "${RULE_SOURCES[@]}"; do
    LOCAL_FILE="${entry%%|*}"
    REMOTE_URL="${entry##*|}"
    LOCAL_PATH="$RULES_DIR/$LOCAL_FILE"

    HTTP_STATUS=$(curl -s -o /tmp/ss_skill_tmp.md -w "%{http_code}" --max-time 10 "$REMOTE_URL" 2>/dev/null || echo "000")

    if [[ "$HTTP_STATUS" != "200" ]]; then
      log "  SKIP rules/$LOCAL_FILE (HTTP $HTTP_STATUS)"
      continue
    fi

    if [[ ! -f "$LOCAL_PATH" ]]; then
      cp /tmp/ss_skill_tmp.md "$LOCAL_PATH"
      ADDED_RULES+=("$LOCAL_FILE")
      log "  ADDED rules/$LOCAL_FILE"
    elif ! diff -q "$LOCAL_PATH" /tmp/ss_skill_tmp.md &>/dev/null; then
      cp /tmp/ss_skill_tmp.md "$LOCAL_PATH"
      UPDATED_RULES+=("$LOCAL_FILE")
      log "  UPDATED rules/$LOCAL_FILE"
    fi
  done

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

  # ── Fetch agents ─────────────────────────────────────────────────────────
  for entry in "${AGENT_SOURCES[@]}"; do
    LOCAL_FILE="${entry%%|*}"
    REMOTE_URL="${entry##*|}"
    LOCAL_PATH="$AGENTS_DIR/$LOCAL_FILE"

    HTTP_STATUS=$(curl -s -o /tmp/ss_skill_tmp.md -w "%{http_code}" --max-time 10 "$REMOTE_URL" 2>/dev/null || echo "000")

    if [[ "$HTTP_STATUS" != "200" ]]; then
      log "  SKIP agents/$LOCAL_FILE (HTTP $HTTP_STATUS)"
      continue
    fi

    if [[ ! -f "$LOCAL_PATH" ]]; then
      cp /tmp/ss_skill_tmp.md "$LOCAL_PATH"
      ADDED_AGENTS+=("$LOCAL_FILE")
      log "  ADDED agents/$LOCAL_FILE"
    elif ! diff -q "$LOCAL_PATH" /tmp/ss_skill_tmp.md &>/dev/null; then
      cp /tmp/ss_skill_tmp.md "$LOCAL_PATH"
      UPDATED_AGENTS+=("$LOCAL_FILE")
      log "  UPDATED agents/$LOCAL_FILE"
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
  TOTAL_CHANGES=$(( ${#UPDATED[@]} + ${#ADDED[@]} + ${#UPDATED_RULES[@]} + ${#ADDED_RULES[@]} + ${#UPDATED_AGENTS[@]} + ${#ADDED_AGENTS[@]} + ${#UPDATED_CMDS[@]} + ${#ADDED_CMDS[@]} ))
  if [[ "$TOTAL_CHANGES" -gt 0 ]]; then
    SKILL_PATHS=""
    RULE_PATHS=""
    AGENT_PATHS=""
    CMD_PATHS=""
    [[ "${#UPDATED[@]}" -gt 0 || "${#ADDED[@]}" -gt 0 ]] && \
      SKILL_PATHS=$(printf "$SKILLS_DIR/%s " "${UPDATED[@]:-}" "${ADDED[@]:-}")
    [[ "${#UPDATED_RULES[@]}" -gt 0 || "${#ADDED_RULES[@]}" -gt 0 ]] && \
      RULE_PATHS=$(printf "$RULES_DIR/%s " "${UPDATED_RULES[@]:-}" "${ADDED_RULES[@]:-}")
    [[ "${#UPDATED_AGENTS[@]}" -gt 0 || "${#ADDED_AGENTS[@]}" -gt 0 ]] && \
      AGENT_PATHS=$(printf "$AGENTS_DIR/%s " "${UPDATED_AGENTS[@]:-}" "${ADDED_AGENTS[@]:-}")
    [[ "${#UPDATED_CMDS[@]}" -gt 0 || "${#ADDED_CMDS[@]}" -gt 0 ]] && \
      CMD_PATHS=$(printf "$COMMANDS_DIR/%s " "${UPDATED_CMDS[@]:-}" "${ADDED_CMDS[@]:-}")

    # shellcheck disable=SC2086
    git add $SKILL_PATHS $RULE_PATHS $AGENT_PATHS $CMD_PATHS 2>> "$LOG_FILE"
    git commit -m "chore: auto-update skills, rules, agents, and commands from upstream repos

$(printf 'Skills updated: %s\n' "${UPDATED[@]:-}")
$(printf 'Skills added: %s\n' "${ADDED[@]:-}")
$(printf 'Rules updated: %s\n' "${UPDATED_RULES[@]:-}")
$(printf 'Rules added: %s\n' "${ADDED_RULES[@]:-}")
$(printf 'Agents updated: %s\n' "${UPDATED_AGENTS[@]:-}")
$(printf 'Agents added: %s\n' "${ADDED_AGENTS[@]:-}")
$(printf 'Commands updated: %s\n' "${UPDATED_CMDS[@]:-}")
$(printf 'Commands added: %s\n' "${ADDED_CMDS[@]:-}")

Sources: obra/superpowers, nextlevelbuilder/ui-ux-pro-max-skill,
  thedotmack/claude-mem, czlonkowski/n8n-skills,
  kepano/obsidian-skills, gsd-build/get-shit-done,
  upstash/context7" 2>> "$LOG_FILE" \
      && log "Committed skill/rule/agent/command updates" \
      || log "Commit skipped (nothing to commit)"

    git push -u origin "$(git rev-parse --abbrev-ref HEAD)" 2>> "$LOG_FILE" && log "Pushed skill/rule/agent/command updates" || log "Push failed (will retry next session)"
  else
    log "Skills, rules, agents, and commands: all up to date"
  fi

  # Save timestamp regardless of whether updates were found
  echo "$NOW" > "$TIMESTAMP_FILE"
  log "Timestamp updated: $NOW"
fi

log "=== Session start complete ==="
