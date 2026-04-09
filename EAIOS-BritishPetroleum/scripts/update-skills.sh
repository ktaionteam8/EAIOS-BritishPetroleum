#!/usr/bin/env bash
# update-skills.sh
#
# Fetches the latest skill files from upstream GitHub repos and updates
# .claude/skills/ in this project. Shows a diff of what changed and
# optionally commits the updates.
#
# Usage:
#   ./scripts/update-skills.sh           # fetch + show diff, prompt to commit
#   ./scripts/update-skills.sh --yes     # fetch + auto-commit without prompting
#   ./scripts/update-skills.sh --dry-run # show what would change, no writes

set -euo pipefail

# ── Config ─────────────────────────────────────────────────────────────────────

SKILLS_DIR=".claude/skills"
AUTO_COMMIT=false
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --yes)       AUTO_COMMIT=true ;;
    --dry-run)   DRY_RUN=true ;;
  esac
done

# ── Colour helpers ─────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}ℹ ${NC}$1"; }
success() { echo -e "${GREEN}✔ ${NC}$1"; }
warn()    { echo -e "${YELLOW}⚠ ${NC}$1"; }
changed() { echo -e "${YELLOW}~ ${NC}$1"; }
added()   { echo -e "${GREEN}+ ${NC}$1"; }

# ── Skill source map ───────────────────────────────────────────────────────────
# Format: "local-filename.md|remote-raw-url"
#
# Add new upstream sources here as you adopt more skill repos.

declare -a SKILL_SOURCES=(
  # ── obra/superpowers ────────────────────────────────────────────────────────
  "tdd.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/test-driven-development/SKILL.md"
  "systematic-debugging.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/systematic-debugging/SKILL.md"
  "brainstorming.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md"
  "writing-plans.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-plans/SKILL.md"
  "executing-plans.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/executing-plans/SKILL.md"
  "requesting-code-review.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/requesting-code-review/SKILL.md"
  "verification-before-completion.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/verification-before-completion/SKILL.md"
  "dispatching-parallel-agents.md|https://raw.githubusercontent.com/obra/superpowers/main/skills/dispatching-parallel-agents/SKILL.md"

  # ── nextlevelbuilder/ui-ux-pro-max-skill ────────────────────────────────────
  "ui-ux-pro-max.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/ui-ux-pro-max/SKILL.md"
  "ui-banner-design.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/banner-design/SKILL.md"
  "ui-brand.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/brand/SKILL.md"
  "ui-design-system.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/design-system/SKILL.md"
  "ui-design.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/design/SKILL.md"
  "ui-slides.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/slides/SKILL.md"
  "ui-styling.md|https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/ui-styling/SKILL.md"

  # ── thedotmack/claude-mem ───────────────────────────────────────────────────
  "mem-do.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/do/SKILL.md"
  "mem-knowledge-agent.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/knowledge-agent/SKILL.md"
  "mem-make-plan.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/make-plan/SKILL.md"
  "mem-search.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/mem-search/SKILL.md"
  "mem-smart-explore.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/smart-explore/SKILL.md"
  "mem-timeline-report.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/timeline-report/SKILL.md"
  "mem-version-bump.md|https://raw.githubusercontent.com/thedotmack/claude-mem/main/plugin/skills/version-bump/SKILL.md"

  # ── czlonkowski/n8n-skills ──────────────────────────────────────────────────
  "n8n-expression-syntax.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-expression-syntax/SKILL.md"
  "n8n-mcp-tools.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-mcp-tools-expert/SKILL.md"
  "n8n-workflow-patterns.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-workflow-patterns/SKILL.md"
  "n8n-validation.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-validation-expert/SKILL.md"
  "n8n-node-config.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-node-configuration/SKILL.md"
  "n8n-code-js.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-code-javascript/SKILL.md"
  "n8n-code-py.md|https://raw.githubusercontent.com/czlonkowski/n8n-skills/main/skills/n8n-code-python/SKILL.md"

  # ── kepano/obsidian-skills ──────────────────────────────────────────────────
  "obsidian-markdown.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/obsidian-markdown/SKILL.md"
  "obsidian-bases.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/obsidian-bases/SKILL.md"
  "json-canvas.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/json-canvas/SKILL.md"
  "obsidian-cli.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/obsidian-cli/SKILL.md"
  "defuddle.md|https://raw.githubusercontent.com/kepano/obsidian-skills/main/skills/defuddle/SKILL.md"

  # ── Add new sources here ─────────────────────────────────────────────────────
  # "skill-name.md|https://raw.githubusercontent.com/owner/repo/main/path/to/SKILL.md"
)

