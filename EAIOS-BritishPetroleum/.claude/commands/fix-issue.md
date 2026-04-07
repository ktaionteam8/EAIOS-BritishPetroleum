# Fix Issue

Fix a GitHub issue end-to-end: understand it, implement the solution, write tests, and prepare the change for review.

## Usage
```
/fix-issue <issue-number>
```

## Steps

### 1. Read the Issue
- Fetch the issue details from GitHub (title, description, labels, comments)
- Identify: is this a bug, a feature request, or a chore?
- Note any acceptance criteria or reproduction steps in the issue

### 2. Reproduce (for bugs)
- Follow the reproduction steps from the issue
- Confirm you can reproduce the failure before writing any code
- Document the actual vs expected behaviour

### 3. Understand the Codebase
- Locate all files relevant to the issue using `Grep` and `Glob`
- Read the relevant code — do not guess at structure
- Identify the root cause (for bugs) or the best integration point (for features)

### 4. Implement
- Make the minimal change that resolves the issue
- Follow the rules in `.claude/rules/` for the affected layer (frontend/backend/api)
- Do not refactor unrelated code in the same change
- Keep changes focused: one logical change per commit

### 5. Write Tests
- Add or update tests that cover the fix or new behaviour
- Use the test patterns defined in `.claude/agents/test-writer.md`
- Ensure all existing tests still pass

### 6. Self-Review
- Run the code-reviewer agent mentally: check for bugs, security issues, performance problems
- Confirm the change matches the acceptance criteria in the issue

### 7. Commit
- Stage only the files relevant to the fix
- Write a descriptive commit message:
  ```
  fix: <short description> (fixes #<issue-number>)

  <longer explanation of what changed and why>
  ```

### 8. Summary
Report back:
- What the root cause was (for bugs) or what was built (for features)
- Files changed and why
- Tests added
- Any edge cases or follow-up issues to be aware of
