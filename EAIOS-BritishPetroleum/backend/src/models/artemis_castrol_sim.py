"""Castrol margin simulation — what-if pricing scenarios before approving price changes."""
from sqlalchemy import String, Float, DateTime, Boolean, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base


class ArtemisCastrolSimulation(Base):
    __tablename__ = "artemis_castrol_simulations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft", index=True)  # draft | running | completed | approved | rejected
    sku_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    market_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_price_change_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    projected_margin_impact_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    projected_volume_impact_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    approved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<CastrolSim '{self.simulation_name}' {self.status}>"


class ArtemisCastrolSimLine(Base):
    __tablename__ = "artemis_castrol_sim_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    simulation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    sku_code: Mapped[str] = mapped_column(String(100), nullable=False)
    sku_name: Mapped[str] = mapped_column(String(255), nullable=False)
    geography: Mapped[str] = mapped_column(String(100), nullable=False)
    current_price: Mapped[float] = mapped_column(Float, nullable=False)
    proposed_price: Mapped[float] = mapped_column(Float, nullable=False)
    change_pct: Mapped[float] = mapped_column(Float, nullable=False)
    current_margin_pct: Mapped[float] = mapped_column(Float, nullable=False)
    projected_margin_pct: Mapped[float] = mapped_column(Float, nullable=False)
    volume_elasticity: Mapped[float] = mapped_column(Float, nullable=False, default=-0.3)
    projected_volume_change_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<SimLine {self.sku_code} {self.change_pct:+.1f}%>"
