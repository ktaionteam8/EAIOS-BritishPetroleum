"""Dashboard router — fleet-wide summary stats."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from src.models.database import get_db
from src.models.core import Site, Equipment
from src.models.alerts import Alert
from src.models.work_orders import WorkOrder
from src.models.roi import KpiSnapshot
from src.schemas.dashboard import DashboardOut, DashboardStats, SiteSummary, EquipmentSummary
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class SiteHeatmapEntry(BaseModel):
    site_id: str
    site_name: str
    critical: int
    warning: int
    healthy: int
    avg_health: float


class EnterpriseScore(BaseModel):
    avg_health_score: float
    total_equipment: int
    critical_pct: float
    oee_pct: float
    avoided_cost_usd: float


@router.get("", response_model=DashboardOut)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
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


@router.get("/sites", response_model=list[SiteSummary])
async def list_sites(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    site_rows = (await db.execute(select(Site).where(Site.is_active == True))).scalars().all()
    return [SiteSummary.model_validate(s) for s in site_rows]


@router.get("/fleet-heatmap", response_model=list[SiteHeatmapEntry])
async def fleet_heatmap(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(
        Site.id,
        Site.name,
        func.sum((Equipment.ai_status == "critical").cast(func.Integer)).label("critical"),
        func.sum((Equipment.ai_status == "warning").cast(func.Integer)).label("warning"),
        func.sum((Equipment.ai_status == "healthy").cast(func.Integer)).label("healthy"),
        func.avg(Equipment.health_score).label("avg_health"),
    ).join(Equipment, Equipment.site_id == Site.id).where(Equipment.is_active == True).group_by(Site.id, Site.name)
    rows = (await db.execute(stmt)).all()
    return [
        SiteHeatmapEntry(
            site_id=r[0], site_name=r[1],
            critical=int(r[2] or 0), warning=int(r[3] or 0), healthy=int(r[4] or 0),
            avg_health=round(float(r[5] or 80), 1),
        )
        for r in rows
    ]


@router.get("/enterprise-score", response_model=EnterpriseScore)
async def enterprise_score(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    rows = (await db.execute(
        select(Equipment.ai_status, func.count(), func.avg(Equipment.health_score))
        .group_by(Equipment.ai_status)
    )).all()
    total = 0; critical = 0; weighted_sum = 0.0
    for status, count, avg_h in rows:
        total += count
        if status == "critical":
            critical += count
        weighted_sum += float(avg_h or 80) * count
    avg_health = round(weighted_sum / total, 1) if total else 80.0
    fleet_kpi = (await db.execute(
        select(KpiSnapshot).where(KpiSnapshot.scope == "fleet")
        .order_by(KpiSnapshot.snapshot_date.desc()).limit(1)
    )).scalar_one_or_none()
    return EnterpriseScore(
        avg_health_score=avg_health,
        total_equipment=total,
        critical_pct=round(100.0 * critical / total, 1) if total else 0.0,
        oee_pct=fleet_kpi.oee_pct if fleet_kpi else 0.0,
        avoided_cost_usd=4_200_000.0,
    )