# ── Agent source map ──────────────────────────────────────────────────────────
# Upstream agents fetched into .claude/agents/
# NOTE: obra/superpowers code-reviewer → sp-code-reviewer.md (avoids overwriting
#   the project's local code-reviewer.md). GSD agents use gsd- prefix (no conflict).
# Format: "local-filename.md|remote-raw-url"

AGENTS_DIR=".claude/agents"
mkdir -p "$AGENTS_DIR"

declare -a AGENT_SOURCES=(
  # ── obra/superpowers ──────────────────────────────────────────────────────────
  "sp-code-reviewer.md|https://raw.githubusercontent.com/obra/superpowers/main/agents/code-reviewer.md"

  # ── gsd-build/get-shit-done ──────────────────────────────────────────────────
  "gsd-plan-checker.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-plan-checker.md"
  "gsd-verifier.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-verifier.md"
  "gsd-executor.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-executor.md"
  "gsd-planner.md|https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-planner.md"

  # ── Add new agent sources here ────────────────────────────────────────────────
  # "agent-name.md|https://raw.githubusercontent.com/owner/repo/main/agents/agent-name.md"
)

# ── GSD Command source map ─────────────────────────────────────────────────────
# gsd-build/get-shit-done — stored in .claude/commands/gsd/ (not skills/)
# Format: "local-filename.md|remote-raw-url"

COMMANDS_DIR=".claude/commands/gsd"
mkdir -p "$COMMANDS_DIR"

