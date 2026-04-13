"""Implementation wave tracker: waves, milestones, risks, budget."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class ImplementationWave(Base):
    __tablename__ = "implementation_waves"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    wave_number: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    wave_name: Mapped[str] = mapped_column(String(120), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    # planned | in-progress | completed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="planned", index=True)
    pct_complete: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    budget_usd: Mapped[float] = mapped_column(Float, nullable=False)
    actual_spent_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    forecast_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    sites_in_scope: Mapped[list | None] = mapped_column(JSON, nullable=True)
    modules: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    milestones: Mapped[list["WaveMilestone"]] = relationship("WaveMilestone", back_populates="wave", cascade="all, delete-orphan")
    risks: Mapped[list["DeliveryRisk"]] = relationship("DeliveryRisk", back_populates="wave", cascade="all, delete-orphan")


class WaveMilestone(Base):
    __tablename__ = "wave_milestones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    milestone_code: Mapped[str] = mapped_column(String(10), nullable=False)
    wave_id: Mapped[str] = mapped_column(String(36), ForeignKey("implementation_waves.id"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    owner: Mapped[str | None] = mapped_column(String(120), nullable=True)
    owner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    # pending | in-progress | done | delayed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    completion_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    wave: Mapped["ImplementationWave"] = relationship("ImplementationWave", back_populates="milestones")


class DeliveryRisk(Base):
    __tablename__ = "delivery_risks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    risk_code: Mapped[str] = mapped_column(String(10), nullable=False)
    wave_id: Mapped[str] = mapped_column(String(36), ForeignKey("implementation_waves.id"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    impact_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # high | medium | low
    probability: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    mitigation_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    # open | in-progress | closed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    owner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    wave: Mapped["ImplementationWave"] = relationship("ImplementationWave", back_populates="risks")
