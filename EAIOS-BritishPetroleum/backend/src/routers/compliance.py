"""Compliance router."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.compliance import ComplianceStandard, ComplianceAudit, ComplianceAction
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


class ComplianceStandardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: str
    name: str
    category: str
    status: str


class ComplianceAuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    standard_id: str
    site_id: str
    audit_date: datetime
    next_audit_date: Optional[datetime]
    score_pct: float
    status: str
    inspector_name: Optional[str]


class ComplianceActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    standard_id: Optional[str]
    site_id: Optional[str]
    action_description: str
    due_date: Optional[datetime]
    status: str
    owner: Optional[str]


@router.get("/standards", response_model=list[ComplianceStandardOut])
async def list_standards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ComplianceStandard))
    return result.scalars().all()


@router.get("/audits", response_model=list[ComplianceAuditOut])
async def list_audits(
    site_id: str | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ComplianceAudit).order_by(ComplianceAudit.audit_date.desc())
    if site_id:
        stmt = stmt.where(ComplianceAudit.site_id == site_id)
    if status:
        stmt = stmt.where(ComplianceAudit.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/actions", response_model=list[ComplianceActionOut])
async def list_actions(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ComplianceAction).order_by(ComplianceAction.due_date.asc())
    if status:
        stmt = stmt.where(ComplianceAction.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()
