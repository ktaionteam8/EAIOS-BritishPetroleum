# Dispatching Parallel Agents

When you have 3+ independent problems, don't investigate sequentially. Dispatch one agent per problem domain and let them work concurrently.

## When to Use

Use parallel agents when:
- Multiple test files or subsystems are failing independently
- Each problem can be understood in isolation
- Problems don't share state or dependencies
- You need research done across different parts of the codebase simultaneously

Do NOT use when:
- Failures are interconnected (fixing one likely fixes another)
- Agents would need to write to the same files
- The full system context is required for each problem

## The Pattern

### Step 1 — Identify independence
Verify each problem has a distinct root cause. Look at the stack traces / error messages — do they point to the same module? If yes, they're likely connected. If different modules, likely independent.

### Step 2 — Create focused agent tasks
Each agent prompt must be:
- **Focused**: one clear problem domain only
- **Self-contained**: all context the agent needs is in the prompt
- **Bounded**: clear start and end state
- **Non-overlapping**: agents must not touch the same files

### Step 3 — Dispatch in parallel
Launch all agents simultaneously. Do not wait for one to finish before starting the next.

### Step 4 — Integrate results
- Review each agent's summary
- Verify fixes don't conflict
- Run the full test suite to confirm all problems resolved
- If agent fixes conflict, resolve manually

## Agent Prompt Template

```
You are investigating one specific problem in the EAIOS-BP codebase.

**Problem**: <exact error message or failing test>
**Scope**: Only look at these files: <list>
**Do NOT touch**: <list of files other agents are working on>

**Your task**:
1. Find the root cause of this specific problem
2. Fix it
3. Verify the fix with: <exact command>
4. Report: root cause found, fix applied, verification output

Context:
- Stack: FastAPI backend, React frontend, PostgreSQL, Redis, Airflow
- Branch: claude/eaios-bp-setup-371sm
- Rules: follow .claude/rules/ for your layer
```

## Example: 3 Failing Tests in Different Modules

```
Problem A: test_wells.py failing  → Agent 1 investigates backend/src/routers/wells.py
Problem B: WellList.test.tsx failing → Agent 2 investigates frontend/src/components/WellList
Problem C: DAG import error → Agent 3 investigates data-pipelines/ingestion/

All 3 agents run simultaneously → 3x faster than sequential
```

## After All Agents Complete

1. Read each agent's report
2. Run full test suite: `pytest tests/ -v && npm test -- --watchAll=false`
3. All must pass before continuing
4. Use `verification-before-completion` before reporting done
