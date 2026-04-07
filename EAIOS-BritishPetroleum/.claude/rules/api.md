# API Rules — FastAPI REST Design

Rules for all backend API code in `backend/src/`. Apply when designing routes, writing request/response schemas, and handling errors.

## Project Layout

```
backend/src/
  main.py               # app factory, middleware, router registration
  routers/              # one file per resource domain
    wells.py
    users.py
  services/             # business logic layer
    well_service.py
  models/               # SQLAlchemy ORM models (see database.md)
  schemas/              # Pydantic request/response schemas
    well.py
  middleware/
    cache.py            # Redis singleton
    auth.py             # JWT auth dependency
  dependencies.py       # shared FastAPI dependencies
```

## URL Design

- Use nouns, not verbs: `/wells` not `/getWells`
- Use plural nouns for collections: `/wells`, `/users`
- Nest resources only one level deep: `/wells/{well_id}/readings` — not deeper
- Use kebab-case for multi-word paths: `/sensor-readings` not `/sensor_readings`
- Never include the API version in individual route paths — use a router prefix: `/api/v1`

| Action | Method | Path |
|---|---|---|
| List | GET | `/wells` |
| Create | POST | `/wells` |
| Get one | GET | `/wells/{well_id}` |
| Update (full) | PUT | `/wells/{well_id}` |
| Update (partial) | PATCH | `/wells/{well_id}` |
| Delete | DELETE | `/wells/{well_id}` |

## Request / Response Schemas (Pydantic)

- Define separate schemas for create, update, and response — do not reuse the same model for all three
- Response schemas must exclude sensitive fields (passwords, internal IDs, raw tokens)
- Use `model_config = ConfigDict(from_attributes=True)` on response schemas to support ORM mode

```python
# schemas/well.py
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime

class WellCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    location: str

class WellUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    location: str | None = None

class WellResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    location: str
    is_active: bool
    created_at: datetime
```

## HTTP Status Codes

| Situation | Code |
|---|---|
| Successful GET or DELETE | 200 |
| Successful POST (resource created) | 201 |
| Successful async operation (no body) | 204 |
| Validation error (bad input) | 422 (FastAPI default) |
| Authentication required | 401 |
| Authenticated but not authorised | 403 |
| Resource not found | 404 |
| Conflict (duplicate, constraint violation) | 409 |
| Server error | 500 |

## Error Response Format

All error responses must use this consistent shape:

```json
{
  "detail": "Human-readable message describing the error",
  "code": "machine_readable_error_code",
  "field": "name_of_invalid_field_if_applicable"
}
```

Use FastAPI's `HTTPException`:
```python
from fastapi import HTTPException

raise HTTPException(
    status_code=404,
    detail={"detail": "Well not found", "code": "well_not_found"}
)
```

## Route Handlers

- Route handlers must be thin: validate input, call a service, return the response
- Business logic belongs in `src/services/`, not in route handlers
- Database calls belong in services or repository functions, not directly in routes
- Always use dependency injection for DB sessions, auth, and Redis

```python
# routers/wells.py
@router.get("/{well_id}", response_model=WellResponse)
async def get_well(
    well_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WellResponse:
    well = await well_service.get_by_id(db, well_id)
    if well is None:
        raise HTTPException(status_code=404, detail={"detail": "Well not found", "code": "well_not_found"})
    return well
```

## Pagination

All list endpoints that could return more than 20 items must support pagination:

```python
@router.get("/", response_model=PaginatedResponse[WellResponse])
async def list_wells(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    ...
```

Response envelope:
```json
{
  "items": [...],
  "total": 142,
  "page": 1,
  "page_size": 20,
  "pages": 8
}
```

## Caching

- Cache read-heavy endpoints with Redis; use TTLs appropriate to data freshness requirements
- Cache keys must be namespaced: `eaios:wells:{well_id}` not just `well_id`
- Always invalidate the cache when the underlying data changes (on write operations)
- Document the TTL and invalidation strategy in a comment next to the cache call

## Authentication

- Every route that accesses business data must have `current_user: User = Depends(get_current_user)`
- Public routes (login, health check) must be explicitly marked with a comment
- Never check auth inside the route body — use the dependency

## Do Not

- Do not return SQLAlchemy model objects directly — always go through a Pydantic response schema
- Do not use `response_model=None` unless the endpoint truly returns nothing
- Do not log request bodies or response bodies in production — they may contain sensitive data
- Do not silently swallow exceptions — either handle them properly or let them propagate to the global error handler
