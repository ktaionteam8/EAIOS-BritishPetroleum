"""Spare Parts router."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_spare_parts():
    """Returns spare parts inventory with stock levels."""
    # TODO: Replace with real DB query
    return []
