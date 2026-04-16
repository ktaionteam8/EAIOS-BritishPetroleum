"""Counterparty management — airlines, trading houses, credit limits, contract expiry."""
from sqlalchemy import String, Float, DateTime, Boolean, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base


class ArtemisCounterparty(Base):
    __tablename__ = "artemis_counterparties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    counterparty_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # airline | trading_house | refiner | utility
    credit_rating: Mapped[str | None] = mapped_column(String(20), nullable=True)
    credit_limit_usd: Mapped[float] = mapped_column(Float, nullable=False)
    current_exposure_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    relationship_manager: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Counterparty {self.name} [{self.counterparty_type}]>"


class ArtemisCounterpartyContract(Base):
    __tablename__ = "artemis_counterparty_contracts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    counterparty_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    contract_reference: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    commodity: Mapped[str] = mapped_column(String(100), nullable=False)
    contract_value_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expiry_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    days_to_expiry: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    renewal_recommended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Contract {self.contract_reference} expires {self.expiry_date.date()}>"
