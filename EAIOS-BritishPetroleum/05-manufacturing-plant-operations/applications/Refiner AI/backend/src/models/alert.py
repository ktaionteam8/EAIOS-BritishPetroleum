"""Alert model."""

import uuid
from datetime import datetime
from sqlalchemy import Boolean, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


class Alert(Base):
    __tablename__ = "refiner_ai_alerts"

    id: Mapped[uuid.UUID]           = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    severity: Mapped[str]           = mapped_column(SAEnum("critical", "warning", "advisory", name="alert_severity"), nullable=False, index=True)
    title: Mapped[str]              = mapped_column(String(500), nullable=False)
    equipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("refiner_ai_equipment.id"), nullable=False)
    details: Mapped[str | None]      = mapped_column(Text, nullable=True)
    rul_hours: Mapped[float | None]  = mapped_column(Float, nullable=True)
    confidence: Mapped[float]        = mapped_column(Float, nullable=False)
    model_used: Mapped[str | None]   = mapped_column(String(100), nullable=True)
    is_resolved: Mapped[bool]       = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime]    = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime]    = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    equipment = relationship("Equipment", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Alert [{self.severity}] {self.title}>"
