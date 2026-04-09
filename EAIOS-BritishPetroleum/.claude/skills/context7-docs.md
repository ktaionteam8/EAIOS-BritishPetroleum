---
name: context7-docs
description: Use Context7 to fetch up-to-date library documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service. Activates on questions about React, FastAPI, SQLAlchemy, Airflow, Redis, Docker, TypeScript, or any other library used in this project.
---

# Context7 — Live Library Documentation

Fetches current, version-specific documentation straight from the source using the `ctx7` CLI.
Never rely on training data for library APIs — it may be outdated.

## When to Use

**USE for:**
- API syntax, method signatures, configuration options
- Version migration guides (e.g. "SQLAlchemy 2.0 async session API")
- Library-specific debugging and error resolution
- Setup and installation instructions
- CLI tool usage (e.g. Airflow, Alembic, Docker Compose)

**DO NOT use for:**
- Refactoring existing code
- Writing scripts from scratch
- Debugging business logic
- Code review or general programming concepts

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<user's question>"` — use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "FastAPI" not "fastapi")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<user's question>"`
4. Answer using the fetched documentation

## EAIOS-BP Library IDs (pre-resolved for this project)

| Library | Context7 ID | Notes |
|---|---|---|
| FastAPI | `/tiangolo/fastapi` | Backend framework |
| SQLAlchemy | `/sqlalchemy/sqlalchemy` | Use version-specific: `/sqlalchemy/sqlalchemy/v2.0` |
| Pydantic | `/pydantic/pydantic` | Use v2: `/pydantic/pydantic/v2` |
| Apache Airflow | `/apache/airflow` | Pipeline orchestration |
| React | `/facebook/react` | Frontend framework |
| TypeScript | `/microsoft/typescript` | |
| Redis | `/redis/redis-py` | Python client |
| Alembic | `/sqlalchemy/alembic` | DB migrations |
| Docker Compose | `/docker/compose` | |

## Version-Specific Docs

```bash
# Get docs for a specific version
npx ctx7@latest docs /sqlalchemy/sqlalchemy/v2.0 "async session with get_db dependency"
npx ctx7@latest docs /pydantic/pydantic/v2 "model_config ConfigDict from_attributes"
npx ctx7@latest docs /tiangolo/fastapi "dependency injection with Depends"
```

## Quota

Free tier works without login. If you hit quota limits:
```bash
npx ctx7@latest login   # OAuth login for higher limits
# Or set CONTEXT7_API_KEY env var
```
