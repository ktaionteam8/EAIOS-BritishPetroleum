"""Trade execution — approved/rejected arbitrage opportunities become trades with P&L."""
from sqlalchemy import String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base


class ArtemisTrade(Base):
    __tablename__ = "artemis_trades"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    commodity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    trade_type: Mapped[str] = mapped_column(String(50), nullable=False)  # buy | sell | spread
    volume_bbl: Mapped[float] = mapped_column(Float, nullable=False)
    entry_price: Mapped[float] = mapped_column(Float, nullable=False)
    exit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="open", index=True)
    approved_by: Mapped[str] = mapped_column(String(255), nullable=False)
    ai_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    realised_pnl_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    unrealised_pnl_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    trade_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    settlement_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ArtemisTrade {self.commodity} {self.trade_type} {self.status}>"
