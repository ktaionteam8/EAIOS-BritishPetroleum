"""Price alert thresholds — notify when commodity spreads cross configured limits."""
from sqlalchemy import String, Float, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base


class ArtemisPriceAlert(Base):
    __tablename__ = "artemis_price_alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    commodity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    threshold_type: Mapped[str] = mapped_column(String(50), nullable=False)  # above | below | spread_above | spread_below
    threshold_value: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_triggered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    notification_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    recipients: Mapped[str] = mapped_column(Text, nullable=False)  # comma-separated emails
    triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<PriceAlert '{self.alert_name}' {self.commodity} {self.threshold_type} {self.threshold_value}>"


class ArtemisAlertEvent(Base):
    __tablename__ = "artemis_alert_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    commodity: Mapped[str] = mapped_column(String(100), nullable=False)
    threshold_value: Mapped[float] = mapped_column(Float, nullable=False)
    triggered_value: Mapped[float] = mapped_column(Float, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    recipients_notified: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<AlertEvent {self.commodity} triggered={self.triggered_value}>"
