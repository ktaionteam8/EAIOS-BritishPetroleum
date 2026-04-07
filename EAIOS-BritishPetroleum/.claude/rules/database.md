# Database Rules — PostgreSQL + SQLAlchemy

Rules for all database-related code: models, migrations, queries, and session management.

## Models

### File Layout
```
backend/src/models/
  __init__.py       # imports all models so Alembic can detect them
  database.py       # engine, session factory, Base, get_db()
  well.py           # one file per domain entity
  user.py
  ...
```

### Naming Conventions
- Table names: `snake_case`, plural noun — `wells`, `sensor_readings`, `users`
- Column names: `snake_case` — `created_at`, `well_id`, `operator_name`
- Primary key: always `id` (UUID or integer), never domain-specific like `well_code`
- Foreign key columns: `<referenced_table_singular>_id` — `well_id`, `user_id`
- Boolean columns: prefix with `is_` or `has_` — `is_active`, `has_alarm`
- Timestamp columns: `created_at`, `updated_at` — use `TIMESTAMPTZ` (timezone-aware)
- Junction/association tables: `<table_a>_<table_b>` alphabetically — `operator_well`

### Model Definition Rules
```python
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

class Well(Base):
    __tablename__ = "wells"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
```

- Use `Mapped[T]` + `mapped_column()` (SQLAlchemy 2.0 style) — not `Column()`
- Every table must have `created_at` and `updated_at`
- Use UUID primary keys for entities exposed via API, integer PKs only for internal/high-volume tables
- Define `__repr__` for every model to aid debugging

## Queries

### Always Use the ORM
- No raw SQL strings — use SQLAlchemy ORM or `text()` with bound parameters only
- Use `select()`, `insert()`, `update()`, `delete()` statements

```python
# Good
stmt = select(Well).where(Well.is_active == True).order_by(Well.created_at.desc())
result = await session.execute(stmt)
wells = result.scalars().all()

# Bad — never do this
result = await session.execute(text(f"SELECT * FROM wells WHERE id = {well_id}"))
```

### Session Rules
- Sessions are request-scoped: use `get_db()` dependency injection in every route
- Never share a session between requests or background tasks
- Never use `session.commit()` inside a repository function — let the route handler or service layer commit
- Always use `async with session.begin():` or commit/rollback explicitly

### Avoid N+1 Queries
- Use `selectinload()` or `joinedload()` when you know related objects will be accessed
- Never access a relationship attribute outside of the session scope that loaded it
- For bulk operations, use `insert().values(...)` not a loop of individual inserts

### Indexes
Add an index for every column that appears in:
- `WHERE` clauses in common queries
- `ORDER BY` clauses
- `JOIN` conditions (foreign keys are indexed automatically if defined with `ForeignKey`)
- Unique constraints

```python
name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
# Or for composite indexes:
__table_args__ = (Index("ix_well_status_region", "status", "region"),)
```

## Migrations (Alembic)

### Rules
- Every schema change must have a migration — never modify the DB directly
- Migration files are immutable once merged to main — create a new migration to fix a bad one
- Review auto-generated migrations before committing: Alembic sometimes misses renames or generates unnecessary drops
- Migration names must be descriptive: `add_is_active_to_wells` not `abc123`

### Workflow
```bash
# Generate a migration after changing models
alembic revision --autogenerate -m "add_is_active_to_wells"

# Review the generated file in alembic/versions/
# Then apply
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

### Destructive Migrations
Before any migration that drops a column or table in production:
1. Deploy the code change that stops writing to / reading from that column first
2. Wait one release cycle
3. Then drop the column in a second migration

## Do Not
- Do not use `session.execute(text(...))` with f-strings or `.format()` — SQL injection risk
- Do not call `Base.metadata.create_all()` in application code — use Alembic migrations
- Do not define models in `main.py` or route files — they belong in `src/models/`
- Do not load all columns with `SELECT *` when only a few columns are needed — use `.load_only()`
