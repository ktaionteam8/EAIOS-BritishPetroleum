"""Work Order model."""

import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from .database import Base


class WorkOrder(Base):
    __tablename__ = "refiner_ai_work_orders"

    id: Mapped[uuid.UUID]           = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str]              = mapped_column(String(500), nullable=False)
    equipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("refiner_ai_equipment.id"), nullable=False)
    priority: Mapped[str]           = mapped_column(SAEnum("critical", "high", "medium", "low", name="wo_priority"), nullable=False)
    status: Mapped[str]             = mapped_column(SAEnum("open", "in-progress", "completed", "cancelled", name="wo_status"), nullable=False, default="open")
    assigned_to: Mapped[str]        = mapped_column(String(255), nullable=True)
    estimated_hours: Mapped[int]    = mapped_column(Integer, nullable=True)
    ai_generated: Mapped[bool]      = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime]    = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    due_date: Mapped[datetime]      = mapped_column(DateTime(timezone=True), nullable=True)

    equipment = relationship("Equipment", lazy="selectin")

    def __repr__(self) -> str:
        return f"<WorkOrder [{self.priority}] {self.title}>"
