# Verification Before Completion

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

Never say "it's done", "tests pass", or "the bug is fixed" without running the verification command right now and reading the full output.

## The Five Steps (non-negotiable)

1. **Identify** the command that proves the claim
2. **Execute** it freshly — not a previous run, not a cached result
3. **Read** the full output — exit code, every line
4. **Verify** the output actually confirms what you're claiming
5. **Then** state the result with evidence

## What "Fresh" Means

- Run the command in this session, right now
- Not: "I ran it earlier and it passed"
- Not: "The previous agent said it passed"
- Not: "It should pass based on the code"

## Verification Commands for This Project

### Backend tests passing
```bash
cd backend && pytest tests/ -v
# Must show: X passed, 0 failed, 0 errors
```

### Frontend tests passing
```bash
cd frontend && npm test -- --watchAll=false
# Must show: Tests: X passed
```

### API responding
```bash
curl -s http://localhost:8000/health
# Must return: {"status": "ok"}
```

### TypeScript clean
```bash
cd frontend && npx tsc --noEmit
# Must return: (no output, exit code 0)
```

### No lint errors
```bash
cd frontend && npm run lint
cd backend && ruff check src/
# Both must return: (no output, exit code 0)
```

### Docker stack healthy
```bash
docker-compose ps
# All services must show: Up
```

## Red Flag Language — Never Use These

| Don't say | Why |
|---|---|
| "Should be passing" | Should ≠ is. Run it. |
| "Probably works" | Probably ≠ verified. Run it. |
| "Seems fine" | Seems ≠ confirmed. Run it. |
| "Tests were passing earlier" | Earlier ≠ now. Run it. |
| "Looks good to me" | Looks ≠ verified. Run it. |

## After Verification

State results with evidence:
```
✓ Backend tests: 23 passed, 0 failed (pytest output attached)
✓ TypeScript: clean (tsc --noEmit returned exit 0)
✓ API health: {"status": "ok"}
```

Only then say the work is complete.
