---
name: fetch-github-repo
description: Fetch and integrate an external GitHub repository into EAIOS-BritishPetroleum. Auto-triggers when a GitHub URL appears in a prompt. Saves URL to persistent memory in CLAUDE.md and schedules weekly auto-updates via the session-start hook.
argument-hint: "<https://github.com/owner/repo.git>"
---

# /fetch-github-repo

Integrates an external GitHub repository into the EAIOS-BritishPetroleum codebase.
Weekly re-fetch is handled automatically by `.claude/hooks/session-start.sh` (7-day threshold).

## Auto-Trigger Rule

**Whenever a GitHub URL matching `https://github.com/<owner>/<repo>` appears in a user prompt,
automatically execute this workflow without waiting to be asked.**

If the repo is already in the Registered Repositories list in CLAUDE.md, skip to Step 6 (re-fetch only).

---

## Workflow

### Step 1 — Parse and Validate

Extract `<owner>/<repo>` from `$ARGUMENTS`. Strip `.git` suffix if present.
Determine the default branch by checking (in order): `main`, `master`.

```bash
REPO_URL="$ARGUMENTS"
OWNER_REPO=$(echo "$REPO_URL" | sed 's|https://github.com/||; s|\.git$||')
RAW_BASE="https://raw.githubusercontent.com/$OWNER_REPO"
```

Try `$RAW_BASE/main/README.md` — if 404, try `/master/README.md`.
If both fail, report error and stop.

### Step 2 — Explore Repository Structure

Fetch and read the README to understand the repo's purpose and component layout.

Then probe for each component type using curl (check HTTP status):

**Skills** — try these path patterns in order:
- `skills/*/SKILL.md`
- `.claude/skills/*/SKILL.md`
- `plugin/skills/*/SKILL.md`
- `src/skills/*/SKILL.md`

To discover skill folder names, read the README for mentions of skill names, then try fetching them directly. The README typically lists all skills.

**Agents** — try:
- `agents/*.md`
- `.claude/agents/*.md`
- `src/agents/*.md`

**Commands** — try:
- `commands/**/*.md`
- `.claude/commands/**/*.md`
- `src/commands/*.md`

**Hooks** — try:
- `hooks/*.sh`
- `.claude/hooks/*.sh`

**Token optimization / other utilities** — look for files mentioning "token", "context", "optimization" in the README.

### Step 3 — Integrate Components

#### 3a. Skills → `.claude/skills/`

For each confirmed skill URL (HTTP 200):

1. Determine a local filename: use `<repo-prefix>-<skill-name>.md` to avoid conflicts.
   - Exception: if the skill has a globally unique name (e.g. `obsidian-markdown`), use as-is.
2. Fetch and save to `.claude/skills/<local-name>.md`.
3. Add to `SKILL_SOURCES` in **both**:
   - `.claude/hooks/session-start.sh` (inside the `declare -a SKILL_SOURCES=( ... )` block)
   - `scripts/update-skills.sh` (inside its `declare -a SKILL_SOURCES=( ... )` block)

   Format: `"<local-name>.md|<raw-githubusercontent-url>"`

   Add a comment block `# ── <owner>/<repo> ────` before the entries if it's a new repo.

#### 3b. Agents → `.claude/agents/`

For each confirmed agent URL (HTTP 200):

1. Use `<repo-prefix>-<agent-name>.md` if there's a naming conflict with existing local agents
   (existing locals: `code-reviewer`, `debugger`, `test-writer`, `refactorer`, `doc-writer`, `security-auditor`).
2. Fetch and save to `.claude/agents/<local-name>.md`.
3. Add to `AGENT_SOURCES` in both script files.

#### 3c. Commands → `.claude/commands/<repo-name>/`

For each confirmed command URL (HTTP 200):

1. Create directory `.claude/commands/<repo-name>/` if it doesn't exist.
2. Fetch and save each command file there.
3. Add to `COMMAND_SOURCES` in both script files.

#### 3d. Backend Integration (if applicable)

If the repo contains Python utilities, algorithms, or SDK wrappers:
- Copy relevant source files to `backend/src/skills/`, `backend/src/agents/`, or `backend/src/commands/` as appropriate.
- Scan for `requirements.txt` or `pyproject.toml` in the repo; merge new dependencies into `backend/requirements.txt`.

If the repo contains JavaScript/TypeScript utilities:
- Copy to `frontend/src/` as appropriate.
- Merge new dependencies into `frontend/package.json`.

### Step 4 — Update Memory

#### 4a. Update CLAUDE.md — Registered External Repositories

Find the table under `## /fetch-github-repo — Registered External Repositories` in CLAUDE.md.
Add a new row (or update an existing row if the repo is already registered):

```
| owner/repo | https://github.com/owner/repo | YYYY-MM-DD | YYYY-MM-DD |
```

Columns: Repo | URL | Date Added | Last Fetched

#### 4b. Script files already updated in Step 3 — no additional action needed.

### Step 5 — Commit and Push

```bash
git add .claude/skills/ .claude/agents/ .claude/commands/ .claude/hooks/session-start.sh \
        scripts/update-skills.sh CLAUDE.md backend/ frontend/ 2>/dev/null || true
git commit -m "feat: integrated external repo: <owner>/<repo> on $(date +%Y-%m-%d)"
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
```

### Step 6 — Confirm

Report back to the user:
- Repository name and URL
- Components found: X skills, X agents, X commands, X hooks
- Files added/updated in `.claude/` and `backend/`
- Confirmation: "Weekly auto-update scheduled via session-start hook (runs every 7 days)"
- Next steps if any manual action is needed

---

## Notes

- **Weekly re-fetch**: Once a repo is added to `SKILL_SOURCES` / `AGENT_SOURCES` / `COMMAND_SOURCES`, the `session-start.sh` hook automatically re-fetches it on every session start that's more than 7 days after the last update. No additional scheduling is needed.
- **Conflict avoidance**: Never overwrite existing local agents (`code-reviewer.md`, `debugger.md`, `test-writer.md`, `refactorer.md`, `doc-writer.md`, `security-auditor.md`). Always prefix upstream versions.
- **hesreallyhim/awesome-claude-code**: This is a curated index (no skill/agent files). Skip it.
