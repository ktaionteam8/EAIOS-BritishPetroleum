# Deploy

Run all pre-deployment checks and deploy the application. Stops immediately if any check fails.

## Usage
```
/deploy [environment]
```
Environments: `staging` (default), `production`

## Pre-Deploy Checklist

### 1. Code Quality
- [ ] Run TypeScript type check: `cd frontend && npx tsc --noEmit`
- [ ] Run frontend lint: `cd frontend && npm run lint`
- [ ] Run Python type check: `cd backend && python -m mypy src/`
- [ ] Confirm no `console.log`, `print()`, or debug statements in changed files

### 2. Tests
- [ ] Run backend tests: `cd backend && pytest tests/ -v`
- [ ] Run frontend tests: `cd frontend && npm test -- --watchAll=false`
- [ ] Confirm test coverage has not dropped

### 3. Security
- [ ] Confirm `.env` is not committed (check `git status`)
- [ ] Verify `SECRET_KEY` is not the default `change-me` value
- [ ] Confirm CORS origins are locked down for the target environment
- [ ] Check no hardcoded credentials in recently changed files

### 4. Database
- [ ] Check for pending Alembic migrations: `alembic current` vs `alembic heads`
- [ ] If migrations exist, review them for destructive operations (DROP, TRUNCATE)
- [ ] Confirm a database backup exists before applying migrations to production

### 5. Dependencies
- [ ] Confirm `requirements.txt` is up to date with the running virtualenv
- [ ] Confirm `package.json` and `package-lock.json` are in sync

### 6. Docker
- [ ] Build images locally to catch build errors: `docker-compose build`
- [ ] Verify `docker-compose.yml` uses correct image tags for the target environment

## Deploy Steps

### Staging
```bash
docker-compose build
docker-compose up -d
# Apply migrations
docker-compose exec backend alembic upgrade head
# Smoke test
curl http://localhost:8000/health
```

### Production
**Stop.** Confirm with the team before deploying to production. Checklist above must be fully green.

```bash
# Pull latest
git pull origin main

# Build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Apply migrations (with backup confirmed)
docker-compose exec backend alembic upgrade head

# Deploy with zero-downtime rolling restart
docker-compose up -d --no-deps --scale backend=2 backend
docker-compose up -d --no-deps --scale frontend=2 frontend

# Verify health
curl https://<production-domain>/health
```

## Rollback
If anything goes wrong:
```bash
# Revert to previous image tag
docker-compose down
git checkout <previous-tag>
docker-compose up -d
# If migration was applied:
alembic downgrade -1
```

## Post-Deploy
- Monitor application logs for 5 minutes: `docker-compose logs -f backend`
- Check error rate in monitoring dashboard
- Verify key user flows manually
