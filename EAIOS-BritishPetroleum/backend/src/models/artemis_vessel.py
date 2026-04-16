"""Vessel/cargo tracking — link LNG/crude trades to AIS vessel positions."""
from sqlalchemy import String, Float, DateTime, Boolean, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base


class ArtemisVessel(Base):
    __tablename__ = "artemis_vessels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vessel_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    imo_number: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    vessel_type: Mapped[str] = mapped_column(String(50), nullable=False)  # LNG_tanker | crude_tanker | product_tanker | VLCC
    flag: Mapped[str] = mapped_column(String(100), nullable=False)
    dwt_tonnes: Mapped[float | None] = mapped_column(Float, nullable=True)
    linked_trade_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    cargo_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cargo_volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="at_sea", index=True)  # at_sea | loading | discharging | anchored | idle
    current_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_port: Mapped[str | None] = mapped_column(String(255), nullable=True)
    destination_port: Mapped[str | None] = mapped_column(String(255), nullable=True)
    eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_ais_update: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    speed_knots: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Vessel '{self.vessel_name}' IMO:{self.imo_number} {self.status}>"
