"""Turnaround (TAR) plans, tasks, scheduling recommendations, crew calendar."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class TurnaroundEvent(Base):
    __tablename__ = "turnaround_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tar_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    unit_name: Mapped[str] = mapped_column(String(120), nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_usd: Mapped[float] = mapped_column(Float, nullable=False)
    actual_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    # planned | in-progress | completed | postponed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="planned", index=True)
    work_scope_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    tasks: Mapped[list["TarTask"]] = relationship("TarTask", back_populates="turnaround", cascade="all, delete-orphan")
    recommendations: Mapped[list["MaintenanceScheduleRecommendation"]] = relationship("MaintenanceScheduleRecommendation", back_populates="turnaround", cascade="all, delete-orphan")


class TarTask(Base):
    __tablename__ = "tar_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tar_id: Mapped[str] = mapped_column(String(36), ForeignKey("turnaround_events.id"), nullable=False, index=True)
    equipment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    # pending | in-progress | completed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    turnaround: Mapped["TurnaroundEvent"] = relationship("TurnaroundEvent", back_populates="tasks")


class MaintenanceScheduleRecommendation(Base):
    __tablename__ = "maintenance_schedule_recommendations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tar_id: Mapped[str] = mapped_column(String(36), ForeignKey("turnaround_events.id"), nullable=False, index=True)
    equipment_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=True)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_window: Mapped[str] = mapped_column(String(80), nullable=False)
    # low | medium | high | critical
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    constraints: Mapped[list | None] = mapped_column(JSON, nullable=True)
    ai_confidence_pct: Mapped[float] = mapped_column(Float, nullable=False, default=85.0)
    # pending | accepted | modified | rejected
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    accepted_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    turnaround: Mapped["TurnaroundEvent"] = relationship("TurnaroundEvent", back_populates="recommendations")


class TarConstraint(Base):
    __tablename__ = "tar_constraints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tar_id: Mapped[str] = mapped_column(String(36), ForeignKey("turnaround_events.id"), nullable=False, index=True)
    # safety | permit | resource | weather | regulatory
    constraint_type: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # ready | pending | blocked
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    owner: Mapped[str | None] = mapped_column(String(120), nullable=True)
    resolution_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
