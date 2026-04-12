"""Equipment model."""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


class Equipment(Base):
    __tablename__ = "refiner_ai_equipment"

    id: Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tag: Mapped[str]            = mapped_column(String(50), nullable=False, unique=True, index=True)
    name: Mapped[str]           = mapped_column(String(255), nullable=False)
    manufacturer: Mapped[str]   = mapped_column(String(255), nullable=False)
    model: Mapped[str]          = mapped_column(String(255), nullable=False)
    site_id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), ForeignKey("refiner_ai_refineries.id"), nullable=False)
    health_score: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    rul_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Remaining Useful Life in hours
    ai_status: Mapped[str]      = mapped_column(
        SAEnum("CRITICAL", "WARNING", "ADVISORY", "HEALTHY", "MONITORING", name="ai_status"),
        nullable=False, default="HEALTHY"
    )
    action: Mapped[str]         = mapped_column(
        SAEnum("Dispatch", "Schedule", "Monitor", "Inspect", name="action_type"),
        nullable=False, default="Monitor"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    site = relationship("Refinery", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Equipment {self.tag} [{self.ai_status}]>"
