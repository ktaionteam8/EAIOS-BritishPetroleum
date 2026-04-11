"""Sensor Reading model — time-series telemetry from equipment."""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


class SensorReading(Base):
    __tablename__ = "refiner_ai_sensor_readings"

    id: Mapped[uuid.UUID]           = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("refiner_ai_equipment.id"), nullable=False, index=True)
    parameter: Mapped[str]          = mapped_column(String(100), nullable=False, index=True)  # e.g. "vibration_rms"
    value: Mapped[float]            = mapped_column(Float, nullable=False)
    unit: Mapped[str]               = mapped_column(String(30), nullable=False)               # e.g. "mm/s"
    timestamp: Mapped[datetime]     = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<SensorReading {self.parameter}={self.value}{self.unit} @ {self.timestamp}>"
