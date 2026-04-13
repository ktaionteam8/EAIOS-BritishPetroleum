"""OT data sources, tags, quality issues, normalization log."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class OTDataSource(Base):
    __tablename__ = "ot_data_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    source_code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    # OSIsoft PI | OPC-UA | DCS | SCADA | MQTT | REST
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    tag_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    # connected | degraded | offline
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="connected", index=True)
    quality_score_pct: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    last_poll_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    connection_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    quality_issues: Mapped[list["OTQualityIssue"]] = relationship("OTQualityIssue", back_populates="source", cascade="all, delete-orphan")


class OTQualityIssue(Base):
    __tablename__ = "ot_quality_issues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("ot_data_sources.id"), nullable=False, index=True)
    tag_name: Mapped[str] = mapped_column(String(120), nullable=False)
    # frozen_value | out_of_range | stale | dropout | noise
    issue_type: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # critical | warning
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    impact_on_models: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # open | investigating | resolved
    resolution_status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    detected_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    source: Mapped["OTDataSource"] = relationship("OTDataSource", back_populates="quality_issues")


class SchemaNormalizationLog(Base):
    __tablename__ = "schema_normalization_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    # tag_rename | unit_conversion | filter | standardisation
    action_type: Mapped[str] = mapped_column(String(40), nullable=False)
    target_tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    # success | warning | error
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success")
    applied_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    applied_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
