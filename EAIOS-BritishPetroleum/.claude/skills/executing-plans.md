# Executing Plans

Implement a written plan task by task with verification checkpoints. Never skip steps. Never guess.

## Before Starting

1. Read the full plan from `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`
2. Raise any concerns or ambiguities **before** starting — not mid-execution
3. Confirm which execution mode: inline (this session) or subagent-driven

## Execution Rules

### For each task:
1. Mark the task as **IN PROGRESS** in the plan file
2. Follow the steps exactly as written — no improvising
3. Run the verification command — read the full output
4. Only mark **COMPLETE** when verification passes
5. Commit as specified in the task
6. Move to the next task

### Stop immediately when:
- A step produces unexpected output
- Verification fails and you don't know why
- Instructions are unclear or contradictory
- You've failed the same verification 3 times

When you stop: report what happened, what you tried, and what you need. Do NOT guess your way through.

## Checkpoint Reviews

After every 3 tasks (or after a major milestone), request a code review using the `requesting-code-review` skill before continuing.

Do NOT batch up 10 tasks and review at the end. Problems compound.

## Never Do This

- Start implementation on `main` or `master` without explicit permission
- Skip a verification step because "it's obviously fine"
- Combine two tasks into one to save time
- Modify the plan mid-execution without flagging it
- Mark a task complete without running its verification command

## Progress Tracking

Update the plan file as you go:
```markdown
## Task 1: Write failing test  ✅ COMPLETE
## Task 2: Implement endpoint  🔄 IN PROGRESS
## Task 3: Add caching         ⏳ PENDING
```

Commit the updated plan file with each task completion.

## Finishing

When all tasks are complete, run the full test suite:
```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test -- --watchAll=false
```

All tests must pass before declaring the plan complete. Then use `verification-before-completion` before reporting done to the user.
