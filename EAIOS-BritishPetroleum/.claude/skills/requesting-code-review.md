# Requesting Code Review

Review early. Review often. Never skip a review because a change "seems simple."

## When to Request a Review

**Mandatory triggers:**
- After completing any task in subagent-driven development
- After completing a batch of tasks in plan execution
- Before merging any branch to main
- When blocked and unsure how to proceed
- After a bug fix — confirm the fix doesn't introduce new issues

**Never skip for:**
- "It's just a small change"
- "I know this code well"
- "Tests are passing so it must be fine"

## How to Request

Dispatch the `code-reviewer` agent (`.claude/agents/code-reviewer.md`) with this context:

```
Review the changes since <git-sha-before> to <git-sha-after>.

Context:
- What this change does: <one sentence>
- Files changed: <list>
- Tests added: <yes/no, which ones>
- Any known concerns: <list or "none">

Apply the rules in:
- .claude/rules/api.md (if backend changes)
- .claude/rules/frontend.md (if frontend changes)
- .claude/rules/database.md (if model/migration changes)
```

## Responding to Feedback

### Critical issues (must fix before continuing)
- Stop current work immediately
- Fix the issue
- Re-run verification
- Request a follow-up review on the fix

### Warnings (should fix)
- Note them in `tasks/todo.md`
- Fix before the branch is merged
- Do not accumulate more than 3 unresolved warnings

### Suggestions (nice to have)
- Add to `tasks/todo.md` as future improvements
- Do not block current work

## When You Disagree With Feedback

Provide technical reasoning and code evidence. Do not reflexively argue. If after reasoning you still disagree, flag it to the user for a decision.

## Getting the Git SHAs

```bash
# SHA before your changes
git log --oneline main..HEAD | tail -1

# Current SHA
git rev-parse HEAD

# Diff of all changes
git diff main..HEAD
```
