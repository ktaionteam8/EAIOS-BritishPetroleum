"""Core domain models: sites, users, equipment, sensor readings."""
import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    country: Mapped[str] = mapped_column(String(80), nullable=False)
    region: Mapped[str] = mapped_column(String(80), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    # healthy | warning | critical
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="healthy")
    refinery_type: Mapped[str] = mapped_column(String(80), nullable=True)
    capacity_kbpd: Mapped[float] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    equipment: Mapped[list["Equipment"]] = relationship("Equipment", back_populates="site")

    def __repr__(self) -> str:
        return f"<Site {self.code} {self.name}>"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # admin | engineer | operator | viewer
    role: Mapped[str] = mapped_column(String(40), nullable=False, default="engineer")
    site_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sites.id"), nullable=True)
    department: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tag: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(80), nullable=False)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    manufacturer: Mapped[str | None] = mapped_column(String(120), nullable=True)
    model_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    installation_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    design_life_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # current health 0–100
    health_score: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    # remaining useful life in hours
    rul_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    # healthy | warning | critical
    ai_status: Mapped[str] = mapped_column(String(20), nullable=False, default="healthy")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    extra: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    site: Mapped["Site"] = relationship("Site", back_populates="equipment")

    def __repr__(self) -> str:
        return f"<Equipment {self.tag} {self.name}>"


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"), nullable=False, index=True)
    tag_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    # vibration | temperature | pressure | current | flow | other
    sensor_type: Mapped[str] = mapped_column(String(40), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now, index=True)
    quality: Mapped[str] = mapped_column(String(20), nullable=False, default="good")

    def __repr__(self) -> str:
        return f"<SensorReading {self.tag_name}={self.value}{self.unit}>"