declare -a COMMAND_SOURCES=(
  # ── gsd-build/get-shit-done ──────────────────────────────────────────────────
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

# ── Check dependencies ─────────────────────────────────────────────────────────

if ! command -v curl &>/dev/null; then
  echo -e "${RED}Error: curl is required. Install it and try again.${NC}"
  exit 1
fi

# ── Fetch and compare: skills ──────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Checking upstream skills for updates...${NC}"
echo "Source repos:"
echo "  • https://github.com/obra/superpowers"
echo "  • https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"
echo "  • https://github.com/thedotmack/claude-mem"
echo "  • https://github.com/czlonkowski/n8n-skills"
echo "  • https://github.com/kepano/obsidian-skills"
echo "  • https://github.com/gsd-build/get-shit-done  (commands)"
echo ""

UPDATED=()
ADDED=()
FAILED=()
UNCHANGED=0
UPDATED_AGENTS=()
ADDED_AGENTS=()
FAILED_AGENTS=()
UNCHANGED_AGENTS=0
UPDATED_CMDS=()
ADDED_CMDS=()
FAILED_CMDS=()
UNCHANGED_CMDS=0

for entry in "${SKILL_SOURCES[@]}"; do
  LOCAL_FILE="${entry%%|*}"
  REMOTE_URL="${entry##*|}"
  LOCAL_PATH="$SKILLS_DIR/$LOCAL_FILE"

  # Fetch remote content
  HTTP_STATUS=$(curl -s -o /tmp/skill_update_tmp.md -w "%{http_code}" "$REMOTE_URL")

  if [[ "$HTTP_STATUS" != "200" ]]; then
    warn "Could not fetch $LOCAL_FILE (HTTP $HTTP_STATUS) — skipping"
    FAILED+=("$LOCAL_FILE")
    continue
  fi

  REMOTE_CONTENT=$(cat /tmp/skill_update_tmp.md)

  if [[ ! -f "$LOCAL_PATH" ]]; then
    added "$LOCAL_FILE — NEW skill from upstream"
    if [[ "$DRY_RUN" == "false" ]]; then
      echo "$REMOTE_CONTENT" > "$LOCAL_PATH"
    fi
    ADDED+=("$LOCAL_FILE")

  elif diff -q "$LOCAL_PATH" /tmp/skill_update_tmp.md &>/dev/null; then
    (( UNCHANGED++ )) || true

  else
    changed "$LOCAL_FILE — updated upstream"
    echo ""
    echo -e "${BOLD}  Diff for $LOCAL_FILE:${NC}"
    diff --unified=2 "$LOCAL_PATH" /tmp/skill_update_tmp.md \
      | sed 's/^+/  \x1b[32m+/; s/^-/  \x1b[31m-/; s/^/  /; s/$/\x1b[0m/' \
      || true
    echo ""
    if [[ "$DRY_RUN" == "false" ]]; then
      cp /tmp/skill_update_tmp.md "$LOCAL_PATH"
    fi
    UPDATED+=("$LOCAL_FILE")
  fi
done

# ── Fetch and compare: agents ─────────────────────────────────────────────────

echo -e "${BOLD}Checking upstream agents for updates...${NC}"

for entry in "${AGENT_SOURCES[@]}"; do
  LOCAL_FILE="${entry%%|*}"
  REMOTE_URL="${entry##*|}"
  LOCAL_PATH="$AGENTS_DIR/$LOCAL_FILE"

  HTTP_STATUS=$(curl -s -o /tmp/skill_update_tmp.md -w "%{http_code}" "$REMOTE_URL")

  if [[ "$HTTP_STATUS" != "200" ]]; then
    warn "Could not fetch agents/$LOCAL_FILE (HTTP $HTTP_STATUS) — skipping"
    FAILED_AGENTS+=("$LOCAL_FILE")
    continue
  fi

  REMOTE_CONTENT=$(cat /tmp/skill_update_tmp.md)

  if [[ ! -f "$LOCAL_PATH" ]]; then
    added "agents/$LOCAL_FILE — NEW agent from upstream"
    if [[ "$DRY_RUN" == "false" ]]; then
      echo "$REMOTE_CONTENT" > "$LOCAL_PATH"
    fi
    ADDED_AGENTS+=("$LOCAL_FILE")

  elif diff -q "$LOCAL_PATH" /tmp/skill_update_tmp.md &>/dev/null; then
    (( UNCHANGED_AGENTS++ )) || true

  else
    changed "agents/$LOCAL_FILE — updated upstream"
    if [[ "$DRY_RUN" == "false" ]]; then
      cp /tmp/skill_update_tmp.md "$LOCAL_PATH"
    fi
    UPDATED_AGENTS+=("$LOCAL_FILE")
  fi
done

# ── Fetch and compare: GSD commands ───────────────────────────────────────────

echo -e "${BOLD}Checking upstream GSD commands for updates...${NC}"

for entry in "${COMMAND_SOURCES[@]}"; do
  LOCAL_FILE="${entry%%|*}"
  REMOTE_URL="${entry##*|}"
  LOCAL_PATH="$COMMANDS_DIR/$LOCAL_FILE"

  HTTP_STATUS=$(curl -s -o /tmp/skill_update_tmp.md -w "%{http_code}" "$REMOTE_URL")

  if [[ "$HTTP_STATUS" != "200" ]]; then
    warn "Could not fetch commands/gsd/$LOCAL_FILE (HTTP $HTTP_STATUS) — skipping"
    FAILED_CMDS+=("$LOCAL_FILE")
    continue
  fi

  REMOTE_CONTENT=$(cat /tmp/skill_update_tmp.md)

  if [[ ! -f "$LOCAL_PATH" ]]; then
    added "commands/gsd/$LOCAL_FILE — NEW command from upstream"
    if [[ "$DRY_RUN" == "false" ]]; then
      echo "$REMOTE_CONTENT" > "$LOCAL_PATH"
    fi
    ADDED_CMDS+=("$LOCAL_FILE")

  elif diff -q "$LOCAL_PATH" /tmp/skill_update_tmp.md &>/dev/null; then
    (( UNCHANGED_CMDS++ )) || true

  else
    changed "commands/gsd/$LOCAL_FILE — updated upstream"
    if [[ "$DRY_RUN" == "false" ]]; then
      cp /tmp/skill_update_tmp.md "$LOCAL_PATH"
    fi
    UPDATED_CMDS+=("$LOCAL_FILE")
  fi
done

rm -f /tmp/skill_update_tmp.md

# ── Summary ───────────────────────────────────────────────────────────────────

TOTAL_FAILED=$(( ${#FAILED[@]} + ${#FAILED_AGENTS[@]} + ${#FAILED_CMDS[@]} ))

echo ""
echo -e "${BOLD}── Skills Summary ───────────────────────────${NC}"
echo "  Unchanged : $UNCHANGED"
echo "  Updated   : ${#UPDATED[@]}"
echo "  Added     : ${#ADDED[@]}"
echo "  Failed    : ${#FAILED[@]}"
echo ""
echo -e "${BOLD}── Agents Summary ───────────────────────────${NC}"
echo "  Unchanged : $UNCHANGED_AGENTS"
echo "  Updated   : ${#UPDATED_AGENTS[@]}"
echo "  Added     : ${#ADDED_AGENTS[@]}"
echo "  Failed    : ${#FAILED_AGENTS[@]}"
echo ""
echo -e "${BOLD}── Commands (GSD) Summary ───────────────────${NC}"
echo "  Unchanged : $UNCHANGED_CMDS"
echo "  Updated   : ${#UPDATED_CMDS[@]}"
echo "  Added     : ${#ADDED_CMDS[@]}"
echo "  Failed    : ${#FAILED_CMDS[@]}"
echo ""

if [[ "$TOTAL_FAILED" -gt 0 ]]; then
  [[ "${#FAILED[@]}" -gt 0 ]] && warn "Failed skills: ${FAILED[*]}"
  [[ "${#FAILED_AGENTS[@]}" -gt 0 ]] && warn "Failed agents: ${FAILED_AGENTS[*]}"
  [[ "${#FAILED_CMDS[@]}" -gt 0 ]] && warn "Failed commands: ${FAILED_CMDS[*]}"
  echo "  Check your internet connection or whether the upstream URLs have changed."
  echo "  Update SKILL_SOURCES / AGENT_SOURCES / COMMAND_SOURCES in scripts/update-skills.sh if a URL moved."
  echo ""
fi

if [[ "$DRY_RUN" == "true" ]]; then
  info "Dry run — no files were written."
  exit 0
fi

TOTAL_CHANGES=$(( ${#UPDATED[@]} + ${#ADDED[@]} + ${#UPDATED_AGENTS[@]} + ${#ADDED_AGENTS[@]} + ${#UPDATED_CMDS[@]} + ${#ADDED_CMDS[@]} ))

if [[ "$TOTAL_CHANGES" -eq 0 ]]; then
  success "All skills, agents, and commands are already up to date."
  exit 0
fi

# ── Commit ────────────────────────────────────────────────────────────────────

if [[ "$AUTO_COMMIT" == "true" ]]; then
  DO_COMMIT="y"
else
  echo -e "${BOLD}Commit these changes?${NC} [y/N] "
  read -r DO_COMMIT
fi

if [[ "${DO_COMMIT,,}" == "y" ]]; then
  SKILL_PATHS=""
  AGENT_PATHS=""
  CMD_PATHS=""
  [[ "${#UPDATED[@]}" -gt 0 || "${#ADDED[@]}" -gt 0 ]] && \
    SKILL_PATHS=$(printf "$SKILLS_DIR/%s " "${UPDATED[@]:-}" "${ADDED[@]:-}")
  [[ "${#UPDATED_AGENTS[@]}" -gt 0 || "${#ADDED_AGENTS[@]}" -gt 0 ]] && \
    AGENT_PATHS=$(printf "$AGENTS_DIR/%s " "${UPDATED_AGENTS[@]:-}" "${ADDED_AGENTS[@]:-}")
  [[ "${#UPDATED_CMDS[@]}" -gt 0 || "${#ADDED_CMDS[@]}" -gt 0 ]] && \
    CMD_PATHS=$(printf "$COMMANDS_DIR/%s " "${UPDATED_CMDS[@]:-}" "${ADDED_CMDS[@]:-}")

  # shellcheck disable=SC2086
  git add $SKILL_PATHS $AGENT_PATHS $CMD_PATHS

  COMMIT_MSG="chore: update skills, agents, and commands from upstream repos

$(printf '%s\n' "${UPDATED[@]/#/Skills updated: }")
$(printf '%s\n' "${ADDED[@]/#/Skills added: }")
$(printf '%s\n' "${UPDATED_AGENTS[@]/#/Agents updated: }")
$(printf '%s\n' "${ADDED_AGENTS[@]/#/Agents added: }")
$(printf '%s\n' "${UPDATED_CMDS[@]/#/Commands updated: }")
$(printf '%s\n' "${ADDED_CMDS[@]/#/Commands added: }")

Sources: obra/superpowers, nextlevelbuilder/ui-ux-pro-max-skill,
  thedotmack/claude-mem, czlonkowski/n8n-skills,
  kepano/obsidian-skills, gsd-build/get-shit-done"

  git commit -m "$COMMIT_MSG"
  git push -u origin "$(git rev-parse --abbrev-ref HEAD)"

  success "Committed and pushed skill, agent, and command updates."
else
  info "Changes saved locally but not committed. Run 'git add .claude/skills/ .claude/agents/ .claude/commands/gsd/' to stage manually."
fi
