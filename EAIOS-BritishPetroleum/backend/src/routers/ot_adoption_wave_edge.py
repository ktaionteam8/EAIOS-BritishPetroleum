"""OT Data, Adoption, Wave Tracker, Edge AI routers — combined file."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.ot_data import OTDataSource, OTQualityIssue
from src.models.adoption import AdoptionMetric, TrainingModule, TrainingEnrollment, AdoptionBarrier, ChangeChampion
from src.models.wave_tracker import ImplementationWave, WaveMilestone, DeliveryRisk
from src.models.edge_ai import EdgeNode, EdgeModelDeployment, LatencyBenchmark
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from src.middleware.auth import get_current_user

# ── OT Data ──────────────────────────────────────────────────────────────────
ot_router = APIRouter(prefix="/api/ot-data", tags=["ot-data"])


class OTSourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    source_code: str
    source_type: str
    site_id: str
    tag_count: int
    latency_ms: int
    status: str
    quality_score_pct: float
    last_poll_at: Optional[datetime]


@ot_router.get("/sources", response_model=list[OTSourceOut])
async def list_ot_sources(
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(OTDataSource)
    if site_id:
        stmt = stmt.where(OTDataSource.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


class OTQualityIssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    source_id: str
    tag_name: str
    issue_type: str
    description: str
    severity: str
    resolution_status: str
    detected_at: datetime
    resolved_at: Optional[datetime]


@ot_router.get("/quality-issues", response_model=list[OTQualityIssueOut])
async def list_quality_issues(
    source_id: str | None = Query(None),
    severity: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(OTQualityIssue).order_by(OTQualityIssue.detected_at.desc())
    if source_id:
        stmt = stmt.where(OTQualityIssue.source_id == source_id)
    if severity:
        stmt = stmt.where(OTQualityIssue.severity == severity)
    result = await db.execute(stmt)
    return result.scalars().all()


# ── Adoption ─────────────────────────────────────────────────────────────────
adoption_router = APIRouter(prefix="/api/adoption", tags=["adoption"])


class AdoptionMetricOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    site_id: str
    metric_date: datetime
    total_users: int
    active_users: int
    avg_response_time_min: float
    avg_alert_action_rate_pct: float
    training_completion_rate_pct: float
    adoption_score: float


class TrainingModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: str
    name: str
    module_type: str
    estimated_duration_hours: float
    target_completion_pct: float
    is_active: bool


@adoption_router.get("/metrics", response_model=list[AdoptionMetricOut])
async def list_adoption_metrics(
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(AdoptionMetric).order_by(AdoptionMetric.metric_date.desc())
    if site_id:
        stmt = stmt.where(AdoptionMetric.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@adoption_router.get("/training", response_model=list[TrainingModuleOut])
async def list_training_modules(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(TrainingModule))
    return result.scalars().all()


class AdoptionBarrierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    theme: str
    description: Optional[str]
    priority: str
    vote_count: int
    status: str
    created_at: datetime


@adoption_router.get("/barriers", response_model=list[AdoptionBarrierOut])
async def list_barriers(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(AdoptionBarrier).order_by(AdoptionBarrier.vote_count.desc())
    )
    return result.scalars().all()


class ChangeChampionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    site_id: str
    role: str
    sessions_count: int
    alerts_actioned_count: int
    training_completion_pct: float


@adoption_router.get("/champions", response_model=list[ChangeChampionOut])
async def list_champions(
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(ChangeChampion).order_by(ChangeChampion.sessions_count.desc())
    if site_id:
        stmt = stmt.where(ChangeChampion.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


# ── Wave Tracker ─────────────────────────────────────────────────────────────
wave_router = APIRouter(prefix="/api/waves", tags=["waves"])


class WaveOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    wave_number: int
    wave_name: str
    period_start: datetime
    period_end: datetime
    status: str
    pct_complete: float
    budget_usd: float
    actual_spent_usd: float


class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    milestone_code: str
    wave_id: str
    description: str
    due_date: datetime
    status: str
    owner: Optional[str]


class DeliveryRiskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    risk_code: str
    wave_id: str
    description: str
    probability: str
    status: str


@wave_router.get("", response_model=list[WaveOut])
async def list_waves(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(ImplementationWave).order_by(ImplementationWave.wave_number))
    return result.scalars().all()


@wave_router.get("/{wave_id}/milestones", response_model=list[MilestoneOut])
async def list_milestones(
    wave_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(WaveMilestone).where(WaveMilestone.wave_id == wave_id))
    return result.scalars().all()


@wave_router.get("/{wave_id}/risks", response_model=list[DeliveryRiskOut])
async def list_risks(
    wave_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(DeliveryRisk).where(DeliveryRisk.wave_id == wave_id))
    return result.scalars().all()


class DeliveryRiskCreate(BaseModel):
    risk_code: str
    description: str
    probability: str = "medium"
    status: str = "open"


@wave_router.post("/{wave_id}/risks", response_model=DeliveryRiskOut, status_code=201)
async def create_risk(
    wave_id: str,
    body: DeliveryRiskCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    wave = await db.get(ImplementationWave, wave_id)
    if wave is None:
        raise HTTPException(status_code=404, detail={"detail": "Wave not found", "code": "wave_not_found"})
    risk = DeliveryRisk(wave_id=wave_id, **body.model_dump())
    db.add(risk)
    await db.commit()
    await db.refresh(risk)
    return risk


# ── Edge AI ──────────────────────────────────────────────────────────────────
edge_router = APIRouter(prefix="/api/edge", tags=["edge-ai"])


class EdgeNodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    node_code: str
    site_id: str
    hardware_spec: str
    status: str
    inference_offload_pct: float
    avg_latency_ms: float
    cpu_usage_pct: Optional[float]
    memory_usage_pct: Optional[float]
    last_sync_label: Optional[str]


class LatencyBenchmarkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    scenario_description: str
    edge_latency_ms: float
    cloud_latency_ms: float
    latency_saving_pct: float
    benchmark_date: datetime


@edge_router.get("/nodes", response_model=list[EdgeNodeOut])
async def list_nodes(
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(EdgeNode)
    if site_id:
        stmt = stmt.where(EdgeNode.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@edge_router.get("/benchmarks", response_model=list[LatencyBenchmarkOut])
async def list_benchmarks(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(LatencyBenchmark).order_by(LatencyBenchmark.benchmark_date.desc()))
    return result.scalars().all()


@edge_router.get("/latency", response_model=list[LatencyBenchmarkOut])
async def list_latency(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(LatencyBenchmark).order_by(LatencyBenchmark.benchmark_date.desc()))
    return result.scalars().all()
