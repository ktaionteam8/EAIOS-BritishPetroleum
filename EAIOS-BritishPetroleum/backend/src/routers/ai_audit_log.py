"""AI Audit Log router — black-box recorder endpoints for all EAIOS agents."""
import csv
import io
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.database import get_db
from src.models.ai_audit_log import AIAuditLog
from src.schemas.ai_audit_log import AIAuditLogOut, AIAuditLogCreate
from src.middleware.auth import get_current_user

router = APIRouter(prefix="/api/audit-log", tags=["audit-log"])


@router.get("/", response_model=list[AIAuditLogOut])
async def list_audit_logs(
    domain_id: Optional[str] = Query(None, description="Filter by domain ID"),
    agent_name: Optional[str] = Query(None, description="Filter by agent name"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> list[AIAuditLogOut]:
    """Return AI audit log entries, newest first. Filterable by domain, agent, and status."""
    stmt = select(AIAuditLog).order_by(desc(AIAuditLog.created_at))
    if domain_id:
        stmt = stmt.where(AIAuditLog.domain_id == domain_id)
    if agent_name:
        stmt = stmt.where(AIAuditLog.agent_name == agent_name)
    if status:
        stmt = stmt.where(AIAuditLog.status == status)
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/export/csv")
async def export_audit_log_csv(
    domain_id: Optional[str] = Query(None),
    agent_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    """Export audit log entries as a CSV file for incident investigations."""
    stmt = select(AIAuditLog).order_by(desc(AIAuditLog.created_at))
    if domain_id:
        stmt = stmt.where(AIAuditLog.domain_id == domain_id)
    if agent_name:
        stmt = stmt.where(AIAuditLog.agent_name == agent_name)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Timestamp", "Agent", "Domain", "Model Version",
        "Action", "Input Context", "Output Summary",
        "Confidence %", "Status", "Triggered By",
    ])
    for row in rows:
        writer.writerow([
            str(row.id),
            row.created_at.isoformat(),
            row.agent_name,
            row.domain_id,
            row.model_version,
            row.action,
            row.input_context,
            row.output_summary,
            f"{row.confidence_score:.1f}",
            row.status,
            row.triggered_by,
        ])

    output.seek(0)
    filename = f"eaios_audit_log_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{log_id}", response_model=AIAuditLogOut)
async def get_audit_log(
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> AIAuditLogOut:
    """Retrieve a single audit log entry by ID."""
    result = await db.execute(select(AIAuditLog).where(AIAuditLog.id == log_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail={"detail": "Audit log entry not found", "code": "not_found"})
    return entry


@router.post("/", response_model=AIAuditLogOut, status_code=201)
async def create_audit_log(
    body: AIAuditLogCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> AIAuditLogOut:
    """Record a new AI decision in the audit log."""
    now = datetime.utcnow()
    entry = AIAuditLog(
        id=uuid.uuid4(),
        created_at=now,
        updated_at=now,
        **body.model_dump(),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry
