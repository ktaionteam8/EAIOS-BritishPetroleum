"""Operator adoption: scores, training, barriers, champions."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class AdoptionMetric(Base):
    __tablename__ = "adoption_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    metric_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    total_users: Mapped[int] = mapped_column(Integer, nullable=False)
    active_users: Mapped[int] = mapped_column(Integer, nullable=False)
    avg_response_time_min: Mapped[float] = mapped_column(Float, nullable=False)
    avg_alert_action_rate_pct: Mapped[float] = mapped_column(Float, nullable=False)
    training_completion_rate_pct: Mapped[float] = mapped_column(Float, nullable=False)
    adoption_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class TrainingModule(Base):
    __tablename__ = "training_modules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    # mandatory | optional
    module_type: Mapped[str] = mapped_column(String(20), nullable=False, default="mandatory")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    estimated_duration_hours: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    target_completion_pct: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    enrollments: Mapped[list["TrainingEnrollment"]] = relationship("TrainingEnrollment", back_populates="module", cascade="all, delete-orphan")


class TrainingEnrollment(Base):
    __tablename__ = "training_enrollments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("training_modules.id"), nullable=False, index=True)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    assessment_score_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    certification_earned: Mapped[bool] = mapped_column(Boolean, default=False)
    # not-started | in-progress | completed | expired
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="not-started")

    module: Mapped["TrainingModule"] = relationship("TrainingModule", back_populates="enrollments")


class AdoptionBarrier(Base):
    __tablename__ = "adoption_barriers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    theme: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # high | medium | low
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    vote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # open | being-addressed | resolved
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class ChangeChampion(Base):
    __tablename__ = "change_champions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(80), nullable=False)
    sessions_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    alerts_actioned_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    training_completion_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
