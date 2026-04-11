"""Dashboard router — KPIs and refinery map."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/kpis")
async def get_dashboard_kpis():
    """Returns top-level KPI metrics for the dashboard."""
    # TODO: Replace with real DB queries via service layer
    return {
        "unplanned_events_avoided": 38.2,
        "target_reduction": 40.0,
        "equipment_monitored": 6842,
        "newly_onboarded": 312,
        "critical_alerts": 14,
        "critical_requiring_action": 4,
        "ai_model_accuracy": 94.7,
        "accuracy_change": 1.2,
    }


@router.get("/refineries")
async def get_refineries():
    """Returns all refineries with status for the global health map."""
    # TODO: Replace with real DB query
    return []
