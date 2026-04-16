"""ETS compliance calendar — EU ETS deadlines, allowance positions, surrender events."""
from sqlalchemy import String, Float, DateTime, Boolean, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base


class ArtemisETSDeadline(Base):
    __tablename__ = "artemis_ets_deadlines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheme: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # EU_ETS | UK_ETS | CA_CAP | RGGI
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)  # surrender | verification | reporting | auction
    description: Mapped[str] = mapped_column(Text, nullable=False)
    deadline_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    days_remaining: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    compliance_year: Mapped[int] = mapped_column(Integer, nullable=False)
    allowances_required: Mapped[float | None] = mapped_column(Float, nullable=True)
    allowances_held: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")  # high | medium | low
    responsible_team: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ETSDeadline {self.scheme} {self.event_type} {self.deadline_date.date()}>"


class ArtemisETSSurrenderEvent(Base):
    __tablename__ = "artemis_ets_surrender_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheme: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    compliance_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    verified_emissions_t: Mapped[float] = mapped_column(Float, nullable=False)
    allowances_surrendered: Mapped[float] = mapped_column(Float, nullable=False)
    surplus_deficit_t: Mapped[float] = mapped_column(Float, nullable=False)
    avg_price_eur: Mapped[float] = mapped_column(Float, nullable=False)
    total_cost_eur: Mapped[float] = mapped_column(Float, nullable=False)
    surrender_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ETSSurrender {self.scheme} {self.compliance_year}>"
