# Writing Plans

Create comprehensive, step-by-step implementation plans before writing any code.

## Core Principle

Write plans assuming the engineer executing them has **zero context**. Every step must be self-contained, concrete, and verifiable.

## Plan Structure

Save plans to:
```
docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md
```

### Header (required)
```markdown
# Plan: <Feature Name>
**Date**: YYYY-MM-DD
**Goal**: One sentence describing what this plan achieves
**Architecture**: Which layers are touched (frontend / backend / DB / Airflow)
**Tech stack**: Relevant technologies for this plan
**Estimated tasks**: N tasks, each 2–5 minutes
```

### Task Format (required for every task)
```markdown
## Task N: <Task Title>

**Goal**: What this task achieves in one sentence.

**Files**:
- `path/to/file.py` — what changes

**Steps**:
1. [Exact step with complete code block]
2. [Exact step with complete code block]

**Verification**:
```bash
# Exact command to verify this task is complete
pytest tests/test_foo.py::test_bar -v
```

**Commit**:
```bash
git add path/to/file.py
git commit -m "feat: description of what this task did"
```
```

## No Placeholder Rule

Plans must NEVER contain:
- "Add appropriate error handling"
- "Implement similar to Task N"
- "TBD"
- "Handle edge cases"
- Vague instructions without exact code

Every step must have the **actual code** to write, the **actual command** to run, and the **actual output** to expect.

## Task Sizing

- Each task: 2–5 minutes of work
- If a task takes longer, split it
- Each task must be independently committable
- Follow TDD: test task → implementation task → refactor task

## TDD Task Pattern

For every feature, tasks follow this pattern:
```
Task 1: Write failing test for <feature>
Task 2: Implement <feature> to pass the test
Task 3: Refactor <feature> (optional, if needed)
Task 4: Commit
```

## Self-Review Checklist

Before presenting the plan:
- [ ] Every task has exact file paths (no "create a file somewhere")
- [ ] Every task has complete code blocks (no "something like this")
- [ ] Every task has a verification command
- [ ] Every task ends with a commit
- [ ] No placeholder language anywhere
- [ ] Tasks follow TDD order (test before implementation)
- [ ] Types are consistent across tasks

## Execution Options

After plan is written, offer two paths:

**Option A — Subagent-driven** (recommended for complex plans)
Each task runs in a fresh subagent with code review between tasks. Higher quality, slightly slower.

**Option B — Inline execution**
Execute tasks in this session using the `executing-plans` skill with checkpoint reviews.

Ask the user which they prefer before starting.
