# Test-Driven Development (TDD)

Enforce the RED → GREEN → REFACTOR cycle. No production code without a failing test first.

## The Three-Phase Cycle

### RED — Write a failing test first
- Write a single test that demonstrates the desired behaviour
- Use real code, not mocks where possible
- **Run it and watch it FAIL** — this proves the test is meaningful
- If it passes immediately, the test is wrong. Fix it.

### GREEN — Write the minimum code to pass
- Implement the simplest solution that makes the test pass
- Nothing more — no extras, no "while I'm here" additions
- Run the test. It must pass.

### REFACTOR — Clean up while keeping tests green
- Eliminate duplication
- Improve naming and structure
- Run tests after every change — they must stay green

## The Absolute Rule

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

If you wrote code before its test:
1. Delete the code entirely
2. Write the test
3. Watch it fail
4. Rewrite the code

No exceptions. No "I'll just adapt this reference copy." Sunk cost is irrelevant.

## When to Apply

Use TDD for:
- All new features
- All bug fixes (write a test that reproduces the bug first)
- All refactoring (tests must exist before you touch structure)
- All behaviour changes

Only exception: explicit written approval from the team lead.

## For This Project

### Backend (pytest + pytest-asyncio)
```bash
# Run all tests
cd backend && pytest tests/ -v

# Run single test
pytest tests/test_wells.py::test_create_well_returns_201 -v

# Watch mode
pytest tests/ -v --tb=short -x
```

### Frontend (React Testing Library + Jest)
```bash
cd frontend && npm test -- --watchAll=false
cd frontend && npm test -- --watch   # watch mode
```

### TDD Cycle Commands
```bash
# Step 1: Write test, confirm it FAILS
pytest tests/test_wells.py::test_new_feature -v
# Expected: FAILED ✗

# Step 2: Write minimal code, confirm it PASSES
pytest tests/test_wells.py::test_new_feature -v
# Expected: PASSED ✓

# Step 3: Refactor, confirm still PASSES
pytest tests/ -v
# Expected: all PASSED ✓
```

## Common Rationalizations to Reject

| Excuse | Reality |
|---|---|
| "Tests written after still catch bugs" | Tests written after pass immediately — they prove nothing |
| "I'll add tests later" | Later never comes. The feature ships untested. |
| "It's just a small change" | Small untested changes cause production incidents |
| "I already spent time writing the code" | Sunk cost. Delete it. Start with the test. |
