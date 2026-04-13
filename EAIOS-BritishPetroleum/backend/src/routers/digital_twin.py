"""Digital Twin router — registry, operating envelope, and scenario management."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

from src.models.database import get_db
from src.models.digital_twin import DigitalTwinAsset, OperatingEnvelopeParam, TwinScenario

router = APIRouter(prefix="/api/digital-twin", tags=["digital-twin"])


class TwinAssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    equipment_id: str
    twin_type: str
    fidelity: str
    last_sync: str
    status: str
    sync_latency_ms: Optional[int]


class EnvelopeParamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    twin_id: str
    parameter_name: str
    current_value: float
    normal_range_low: float
    normal_range_high: float
    unit: str
    status: str


class ScenarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    twin_id: str
    name: str
    description: Optional[str]
    rul_delta_hours: Optional[float]
    impact: str
    created_at: datetime


class ScenarioRunResult(BaseModel):
    scenario_id: str
    status: str
    rul_delta_hours: float
    impact: str
    message: str


@router.get("/registry", response_model=list[TwinAssetOut])
async def list_registry(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DigitalTwinAsset).order_by(DigitalTwinAsset.equipment_id)
    if status:
        stmt = stmt.where(DigitalTwinAsset.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{twin_id}/envelope", response_model=list[EnvelopeParamOut])
async def get_envelope(twin_id: str, db: AsyncSession = Depends(get_db)):
    twin = await db.get(DigitalTwinAsset, twin_id)
    if twin is None:
        raise HTTPException(status_code=404, detail={"detail": "Twin not found", "code": "twin_not_found"})
    result = await db.execute(
        select(OperatingEnvelopeParam)
        .where(OperatingEnvelopeParam.twin_id == twin_id)
        .order_by(OperatingEnvelopeParam.sort_order)
    )
    return result.scalars().all()


@router.get("/scenarios", response_model=list[ScenarioOut])
async def list_scenarios(
    twin_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TwinScenario).order_by(TwinScenario.created_at.desc())
    if twin_id:
        stmt = stmt.where(TwinScenario.twin_id == twin_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/scenarios/{scenario_id}/run", response_model=ScenarioRunResult)
async def run_scenario(scenario_id: str, db: AsyncSession = Depends(get_db)):
    scenario = await db.get(TwinScenario, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail={"detail": "Scenario not found", "code": "scenario_not_found"})
    return ScenarioRunResult(
        scenario_id=scenario_id,
        status="completed",
        rul_delta_hours=scenario.rul_delta_hours or 0.0,
        impact=scenario.impact,
        message=f"Scenario '{scenario.name}' executed successfully.",
    )
