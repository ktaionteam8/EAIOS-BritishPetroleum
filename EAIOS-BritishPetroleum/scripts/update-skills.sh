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

  # ── Add new sources here ─────────────────────────────────────────────────────
  # "skill-name.md|https://raw.githubusercontent.com/owner/repo/main/path/to/SKILL.md"
)

# ── Check dependencies ─────────────────────────────────────────────────────────

if ! command -v curl &>/dev/null; then
  echo -e "${RED}Error: curl is required. Install it and try again.${NC}"
  exit 1
fi

# ── Fetch and compare ─────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Checking upstream skills for updates...${NC}"
echo "Source repos:"
echo "  • https://github.com/obra/superpowers"
echo ""

UPDATED=()
ADDED=()
FAILED=()
UNCHANGED=0

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
    # New skill — doesn't exist locally yet
    added "$LOCAL_FILE — NEW skill from upstream"
    if [[ "$DRY_RUN" == "false" ]]; then
      echo "$REMOTE_CONTENT" > "$LOCAL_PATH"
    fi
    ADDED+=("$LOCAL_FILE")

  elif diff -q "$LOCAL_PATH" /tmp/skill_update_tmp.md &>/dev/null; then
    # No change
    (( UNCHANGED++ )) || true

  else
    # Changed — show the diff
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

rm -f /tmp/skill_update_tmp.md

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}── Summary ──────────────────────────────────${NC}"
echo "  Unchanged : $UNCHANGED"
echo "  Updated   : ${#UPDATED[@]}"
echo "  Added     : ${#ADDED[@]}"
echo "  Failed    : ${#FAILED[@]}"
echo ""

if [[ "${#FAILED[@]}" -gt 0 ]]; then
  warn "Failed to fetch: ${FAILED[*]}"
  echo "  Check your internet connection or whether the upstream URLs have changed."
  echo "  Update SKILL_SOURCES in scripts/update-skills.sh if a URL moved."
  echo ""
fi

if [[ "$DRY_RUN" == "true" ]]; then
  info "Dry run — no files were written."
  exit 0
fi

if [[ "${#UPDATED[@]}" -eq 0 && "${#ADDED[@]}" -eq 0 ]]; then
  success "All skills are already up to date."
  exit 0
fi

# ── Commit ────────────────────────────────────────────────────────────────────

ALL_CHANGED=("${UPDATED[@]}" "${ADDED[@]}")
FILES_LIST=$(printf "  - %s\n" "${ALL_CHANGED[@]}")

if [[ "$AUTO_COMMIT" == "true" ]]; then
  DO_COMMIT="y"
else
  echo -e "${BOLD}Commit these changes?${NC} [y/N] "
  read -r DO_COMMIT
fi

if [[ "${DO_COMMIT,,}" == "y" ]]; then
  CHANGED_PATHS=$(printf "$SKILLS_DIR/%s " "${ALL_CHANGED[@]}")

  git add $CHANGED_PATHS

  COMMIT_MSG="chore: update skills from upstream repos

$(printf '%s\n' "${UPDATED[@]/#/Updated: }")
$(printf '%s\n' "${ADDED[@]/#/Added: }")

Sources: obra/superpowers"

  git commit -m "$COMMIT_MSG"
  git push -u origin "$(git rev-parse --abbrev-ref HEAD)"

  success "Committed and pushed skill updates."
else
  info "Changes saved locally but not committed. Run 'git add .claude/skills/' to stage manually."
fi
