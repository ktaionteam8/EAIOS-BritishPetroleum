"""Alerts router."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_alerts():
    """Returns AI-prioritised active alerts."""
    # TODO: Replace with real DB query
    return []


@router.patch("/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Marks an alert as resolved."""
    # TODO: Implement
    return {"id": alert_id, "resolved": True}
