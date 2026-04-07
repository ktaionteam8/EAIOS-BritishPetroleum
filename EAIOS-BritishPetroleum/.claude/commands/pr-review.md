# PR Review

Run a full, structured review of a pull request using the code-reviewer agent.

## Usage
```
/pr-review <pr-number>
```

## Process

### 1. Fetch PR Context
- Get the PR title, description, and linked issue (if any)
- Read the PR diff in full — do not skip any file
- Note the PR's stated purpose and acceptance criteria

### 2. Understand the Change
Before judging code quality, understand intent:
- What problem does this PR solve?
- What approach did the author choose and why?
- Are there architectural decisions being made here?

### 3. Run the Code Reviewer Agent
Invoke the `code-reviewer` agent (`.claude/agents/code-reviewer.md`) on all changed files.

The review must cover:
- **Correctness** — does the code do what the PR description says it does?
- **Bugs** — logic errors, edge cases, unhandled errors, async pitfalls
- **Security** — see `.claude/agents/security-auditor.md` for the checklist
- **Performance** — N+1 queries, unnecessary re-renders, missing caching
- **Tests** — are there sufficient tests? Do they test behaviour, not implementation?
- **Style** — does it follow the rules in `.claude/rules/`?

### 4. Check the Rules
Cross-reference the change against the relevant rule files:
- Frontend changes: `.claude/rules/frontend.md`
- Backend / API changes: `.claude/rules/api.md`
- Database changes: `.claude/rules/database.md`

### 5. Compose the Review

Use this structure:

```markdown
## PR Review: #<number> — <title>

### Summary
One paragraph: what the PR does, overall quality verdict, and merge recommendation.

### Critical (must fix before merge)
- `path/to/file.py:42` — Description and suggested fix

### Warnings (should fix)
- `path/to/file.ts:17` — Description and suggested fix

### Suggestions (nice to have)
- `path/to/file.py:88` — Optional improvement

### Test Coverage
Assessment of test quality and completeness.

### Verdict
- [ ] Approved
- [ ] Approved with minor comments
- [x] Changes requested
```

### 6. Post the Review
Post the review as a comment on the PR using the GitHub MCP tools.

Be constructive: every criticism should include a concrete suggestion or example fix. Do not block a PR on style preferences — raise those as suggestions, not blockers.
