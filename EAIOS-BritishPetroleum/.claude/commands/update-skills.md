# Update Skills

Fetch the latest skill files from all upstream GitHub repos and update `.claude/skills/` in this project.

## Usage
```
/update-skills
```

## What it does

1. Fetches each skill file from its upstream raw GitHub URL
2. Diffs the remote version against the local version
3. Shows exactly what changed (added lines, removed lines)
4. Prompts to commit and push the updates

## How to run

```bash
# Interactive — shows diff, asks before committing
./scripts/update-skills.sh

# Auto-commit — no prompts (good for CI)
./scripts/update-skills.sh --yes

# Dry run — shows what would change, writes nothing
./scripts/update-skills.sh --dry-run
```

## Upstream Sources

All sources are configured in `scripts/update-skills.sh` under `SKILL_SOURCES`.

Current sources:
| Skill file | Upstream repo |
|---|---|
| `tdd.md` | `obra/superpowers` |
| `systematic-debugging.md` | `obra/superpowers` |
| `brainstorming.md` | `obra/superpowers` |
| `writing-plans.md` | `obra/superpowers` |
| `executing-plans.md` | `obra/superpowers` |
| `requesting-code-review.md` | `obra/superpowers` |
| `verification-before-completion.md` | `obra/superpowers` |
| `dispatching-parallel-agents.md` | `obra/superpowers` |

## Adding a New Upstream Skill

To track a skill from a new repo, add one line to `SKILL_SOURCES` in `scripts/update-skills.sh`:

```bash
"local-name.md|https://raw.githubusercontent.com/owner/repo/main/skills/skill-name/SKILL.md"
```

Then run `/update-skills` — it will detect the new file and add it automatically.

## Recommended Cadence

- **Monthly**: Run `/update-skills` to pull upstream improvements
- **Before a major feature**: Ensure you have the latest planning and TDD skills
- **After adding a new skill source**: Run immediately to pull it in

## If a URL Changes

If an upstream repo renames or moves a skill file, the script will warn you:
```
⚠ Could not fetch tdd.md (HTTP 404) — skipping
```

Update the URL in `scripts/update-skills.sh` → `SKILL_SOURCES` and re-run.
