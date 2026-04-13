"""Offshore platforms, weather, subsea alerts, well integrity."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class OffshorePlatform(Base):
    __tablename__ = "offshore_platforms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(60), nullable=False, unique=True)
    field_name: Mapped[str] = mapped_column(String(80), nullable=False)
    # producing | maintenance | shutdown
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="producing")
    production_bopd: Mapped[float] = mapped_column(Float, nullable=False)
    uptime_pct: Mapped[float] = mapped_column(Float, nullable=False)
    active_wells: Mapped[int] = mapped_column(Integer, nullable=False)
    crew_count: Mapped[int] = mapped_column(Integer, nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    subsea_alerts: Mapped[list["SubseaAlert"]] = relationship("SubseaAlert", back_populates="platform", cascade="all, delete-orphan")
    well_integrity: Mapped[list["WellIntegrity"]] = relationship("WellIntegrity", back_populates="platform", cascade="all, delete-orphan")
    weather_forecasts: Mapped[list["WeatherForecast"]] = relationship("WeatherForecast", back_populates="platform", cascade="all, delete-orphan")


class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    platform_id: Mapped[str] = mapped_column(String(36), ForeignKey("offshore_platforms.id"), nullable=False, index=True)
    forecast_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    wave_height_m: Mapped[float] = mapped_column(Float, nullable=False)
    wind_speed_kt: Mapped[float] = mapped_column(Float, nullable=False)
    visibility_nm: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_workable: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    platform: Mapped["OffshorePlatform"] = relationship("OffshorePlatform", back_populates="weather_forecasts")


class SubseaAlert(Base):
    __tablename__ = "subsea_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    platform_id: Mapped[str] = mapped_column(String(36), ForeignKey("offshore_platforms.id"), nullable=False, index=True)
    asset_name: Mapped[str] = mapped_column(String(120), nullable=False)
    # christmas_tree | flowline | BOP | riser | pump | manifold
    asset_type: Mapped[str] = mapped_column(String(40), nullable=False)
    issue_description: Mapped[str] = mapped_column(Text, nullable=False)
    failure_probability_pct: Mapped[float] = mapped_column(Float, nullable=False)
    eta_days: Mapped[float] = mapped_column(Float, nullable=False)
    # critical | warning | advisory
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    # active | acknowledged | resolved
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    platform: Mapped["OffshorePlatform"] = relationship("OffshorePlatform", back_populates="subsea_alerts")


class WellIntegrity(Base):
    __tablename__ = "well_integrity"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    platform_id: Mapped[str] = mapped_column(String(36), ForeignKey("offshore_platforms.id"), nullable=False, index=True)
    well_name: Mapped[str] = mapped_column(String(20), nullable=False)
    barrier_type: Mapped[str] = mapped_column(String(40), nullable=False)
    annulus_pressure_bar: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_test_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # OK | WARN | CRIT
    status: Mapped[str] = mapped_column(String(10), nullable=False, default="OK")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    platform: Mapped["OffshorePlatform"] = relationship("OffshorePlatform", back_populates="well_integrity")


class VesselSchedule(Base):
    __tablename__ = "vessel_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vessel_name: Mapped[str] = mapped_column(String(80), nullable=False)
    # PSV | DSV | helicopter | AHTS
    vessel_type: Mapped[str] = mapped_column(String(30), nullable=False)
    platform_id: Mapped[str] = mapped_column(String(36), ForeignKey("offshore_platforms.id"), nullable=False, index=True)
    departure_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    arrival_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cargo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # scheduled | en-route | arrived | departed | cancelled
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
