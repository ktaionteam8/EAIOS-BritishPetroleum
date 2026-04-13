"""Equipment router — CRUD, sensor readings, health trend, FFT, RUL, KPIs, risk matrix."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from src.models.database import get_db
from src.models.core import Equipment, SensorReading
from src.schemas.equipment import (
    EquipmentOut, EquipmentUpdate,
    SensorReadingOut, SensorReadingCreate,
)

router = APIRouter(prefix="/api/equipment", tags=["equipment"])


class HealthPoint(BaseModel):
    timestamp: str
    health_score: float
    rul_hours: Optional[float]


class FFTPoint(BaseModel):
    frequency_hz: float
    amplitude: float
    band: str


class RULOut(BaseModel):
    equipment_id: str
    tag: str
    rul_hours: Optional[float]
    rul_days: Optional[float]
    confidence_pct: float
    predicted_failure_date: Optional[str]


class FailureSignature(BaseModel):
    equipment_type: str
    failure_mode: str
    sensor_pattern: str
    lead_time_hours: int
    confidence_pct: float


class EquipmentKPI(BaseModel):
    site_id: str
    total: int
    critical: int
    warning: int
    healthy: int
    avg_health_score: float
    avg_rul_hours: Optional[float]


@router.get("", response_model=list[EquipmentOut])
async def list_equipment(
    site_id: str | None = Query(None),
    ai_status: str | None = Query(None, description="critical|warning|healthy"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Equipment).where(Equipment.is_active == True).order_by(Equipment.health_score.asc())
    if site_id:
        stmt = stmt.where(Equipment.site_id == site_id)
    if ai_status:
        stmt = stmt.where(Equipment.ai_status == ai_status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{equipment_id}", response_model=EquipmentOut)
async def get_equipment(equipment_id: str, db: AsyncSession = Depends(get_db)):
    eq = await db.get(Equipment, equipment_id)
    if eq is None:
        raise HTTPException(status_code=404, detail={"detail": "Equipment not found", "code": "equipment_not_found"})
    return eq


@router.patch("/{equipment_id}", response_model=EquipmentOut)
async def update_equipment(
    equipment_id: str,
    body: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
):
    eq = await db.get(Equipment, equipment_id)
    if eq is None:
        raise HTTPException(status_code=404, detail={"detail": "Equipment not found", "code": "equipment_not_found"})
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(eq, field, value)
    await db.commit()
    await db.refresh(eq)
    return eq


@router.get("/{equipment_id}/readings", response_model=list[SensorReadingOut])
async def list_readings(
    equipment_id: str,
    limit: int = Query(100, ge=1, le=1000),
    sensor_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(SensorReading)
        .where(SensorReading.equipment_id == equipment_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
    )
    if sensor_type:
        stmt = stmt.where(SensorReading.sensor_type == sensor_type)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{equipment_id}/readings", response_model=SensorReadingOut, status_code=201)
async def add_reading(
    equipment_id: str,
    body: SensorReadingCreate,
    db: AsyncSession = Depends(get_db),
):
    eq = await db.get(Equipment, equipment_id)
    if eq is None:
        raise HTTPException(status_code=404, detail={"detail": "Equipment not found", "code": "equipment_not_found"})
    reading = SensorReading(equipment_id=equipment_id, timestamp=datetime.utcnow(), **body.model_dump())
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading


@router.get("/{equipment_id}/health-trend", response_model=list[HealthPoint])
async def health_trend(equipment_id: str, days: int = Query(30, ge=1, le=365), db: AsyncSession = Depends(get_db)):
    eq = await db.get(Equipment, equipment_id)
    if eq is None:
        raise HTTPException(status_code=404, detail={"detail": "Equipment not found", "code": "equipment_not_found"})
    result = await db.execute(
        select(SensorReading).where(SensorReading.equipment_id == equipment_id)
        .where(SensorReading.sensor_type == "health_score").order_by(SensorReading.timestamp.desc()).limit(days)
    )
    readings = result.scalars().all()
    if readings:
        return [HealthPoint(timestamp=r.timestamp.isoformat(), health_score=r.value, rul_hours=None) for r in readings]
    return [HealthPoint(timestamp=datetime.utcnow().isoformat(), health_score=eq.health_score, rul_hours=eq.rul_hours)]


@router.get("/{equipment_id}/fft", response_model=list[FFTPoint])
async def get_fft(equipment_id: str, db: AsyncSession = Depends(get_db)):
    eq = await db.get(Equipment, equipment_id)
    if eq is None:
        raise HTTPException(status_code=404, detail={"detail": "Equipment not found", "code": "equipment_not_found"})
    import math, random
    random.seed(equipment_id)
    bands = [("sub-synchronous", 0, 25), ("1x", 25, 75), ("2x", 75, 125), ("high-freq", 125, 500)]
    pts = []
    for band, lo, hi in bands:
        for hz in range(lo + 5, hi, 10):
            amp = random.uniform(0.1, 2.0) * (1.5 if band == "1x" else 1.0)
            pts.append(FFTPoint(frequency_hz=float(hz), amplitude=round(amp, 3), band=band))
    return pts


@router.get("/{equipment_id}/rul", response_model=RULOut)
async def get_rul(equipment_id: str, db: AsyncSession = Depends(get_db)):
    eq = await db.get(Equipment, equipment_id)
    if eq is None:
        raise HTTPException(status_code=404, detail={"detail": "Equipment not found", "code": "equipment_not_found"})
    rul_h = eq.rul_hours
    rul_d = round(rul_h / 24, 1) if rul_h else None
    fail_date = None
    if rul_h:
        from datetime import timedelta
        fail_date = (datetime.utcnow() + timedelta(hours=rul_h)).strftime("%Y-%m-%d")
    return RULOut(equipment_id=eq.id, tag=eq.tag, rul_hours=rul_h, rul_days=rul_d,
                  confidence_pct=85.0 if rul_h else 50.0, predicted_failure_date=fail_date)


@router.get("/failure-signatures", response_model=list[FailureSignature])
async def failure_signatures():
    return [
        FailureSignature(equipment_type="Centrifugal Compressor", failure_mode="Bearing Failure", sensor_pattern="Vibration 1x↑ + temp↑", lead_time_hours=72, confidence_pct=87.0),
        FailureSignature(equipment_type="Centrifugal Pump", failure_mode="Cavitation", sensor_pattern="Flow↓ + suction pressure↓", lead_time_hours=24, confidence_pct=91.0),
        FailureSignature(equipment_type="Gas Turbine", failure_mode="Hot Section Corrosion", sensor_pattern="EGT spread↑ + vibration↑", lead_time_hours=168, confidence_pct=78.0),
        FailureSignature(equipment_type="Heat Exchanger", failure_mode="Fouling", sensor_pattern="dT↓ + dp↑", lead_time_hours=336, confidence_pct=94.0),
    ]


@router.get("/kpis", response_model=list[EquipmentKPI])
async def equipment_kpis(site_id: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    stmt = select(
        Equipment.site_id,
        func.count().label("total"),
        func.sum((Equipment.ai_status == "critical").cast(func.Integer)).label("critical"),
        func.sum((Equipment.ai_status == "warning").cast(func.Integer)).label("warning"),
        func.sum((Equipment.ai_status == "healthy").cast(func.Integer)).label("healthy"),
        func.avg(Equipment.health_score).label("avg_health"),
        func.avg(Equipment.rul_hours).label("avg_rul"),
    ).where(Equipment.is_active == True).group_by(Equipment.site_id)
    if site_id:
        stmt = stmt.where(Equipment.site_id == site_id)
    rows = (await db.execute(stmt)).all()
    return [EquipmentKPI(site_id=r.site_id, total=r.total or 0, critical=int(r.critical or 0),
                         warning=int(r.warning or 0), healthy=int(r.healthy or 0),
                         avg_health_score=round(float(r.avg_health or 80), 1),
                         avg_rul_hours=round(float(r.avg_rul), 1) if r.avg_rul else None) for r in rows]
