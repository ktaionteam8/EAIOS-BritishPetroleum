"""TAR (Turnaround) router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.database import get_db
from src.models.tar import TurnaroundEvent, TarTask, MaintenanceScheduleRecommendation
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/tar", tags=["tar"])


class TarEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tar_code: str
    site_id: str
    unit_name: str
    start_date: datetime
    end_date: datetime
    duration_days: int
    budget_usd: float
    actual_cost_usd: Optional[float]
    status: str
    work_scope_count: int
    created_at: datetime


class TarTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tar_id: str
    equipment_id: Optional[str]
    description: str
    estimated_hours: Optional[float]


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tar_id: str
    equipment_id: Optional[str]
    recommended_action: str
    recommended_window: str
    risk_level: str
    ai_confidence_pct: float
    status: str


@router.get("", response_model=list[TarEventOut])
async def list_tar_events(
    site_id: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TurnaroundEvent).order_by(TurnaroundEvent.start_date.asc())
    if site_id:
        stmt = stmt.where(TurnaroundEvent.site_id == site_id)
    if status:
        stmt = stmt.where(TurnaroundEvent.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{tar_id}/tasks", response_model=list[TarTaskOut])
async def list_tar_tasks(tar_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TarTask).where(TarTask.tar_id == tar_id))
    return result.scalars().all()


@router.get("/{tar_id}/recommendations", response_model=list[RecommendationOut])
async def list_recommendations(tar_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MaintenanceScheduleRecommendation)
        .where(MaintenanceScheduleRecommendation.tar_id == tar_id)
    )
    return result.scalars().all()
