"""Castrol blend operations router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.castrol import BlendSpecification, BlendRun, BlendQualityPrediction, LimsResult
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/api/castrol", tags=["castrol"])


class BlendSpecOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    grade_name: str
    viscosity_target: float
    viscosity_tol_low: float
    viscosity_tol_high: float
    pour_point_target: float
    tbn_target: float


class BlendRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    batch_code: str
    grade_name: str
    site_id: str
    target_volume_liters: float
    progress_pct: float
    status: str
    started_at: datetime


class BlendQualityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    blend_id: str
    predicted_at: datetime
    viscosity_predicted: float
    pour_point_predicted: float
    tbn_predicted: float
    confidence_low: Optional[float]
    confidence_high: Optional[float]
    prediction_status: str


@router.get("/specs", response_model=list[BlendSpecOut])
async def list_specs(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(BlendSpecification).order_by(BlendSpecification.grade_name))
    return result.scalars().all()


@router.get("/runs", response_model=list[BlendRunOut])
async def list_runs(
    site_id: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    stmt = select(BlendRun).order_by(BlendRun.started_at.desc())
    if site_id:
        stmt = stmt.where(BlendRun.site_id == site_id)
    if status:
        stmt = stmt.where(BlendRun.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/runs/{run_id}/quality", response_model=list[BlendQualityOut])
async def get_quality_predictions(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(BlendQualityPrediction)
        .where(BlendQualityPrediction.blend_id == run_id)
        .order_by(BlendQualityPrediction.predicted_at.desc())
    )
    return result.scalars().all()
