"""Reliability router — FMEA library, KPIs, and risk matrix."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict
from typing import Optional

from src.models.database import get_db
from src.models.core import Equipment
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/api/reliability", tags=["reliability"])


class FMEAEntry(BaseModel):
    id: str
    equipment_type: str
    failure_mode: str
    cause: str
    effect: str
    severity: int
    occurrence: int
    detection: int
    rpn: int
    current_controls: str
    recommended_action: str


class ReliabilityKPI(BaseModel):
    site_id: str
    mtbf_hours: float
    mttr_hours: float
    availability_pct: float
    failure_rate_per_year: float


class RiskMatrixEntry(BaseModel):
    equipment_id: str
    tag: str
    name: str
    site_id: str
    severity: int
    probability: int
    risk_score: int
    risk_level: str


# Static FMEA library — populated from IEC 60812 / industry standards
_FMEA: list[dict] = [
    {"id":"FM-001","equipment_type":"Centrifugal Compressor","failure_mode":"Bearing Failure","cause":"Lubrication degradation / overloading","effect":"Unplanned shutdown, process loss","severity":8,"occurrence":4,"detection":3,"rpn":96,"current_controls":"Vibration monitoring, lube oil analysis","recommended_action":"Install online bearing temp + vibration trip"},
    {"id":"FM-002","equipment_type":"Centrifugal Compressor","failure_mode":"Seal Gas Leak","cause":"Seal face wear, contamination","effect":"Hydrocarbon release, HSE risk","severity":9,"occurrence":3,"detection":4,"rpn":108,"current_controls":"Seal gas flow monitoring","recommended_action":"Quarterly seal inspection; install gas detector"},
    {"id":"FM-003","equipment_type":"Centrifugal Pump","failure_mode":"Cavitation","cause":"Low suction pressure, high flow","effect":"Impeller erosion, performance loss","severity":6,"occurrence":5,"detection":4,"rpn":120,"current_controls":"Suction pressure low alarm","recommended_action":"Install NPSH protection logic"},
    {"id":"FM-004","equipment_type":"Gas Turbine","failure_mode":"Hot Section Corrosion","cause":"Fuel contaminants, high firing temp","effect":"Blade cracking, forced outage","severity":9,"occurrence":2,"detection":5,"rpn":90,"current_controls":"Borescope inspection (annual)","recommended_action":"Reduce inspection interval to 6 months"},
    {"id":"FM-005","equipment_type":"Heat Exchanger","failure_mode":"Tube Fouling","cause":"Process fluid deposits","effect":"Reduced heat duty, energy loss","severity":5,"occurrence":6,"detection":5,"rpn":150,"current_controls":"dT monitoring across exchanger","recommended_action":"Online chemical dosing; fouling factor alert"},
    {"id":"FM-006","equipment_type":"Pressure Vessel","failure_mode":"Corrosion Under Insulation","cause":"Moisture ingress under insulation","effect":"Wall thinning, potential leak","severity":8,"occurrence":3,"detection":6,"rpn":144,"current_controls":"API 510 periodic inspection","recommended_action":"Risk-based insulation removal and UT scan"},
]


@router.get("/fmea", response_model=list[FMEAEntry])
async def list_fmea(
    equipment_type: str | None = Query(None),
    min_rpn: int | None = Query(None),
    _: dict = Depends(get_current_user),
):
    entries = _FMEA
    if equipment_type:
        entries = [e for e in entries if equipment_type.lower() in e["equipment_type"].lower()]
    if min_rpn:
        entries = [e for e in entries if e["rpn"] >= min_rpn]
    return entries


@router.get("/kpis", response_model=list[ReliabilityKPI])
async def list_reliability_kpis(
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(Equipment.site_id, func.avg(Equipment.health_score)).group_by(Equipment.site_id)
    if site_id:
        stmt = stmt.where(Equipment.site_id == site_id)
    rows = (await db.execute(stmt)).all()
    kpis = []
    for row in rows:
        avg_health = float(row[1] or 80)
        availability = min(99.0, avg_health * 1.02)
        mtbf = avg_health * 12.0
        mttr = max(1.0, (100 - avg_health) / 10)
        failure_rate = round(8760 / mtbf, 2)
        kpis.append(ReliabilityKPI(
            site_id=row[0], mtbf_hours=round(mtbf, 1),
            mttr_hours=round(mttr, 2), availability_pct=round(availability, 1),
            failure_rate_per_year=failure_rate,
        ))
    return kpis


@router.get("/risk-matrix", response_model=list[RiskMatrixEntry])
async def get_risk_matrix(
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(Equipment).where(Equipment.is_active == True)
    if site_id:
        stmt = stmt.where(Equipment.site_id == site_id)
    result = await db.execute(stmt)
    equipment = result.scalars().all()
    entries = []
    for eq in equipment:
        score = eq.health_score or 80
        severity   = 5 if score < 50 else 4 if score < 70 else 3 if score < 85 else 2
        probability = 5 if score < 40 else 4 if score < 60 else 3 if score < 75 else 2 if score < 90 else 1
        risk_score = severity * probability
        risk_level = "CRITICAL" if risk_score >= 16 else "HIGH" if risk_score >= 10 else "MEDIUM" if risk_score >= 6 else "LOW"
        entries.append(RiskMatrixEntry(
            equipment_id=eq.id, tag=eq.tag, name=eq.name,
            site_id=eq.site_id, severity=severity,
            probability=probability, risk_score=risk_score, risk_level=risk_level,
        ))
    return sorted(entries, key=lambda x: x.risk_score, reverse=True)
