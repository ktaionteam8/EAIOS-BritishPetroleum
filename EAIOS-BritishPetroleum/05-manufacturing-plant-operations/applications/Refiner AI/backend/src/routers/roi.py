"""ROI Analytics router."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_roi_metrics():
    """Returns ROI and downtime reduction analytics."""
    # TODO: Replace with real DB query
    return {
        "annual_savings": 42_000_000,
        "downtime_reduction": 38.2,
        "target_downtime_reduction": 40.0,
        "prevented_failures": 287,
        "monthly_trend": [],
    }
