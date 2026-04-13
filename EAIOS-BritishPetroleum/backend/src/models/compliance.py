"""Compliance standards, audits, evidence, regulatory changes."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class ComplianceStandard(Base):
    __tablename__ = "compliance_standards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    jurisdiction: Mapped[str | None] = mapped_column(String(80), nullable=True)
    standard_body: Mapped[str | None] = mapped_column(String(80), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    audits: Mapped[list["ComplianceAudit"]] = relationship("ComplianceAudit", back_populates="standard")


class ComplianceAudit(Base):
    __tablename__ = "compliance_audits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    standard_id: Mapped[str] = mapped_column(String(36), ForeignKey("compliance_standards.id"), nullable=False, index=True)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    audit_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    next_audit_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    inspector_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    inspector_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    score_pct: Mapped[float] = mapped_column(Float, nullable=False)
    # compliant | due_soon | overdue
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="compliant", index=True)
    findings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    days_until_due: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    standard: Mapped["ComplianceStandard"] = relationship("ComplianceStandard", back_populates="audits")
    evidence: Mapped[list["ComplianceEvidence"]] = relationship("ComplianceEvidence", back_populates="audit", cascade="all, delete-orphan")


class ComplianceEvidence(Base):
    __tablename__ = "compliance_evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    audit_id: Mapped[str] = mapped_column(String(36), ForeignKey("compliance_audits.id"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(80), nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    uploaded_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    uploaded_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    audit: Mapped["ComplianceAudit"] = relationship("ComplianceAudit", back_populates="evidence")


class RegulatoryChange(Base):
    __tablename__ = "regulatory_changes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    effective_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    regulation_code: Mapped[str] = mapped_column(String(40), nullable=False)
    change_description: Mapped[str] = mapped_column(Text, nullable=False)
    impact_assessment: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_actions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # pending | in-review | actioned
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class ComplianceAction(Base):
    __tablename__ = "compliance_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    standard_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("compliance_standards.id"), nullable=True)
    site_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sites.id"), nullable=True)
    action_description: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    owner: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # open | in-progress | completed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
