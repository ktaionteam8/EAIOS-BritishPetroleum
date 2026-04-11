"""Spare Part model."""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


class SparePart(Base):
    __tablename__ = "refiner_ai_spare_parts"

    id: Mapped[uuid.UUID]         = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part_number: Mapped[str]      = mapped_column(String(100), nullable=False, unique=True, index=True)
    name: Mapped[str]             = mapped_column(String(500), nullable=False)
    category: Mapped[str]         = mapped_column(String(100), nullable=False, index=True)
    stock_level: Mapped[int]      = mapped_column(Integer, default=0)
    min_stock_level: Mapped[int]  = mapped_column(Integer, default=1)
    stock_status: Mapped[str]     = mapped_column(
        SAEnum("in-stock", "low-stock", "out-of-stock", "on-order", name="stock_status"),
        nullable=False, default="in-stock"
    )
    lead_time_days: Mapped[int]   = mapped_column(Integer, default=7)
    unit_cost: Mapped[float]      = mapped_column(Float, nullable=False)
    location: Mapped[str]         = mapped_column(String(255), nullable=True)
    last_ordered: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<SparePart {self.part_number} [{self.stock_status}]>"
