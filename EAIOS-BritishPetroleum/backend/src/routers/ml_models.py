"""ML Models router — registry, drift, SHAP, feedback, approve, retire."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

from src.models.database import get_db
from src.models.ml_models import MLModel, ModelFeedback, ModelDriftMetric, ShapFeatureImportance
from src.schemas.ml_models import MLModelOut, MLModelDetail, ModelFeedbackCreate, ModelFeedbackOut


class DriftMetricOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_id: str
    metric_name: str
    value: float
    threshold: float
    drift_detected: bool
    recorded_at: datetime


class ShapOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_id: str
    feature_name: str
    importance_score: float
    rank: int

router = APIRouter(prefix="/api/ml-models", tags=["ml-models"])


@router.get("", response_model=list[MLModelOut])
async def list_models(
    status: str | None = Query(None, description="production|staging|retired"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MLModel).order_by(MLModel.is_champion.desc(), MLModel.accuracy.desc())
    if status:
        stmt = stmt.where(MLModel.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{model_id}", response_model=MLModelDetail)
async def get_model(model_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(MLModel)
        .where(MLModel.id == model_id)
        .options(selectinload(MLModel.shap_features))
    )
    result = await db.execute(stmt)
    model = result.scalar_one_or_none()
    if model is None:
        raise HTTPException(status_code=404, detail={"detail": "Model not found", "code": "model_not_found"})
    return model


@router.post("/{model_id}/feedback", response_model=ModelFeedbackOut, status_code=201)
async def add_feedback(
    model_id: str,
    body: ModelFeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    model = await db.get(MLModel, model_id)
    if model is None:
        raise HTTPException(status_code=404, detail={"detail": "Model not found", "code": "model_not_found"})
    fb = ModelFeedback(model_id=model_id, **body.model_dump())
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    return fb


@router.patch("/{model_id}/approve", response_model=MLModelOut)
async def approve_model(model_id: str, db: AsyncSession = Depends(get_db)):
    model = await db.get(MLModel, model_id)
    if model is None:
        raise HTTPException(status_code=404, detail={"detail": "Model not found", "code": "model_not_found"})
    model.approval_status = "approved"
    model.status = "production"
    await db.commit()
    await db.refresh(model)
    return model


@router.patch("/{model_id}/retire", response_model=MLModelOut)
async def retire_model(model_id: str, db: AsyncSession = Depends(get_db)):
    model = await db.get(MLModel, model_id)
    if model is None:
        raise HTTPException(status_code=404, detail={"detail": "Model not found", "code": "model_not_found"})
    model.status = "retired"
    model.is_champion = False
    await db.commit()
    await db.refresh(model)
    return model


@router.get("/{model_id}/drift", response_model=list[DriftMetricOut])
async def get_drift(model_id: str, db: AsyncSession = Depends(get_db)):
    model = await db.get(MLModel, model_id)
    if model is None:
        raise HTTPException(status_code=404, detail={"detail": "Model not found", "code": "model_not_found"})
    result = await db.execute(
        select(ModelDriftMetric).where(ModelDriftMetric.model_id == model_id)
        .order_by(ModelDriftMetric.recorded_at.desc()).limit(20)
    )
    return result.scalars().all()


@router.get("/{model_id}/shap", response_model=list[ShapOut])
async def get_shap(model_id: str, db: AsyncSession = Depends(get_db)):
    model = await db.get(MLModel, model_id)
    if model is None:
        raise HTTPException(status_code=404, detail={"detail": "Model not found", "code": "model_not_found"})
    result = await db.execute(
        select(ShapFeatureImportance).where(ShapFeatureImportance.model_id == model_id)
        .order_by(ShapFeatureImportance.rank.asc())
    )
    return result.scalars().all()


@router.get("/{model_id}/feedback", response_model=list[ModelFeedbackOut])
async def get_feedback(model_id: str, db: AsyncSession = Depends(get_db)):
    model = await db.get(MLModel, model_id)
    if model is None:
        raise HTTPException(status_code=404, detail={"detail": "Model not found", "code": "model_not_found"})
    result = await db.execute(
        select(ModelFeedback).where(ModelFeedback.model_id == model_id)
        .order_by(ModelFeedback.created_at.desc())
    )
    return result.scalars().all()
