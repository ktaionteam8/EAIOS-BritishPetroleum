"""Equipment Health router."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_equipment():
    """Returns all equipment with health scores and AI status."""
    # TODO: Replace with real DB query
    return []


@router.get("/{equipment_id}")
async def get_equipment(equipment_id: str):
    """Returns a single equipment record."""
    # TODO: Replace with real DB query
    return {}
