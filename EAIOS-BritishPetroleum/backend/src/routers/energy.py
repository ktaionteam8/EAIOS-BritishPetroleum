"""Energy router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.energy import EnergyReading, EnergyTarget, EnergySavingEvent
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/energy", tags=["energy"])


class EnergyReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    site_id: str
    reading_date: datetime
    total_energy_gj: float
    throughput_tonnes: float
    energy_intensity_gj_per_t: float
    co2_tonnes: Optional[float]


class EnergyTargetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    site_id: str
    fiscal_year: int
    target_gj_per_t: float
    target_co2_per_t: Optional[float]


class EnergySavingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    site_id: str
    event_date: datetime
    cost_avoided_usd: float
    source: str
    description: Optional[str]


@router.get("/readings", response_model=list[EnergyReadingOut])
async def list_readings(
    site_id: str | None = Query(None),
    limit: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(EnergyReading).order_by(EnergyReading.reading_date.desc()).limit(limit)
    if site_id:
        stmt = stmt.where(EnergyReading.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/targets", response_model=list[EnergyTargetOut])
async def list_targets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnergyTarget).order_by(EnergyTarget.fiscal_year.desc()))
    return result.scalars().all()


@router.get("/savings", response_model=list[EnergySavingOut])
async def list_savings(
    site_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(EnergySavingEvent).order_by(EnergySavingEvent.event_date.desc()).limit(limit)
    if site_id:
        stmt = stmt.where(EnergySavingEvent.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()
