# PR Gate — Full Review Cycle Before Merge to Main

Runs every quality agent across the entire codebase. All agents must pass before
you are offered the option to approve the PR and push to main.

## Usage
```
/pr-gate
```

Invoke this any time you want to merge to main, or it triggers automatically
when you use words like "merge to main", "create PR", "raise a pull request",
or "push to main".

---

## Gate Sequence

Run all 6 agents **in this order**. Each agent must complete before the next starts.
If any agent returns a CRITICAL finding, **STOP immediately** — report to the user
and do not proceed until the issue is resolved.

---

### Step 1 — Security Audit
**Agent:** `.claude/agents/security-auditor.md`

Scan the entire codebase for:
- Hardcoded secrets, API keys, tokens, passwords in any file
- SQL injection, XSS, command injection, path traversal vulnerabilities
- Insecure dependencies with known CVEs
- Auth/authorisation gaps (unprotected routes, missing guards)
- Sensitive data leaking in logs or error responses
- `.env` files accidentally committed

**STOP GATE:** Any CRITICAL security finding blocks the merge entirely.

---

### Step 2 — Code Review
**Agent:** `.claude/agents/code-reviewer.md`

Review all files changed since the last merge to main (`git diff main...HEAD`):
- Correctness — does every change do what it claims?
- Bugs — logic errors, unhandled edge cases, async/await pitfalls
- Performance — N+1 queries, unnecessary re-renders, missing indexes
- Rule compliance — cross-check `.claude/rules/frontend.md`, `api.md`, `database.md`
- TypeScript strict mode violations
- Python type safety and Pydantic schema correctness

**STOP GATE:** Any CRITICAL bug or rule violation blocks the merge.

---

### Step 3 — Debugging Verification
**Agent:** `.claude/agents/debugger.md`

Verify there are no unresolved errors in the codebase:
- Check for `TODO`, `FIXME`, `HACK`, `console.error`, unhandled promise rejections
- Verify all import paths resolve correctly
- Check for circular dependencies
- Confirm no dead code that could mask runtime errors
- Verify environment variable references exist in `.env.example`

**STOP GATE:** Any unresolved runtime error or broken import blocks the merge.

---

### Step 4 — Test Coverage
**Agent:** `.claude/agents/test-writer.md`

Assess test coverage across frontend and backend:
- Verify unit tests exist for all new functions and components
- Verify API endpoints have integration tests
- Check that tests cover both happy path and error cases
- Confirm no tests are skipped (`skip`, `xtest`, `pytest.mark.skip`)
- Flag any changed logic with zero test coverage

**STOP GATE:** Any changed code with zero test coverage is flagged as a WARNING
(does not block merge but must be acknowledged by the user).

---

### Step 5 — Code Quality & Refactor Check
**Agent:** `.claude/agents/refactorer.md`

Check structural quality of all changed code:
- Functions longer than 50 lines — flag for splitting
- Files longer than 800 lines — flag for splitting
- Duplicated logic (DRY violations)
- Magic numbers or hardcoded strings that should be constants
- Unnecessary complexity — simpler solution available
- Naming clarity

**STOP GATE:** No merge blockers from this agent — findings are WARNINGS only.

---

### Step 6 — Documentation Check
**Agent:** `.claude/agents/doc-writer.md`

Verify documentation is adequate:
- All new API endpoints documented (docstring or OpenAPI description)
- All new React components have prop descriptions where non-obvious
- `README.md` updated if setup steps, ports, or commands changed
- `CLAUDE.md` updated if new architecture decisions were made
- No broken links in documentation files

**STOP GATE:** No merge blockers — findings are WARNINGS only.

---

## Gate Result Report

After all 6 agents complete, produce this report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EAIOS-BP  PR Gate Report
  Branch: <current-branch> → main
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 1  Security Audit      ✅ PASSED  /  ❌ BLOCKED
  Step 2  Code Review         ✅ PASSED  /  ❌ BLOCKED
  Step 3  Debug Verification  ✅ PASSED  /  ❌ BLOCKED
  Step 4  Test Coverage       ✅ PASSED  /  ⚠️  WARNINGS
  Step 5  Code Quality        ✅ PASSED  /  ⚠️  WARNINGS
  Step 6  Documentation       ✅ PASSED  /  ⚠️  WARNINGS

  CRITICAL ISSUES (must fix):
  - <list any blockers>

  WARNINGS (acknowledge to proceed):
  - <list any warnings>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Approval Gate

**If all 6 steps PASSED (no CRITICAL issues):**

Present the user with this prompt:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  All checks passed. Ready to merge to main.

  Branch:  <current-branch>
  Commits: <n> commits ahead of main
  Files:   <n> files changed

  Do you approve this merge?
  → Type YES to create the PR and push to main
  → Type NO to cancel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If the user types YES:**
1. Push the current branch to origin: `git push -u origin <branch>`
2. Create the PR automatically using the `gh` CLI:

```bash
gh pr create \
  --repo ktaionteam8/eaios-britishpetroleum \
  --base main \
  --head <current-branch> \
  --title "<feat|fix|chore>: <description>" \
  --body "$(cat <<'EOF'
## Summary
<bullet points of what changed>

## PR Gate — Full Report
<paste the full gate report table here, all 6 steps with verdicts>

### Critical Issues Fixed
<list every CRITICAL finding that was fixed inline before this PR>

### Warnings (non-blocking)
<list all warnings from steps 4–6>

## Files Changed
<table of file → what changed>

## Test Plan
- [ ] <golden path test>
- [ ] <edge case test>
- [ ] App starts without error when .env is configured

https://claude.ai/code/session_018i7aoKEFEQudDTU4YALYNs
EOF
)"
```

3. If `gh` is not available or `GITHUB_TOKEN` is not set, display the full PR body in a code block so the user can paste it manually at `https://github.com/ktaionteam8/eaios-britishpetroleum/compare/<branch>`.
4. Report the PR URL once created.

**If the user types NO:**
- Cancel silently. No changes made.

**If any CRITICAL issues exist:**
- Do NOT show the approval prompt
- List every blocker clearly
- Tell the user: "Fix the issues above and run /pr-gate again"

---

## Auto-Trigger Rule

This gate runs automatically — without the user needing to type `/pr-gate` — whenever
the user says any of the following (or close variants):

- "merge to main"
- "create a PR"
- "raise a pull request"
- "push to main"
- "ship this"
- "ready to merge"
- "deploy to production"

In auto-trigger mode, follow the same sequence above exactly.
