"""ML Models router — registry, drift, feedback."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.database import get_db
from src.models.ml_models import MLModel, ModelFeedback
from src.schemas.ml_models import MLModelOut, MLModelDetail, ModelFeedbackCreate, ModelFeedbackOut

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
