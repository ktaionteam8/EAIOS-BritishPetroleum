"""ROI + KPI router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.roi import KpiSnapshot, RoiContribution, BudgetActual, CostSavingEvent
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/api/roi", tags=["roi"])


class KpiSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    site_id: Optional[str]
    scope: str
    snapshot_date: datetime
    mtbf_hours: Optional[float]
    mttr_hours: Optional[float]
    oee_pct: Optional[float]


class CostSavingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    site_id: Optional[str]
    event_date: datetime
    saving_usd: float
    category: str
    description: Optional[str]


@router.get("/kpis", response_model=list[KpiSnapshotOut])
async def list_kpis(
    scope: str | None = Query(None, description="fleet|site"),
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(KpiSnapshot).order_by(KpiSnapshot.snapshot_date.desc())
    if scope:
        stmt = stmt.where(KpiSnapshot.scope == scope)
    if site_id:
        stmt = stmt.where(KpiSnapshot.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/cost-savings", response_model=list[CostSavingOut])
async def list_cost_savings(
    site_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(CostSavingEvent).order_by(CostSavingEvent.event_date.desc()).limit(limit)
    if site_id:
        stmt = stmt.where(CostSavingEvent.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()
