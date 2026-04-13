"""Alerts router — GET list, GET detail, POST decision, GET audit log."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.database import get_db
from src.models.alerts import Alert, AlertDecision, AuditLog
from src.models.core import User
from src.schemas.alerts import (
    AlertListItem, AlertDetail,
    DecisionCreate, DecisionOut, AuditLogOut,
)

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertListItem])
async def list_alerts(
    status: str | None = Query(None, description="Filter by status: active|accepted|closed"),
    severity: str | None = Query(None, description="Filter by severity: critical|warning|advisory"),
    site_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Alert).order_by(Alert.created_at.desc())
    if status:
        stmt = stmt.where(Alert.status == status)
    if severity:
        stmt = stmt.where(Alert.severity == severity)
    if site_id:
        stmt = stmt.where(Alert.site_id == site_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{alert_id}", response_model=AlertDetail)
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Alert)
        .where(Alert.id == alert_id)
        .options(
            selectinload(Alert.shap_signals),
            selectinload(Alert.analogues),
        )
    )
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=404, detail={"detail": "Alert not found", "code": "alert_not_found"})
    return alert


@router.post("/{alert_id}/decision", response_model=DecisionOut, status_code=201)
async def post_decision(
    alert_id: str,
    body: DecisionCreate,
    db: AsyncSession = Depends(get_db),
):
    # Verify alert exists
    alert = await db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail={"detail": "Alert not found", "code": "alert_not_found"})

    # Verify user exists
    user = await db.get(User, body.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail={"detail": "User not found", "code": "user_not_found"})

    # Create decision record
    decision = AlertDecision(
        alert_id=alert_id,
        user_id=body.user_id,
        decision=body.decision,
        reason_code=body.reason_code,
        modified_action=body.modified_action,
        modified_timing=body.modified_timing,
    )
    db.add(decision)

    # Update alert status
    alert.status = body.decision  # accepted | modified | overridden

    # Write audit log
    db.add(AuditLog(
        alert_id=alert_id,
        alert_title=alert.title,
        decision=body.decision,
        user_id=body.user_id,
        user_name=user.full_name,
        reason_code=body.reason_code,
    ))

    await db.commit()
    await db.refresh(decision)
    return decision


@router.get("/audit/log", response_model=list[AuditLogOut])
async def get_audit_log(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
