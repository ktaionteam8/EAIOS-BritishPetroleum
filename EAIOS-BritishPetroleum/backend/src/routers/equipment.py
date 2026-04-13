"""Equipment router — CRUD + sensor readings."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.core import Equipment, SensorReading
from src.schemas.equipment import (
    EquipmentOut, EquipmentUpdate,
    SensorReadingOut, SensorReadingCreate,
)

router = APIRouter(prefix="/api/equipment", tags=["equipment"])


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
