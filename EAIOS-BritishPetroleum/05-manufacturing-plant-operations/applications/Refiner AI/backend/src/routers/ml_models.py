"""ML Models router."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_ml_models():
    """Returns the ML model registry with performance metrics."""
    # TODO: Replace with real DB query
    return []
