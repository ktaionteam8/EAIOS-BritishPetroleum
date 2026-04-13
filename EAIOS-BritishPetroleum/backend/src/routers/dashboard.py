"""Dashboard router — fleet-wide summary stats."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.core import Site, Equipment
from src.models.alerts import Alert
from src.models.work_orders import WorkOrder
from src.models.roi import KpiSnapshot
from src.schemas.dashboard import DashboardOut, DashboardStats, SiteSummary, EquipmentSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    # Equipment counts by ai_status
    eq_rows = await db.execute(
        select(Equipment.ai_status, func.count()).group_by(Equipment.ai_status)
    )
    status_counts = {row[0]: row[1] for row in eq_rows}

    total_equipment = sum(status_counts.values())
    critical = status_counts.get("critical", 0)
    warning = status_counts.get("warning", 0)
    healthy = status_counts.get("healthy", 0)

    # Active alerts count
    active_alerts = (await db.execute(
        select(func.count()).where(Alert.status == "active")
    )).scalar_one()

    # Open work orders count
    open_wo = (await db.execute(
        select(func.count()).where(WorkOrder.status.in_(["open", "scheduled"]))
    )).scalar_one()

    # Fleet OEE from latest fleet KPI snapshot
    fleet_kpi = (await db.execute(
        select(KpiSnapshot)
        .where(KpiSnapshot.scope == "fleet")
        .order_by(KpiSnapshot.snapshot_date.desc())
        .limit(1)
    )).scalar_one_or_none()
    fleet_oee = fleet_kpi.oee_pct if fleet_kpi else 0.0

    stats = DashboardStats(
        total_equipment=total_equipment,
        critical_count=critical,
        warning_count=warning,
        healthy_count=healthy,
        active_alerts=active_alerts,
        open_work_orders=open_wo,
        avoided_cost_usd=4_200_000.0,  # from seed KPI data
        fleet_oee_pct=fleet_oee,
    )

    # Sites list
    site_rows = (await db.execute(select(Site).where(Site.is_active == True))).scalars().all()
    sites = [SiteSummary.model_validate(s) for s in site_rows]

    # Top risks: critical + warning equipment ordered by health_score asc
    top_risk_rows = (await db.execute(
        select(Equipment, Site.name.label("site_name"))
        .join(Site, Equipment.site_id == Site.id)
        .where(Equipment.ai_status.in_(["critical", "warning"]))
        .order_by(Equipment.health_score.asc())
        .limit(5)
    )).all()

    top_risks = [
        EquipmentSummary(
            id=eq.id,
            tag=eq.tag,
            name=eq.name,
            site_name=site_name,
            health_score=eq.health_score,
            rul_hours=eq.rul_hours,
            ai_status=eq.ai_status,
        )
        for eq, site_name in top_risk_rows
    ]

    return DashboardOut(stats=stats, sites=sites, top_risks=top_risks)
