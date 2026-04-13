"""Digital twin registry, operating envelope, scenario testing."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class DigitalTwinAsset(Base):
    __tablename__ = "digital_twin_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=False, unique=True, index=True)
    twin_type: Mapped[str] = mapped_column(String(60), nullable=False, default="physics-informed")
    # High | Medium | Low
    fidelity: Mapped[str] = mapped_column(String(20), nullable=False, default="Medium")
    last_sync: Mapped[str] = mapped_column(String(30), nullable=False, default="")
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sync_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # healthy | warning | critical
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="healthy")
    model_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    operating_envelope: Mapped[list["OperatingEnvelopeParam"]] = relationship("OperatingEnvelopeParam", back_populates="twin", cascade="all, delete-orphan")
    scenarios: Mapped[list["TwinScenario"]] = relationship("TwinScenario", back_populates="twin", cascade="all, delete-orphan")


class OperatingEnvelopeParam(Base):
    __tablename__ = "operating_envelope_params"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    twin_id: Mapped[str] = mapped_column(String(36), ForeignKey("digital_twin_assets.id"), nullable=False, index=True)
    parameter_name: Mapped[str] = mapped_column(String(80), nullable=False)
    current_value: Mapped[float] = mapped_column(Float, nullable=False)
    normal_range_low: Mapped[float] = mapped_column(Float, nullable=False)
    normal_range_high: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    # normal | warning | alarm
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    twin: Mapped["DigitalTwinAsset"] = relationship("DigitalTwinAsset", back_populates="operating_envelope")


class TwinScenario(Base):
    __tablename__ = "twin_scenarios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    twin_id: Mapped[str] = mapped_column(String(36), ForeignKey("digital_twin_assets.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parameter_changes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    predicted_outcomes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    rul_delta_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    # positive | negative | neutral
    impact: Mapped[str] = mapped_column(String(20), nullable=False, default="neutral")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    twin: Mapped["DigitalTwinAsset"] = relationship("DigitalTwinAsset", back_populates="scenarios")
