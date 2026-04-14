"""Offshore router — platforms, weather, well integrity."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.offshore import OffshorePlatform, WeatherForecast, WellIntegrity, SubseaAlert
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/api/offshore", tags=["offshore"])


class PlatformOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    field_name: str
    status: str
    production_bopd: float
    uptime_pct: float
    active_wells: int
    crew_count: int


class WeatherForecastOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    platform_id: str
    forecast_date: datetime
    wave_height_m: float
    wind_speed_kt: float
    visibility_nm: Optional[float]
    is_workable: bool


class WellIntegrityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    platform_id: str
    well_name: str
    barrier_type: str
    status: str
    last_test_date: Optional[datetime]
    annulus_pressure_bar: Optional[float]
    notes: Optional[str]


class SubseaAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    platform_id: str
    asset_name: str
    asset_type: str
    issue_description: str
    failure_probability_pct: float
    eta_days: float


@router.get("/platforms", response_model=list[PlatformOut])
async def list_platforms(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(OffshorePlatform))
    return result.scalars().all()


@router.get("/platforms/{platform_id}/weather", response_model=list[WeatherForecastOut])
async def get_weather(
    platform_id: str,
    limit: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(WeatherForecast)
        .where(WeatherForecast.platform_id == platform_id)
        .order_by(WeatherForecast.forecast_date.asc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/well-integrity", response_model=list[WellIntegrityOut])
async def list_well_integrity(
    platform_id: str | None = Query(None),
    risk_level: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(WellIntegrity)
    if platform_id:
        stmt = stmt.where(WellIntegrity.platform_id == platform_id)
    if risk_level:
        stmt = stmt.where(WellIntegrity.status == risk_level)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/subsea-alerts", response_model=list[SubseaAlertOut])
async def list_subsea_alerts(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(SubseaAlert)
    result = await db.execute(stmt)
    return result.scalars().all()
