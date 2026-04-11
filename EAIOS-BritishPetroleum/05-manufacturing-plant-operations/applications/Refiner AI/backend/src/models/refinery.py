"""Refinery / Site model."""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


class Refinery(Base):
    __tablename__ = "refiner_ai_refineries"

    id: Mapped[uuid.UUID]    = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str]        = mapped_column(String(255), nullable=False, index=True)
    location: Mapped[str]    = mapped_column(String(255), nullable=False)
    country: Mapped[str]     = mapped_column(String(100), nullable=False, index=True)
    lat: Mapped[float]       = mapped_column(Float, nullable=False)
    lng: Mapped[float]       = mapped_column(Float, nullable=False)
    status: Mapped[str]      = mapped_column(SAEnum("healthy", "warning", "critical", name="site_status"), nullable=False, default="healthy")
    asset_count: Mapped[int] = mapped_column(Integer, default=0)
    critical_alerts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Refinery {self.name} [{self.status}]>"
