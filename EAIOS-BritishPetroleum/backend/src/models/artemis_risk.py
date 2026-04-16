"""Risk management — VaR snapshots, position limits, exposure tracking."""
from sqlalchemy import String, Float, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base


class ArtemisPositionLimit(Base):
    __tablename__ = "artemis_position_limits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commodity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    desk: Mapped[str] = mapped_column(String(100), nullable=False)
    limit_usd: Mapped[float] = mapped_column(Float, nullable=False)
    current_exposure_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    utilisation_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_breached: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<PositionLimit {self.commodity} {self.utilisation_pct:.1f}%>"


class ArtemisVaRSnapshot(Base):
    __tablename__ = "artemis_var_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    snapshot_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    portfolio: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    var_1d_95_usd: Mapped[float] = mapped_column(Float, nullable=False)
    var_1d_99_usd: Mapped[float] = mapped_column(Float, nullable=False)
    var_10d_95_usd: Mapped[float] = mapped_column(Float, nullable=False)
    cvar_usd: Mapped[float] = mapped_column(Float, nullable=False)
    gross_exposure_usd: Mapped[float] = mapped_column(Float, nullable=False)
    net_exposure_usd: Mapped[float] = mapped_column(Float, nullable=False)
    method: Mapped[str] = mapped_column(String(50), nullable=False, default="historical_simulation")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<VaR {self.portfolio} 1d95=${self.var_1d_95_usd:,.0f}>"
