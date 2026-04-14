"""ARTEMIS aviation models: airports, demand forecasts, and contract pipeline."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class ArtemisAviationAirport(Base):
    """Airport master data — reference table for demand forecasting."""
    __tablename__ = "artemis_aviation_airports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    iata_code: Mapped[str] = mapped_column(String(4), nullable=False, unique=True, index=True)
    airport_name: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    region: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    primary_airlines: Mapped[str | None] = mapped_column(Text, nullable=True)  # CSV
    bp_supply_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    def __repr__(self) -> str:
        return f"<ArtemisAviationAirport {self.iata_code} {self.airport_name}>"


class ArtemisAviationForecast(Base):
    """
    ARTEMIS-Aviation Agent demand forecast for a specific airport.
    One row per airport per forecast_date — updated daily.
    Horizons: 7-day, 30-day, 90-day.
    """
    __tablename__ = "artemis_aviation_forecasts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    airport_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    iata_code: Mapped[str] = mapped_column(String(4), nullable=False, index=True)
    forecast_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    # Actual 30-day consumption in megalitres
    d30_actual_ml: Mapped[float] = mapped_column(Float, nullable=False)
    d30_display: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "42.8ML"
    # 90-day forecast
    d90_forecast_ml: Mapped[float] = mapped_column(Float, nullable=False)
    d90_display: Mapped[str] = mapped_column(String(20), nullable=False)
    d90_delta_pct: Mapped[float] = mapped_column(Float, nullable=False)
    d90_delta_display: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "-3.7%"
    # Confidence interval (±%)
    confidence_interval_pct: Mapped[float] = mapped_column(Float, nullable=False, default=12.0)
    # Accuracy of this model version (MAPE %)
    model_mape_pct: Mapped[float] = mapped_column(Float, nullable=False, default=88.0)
    # Key driver signals used
    top_driver: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, index=True)

    def __repr__(self) -> str:
        return f"<ArtemisAviationForecast {self.iata_code} {self.forecast_date.date()}>"


class ArtemisAviationContract(Base):
    """
    Aviation fuel contract pipeline — tracks renewals and BP's negotiation position.
    ARTEMIS-Aviation Agent generates a Contract Negotiation Pack 90 days before expiry.
    """
    __tablename__ = "artemis_aviation_contracts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    airport_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    iata_code: Mapped[str] = mapped_column(String(4), nullable=False, index=True)
    airline: Mapped[str] = mapped_column(String(200), nullable=False)
    contract_type: Mapped[str] = mapped_column(String(20), nullable=False, default="index_linked")
    # active | renewal_due | expired | negotiating
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active", index=True)
    expiry_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    days_to_renewal: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    annual_volume_ml: Mapped[float | None] = mapped_column(Float, nullable=True)
    contract_value_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    # ARTEMIS recommended structure for renewal
    recommended_structure: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # P&L scenarios (USD)
    scenario_pessimistic_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    scenario_baseline_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    scenario_optimistic_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    pack_generated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    def __repr__(self) -> str:
        return f"<ArtemisAviationContract {self.iata_code} {self.airline} {self.status}>"
