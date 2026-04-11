"""Digital Twin router."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/{equipment_id}")
async def get_digital_twin(equipment_id: str):
    """Returns real-time sensor readings and vibration history for a Digital Twin."""
    # TODO: Replace with real sensor data + DB query
    return {
        "equipment_id": equipment_id,
        "sensors": [],
        "vibration_history": [],
    }
