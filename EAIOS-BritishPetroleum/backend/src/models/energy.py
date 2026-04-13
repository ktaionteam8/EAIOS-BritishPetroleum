"""Energy consumption, targets, carbon emissions."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class EnergyReading(Base):
    __tablename__ = "energy_readings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    reading_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    total_energy_gj: Mapped[float] = mapped_column(Float, nullable=False)
    throughput_tonnes: Mapped[float] = mapped_column(Float, nullable=False)
    energy_intensity_gj_per_t: Mapped[float] = mapped_column(Float, nullable=False)
    power_mw: Mapped[float | None] = mapped_column(Float, nullable=True)
    steam_t_per_h: Mapped[float | None] = mapped_column(Float, nullable=True)
    co2_tonnes: Mapped[float | None] = mapped_column(Float, nullable=True)
    co2_intensity_per_tonne: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class EnergyTarget(Base):
    __tablename__ = "energy_targets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    target_gj_per_t: Mapped[float] = mapped_column(Float, nullable=False)
    target_co2_per_t: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class EnergySavingEvent(Base):
    __tablename__ = "energy_saving_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    event_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    cost_avoided_usd: Mapped[float] = mapped_column(Float, nullable=False)
    # efficiency | process_change | equipment_upgrade | optimization
    source: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
