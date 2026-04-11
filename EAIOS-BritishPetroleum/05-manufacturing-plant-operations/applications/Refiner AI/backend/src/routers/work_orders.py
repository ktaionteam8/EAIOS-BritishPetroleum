"""Work Orders router."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_work_orders():
    """Returns all work orders (AI-generated and manual)."""
    # TODO: Replace with real DB query
    return []


@router.post("/")
async def create_work_order(body: dict):
    """Creates a new work order."""
    # TODO: Implement with Pydantic schema validation
    return {}
